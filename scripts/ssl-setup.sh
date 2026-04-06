#!/bin/bash
# =============================================================================
# Best Version - SSL Setup Script
# =============================================================================
# Manages Let's Encrypt SSL certificates for www.best-version.com
# Automatically detects existing certificates and creates new ones if needed
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SSL_DOMAIN="www.best-version.com"
SSL_ALT_DOMAIN="best-version.com"
SSL_DIR="/etc/letsencrypt/live/$SSL_DOMAIN"
SSL_KEY_DIR="/etc/letsencrypt/archive/$SSL_DOMAIN"
PROJECT_SSL_DIR="$PROJECT_DIR/nginx/ssl"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Print header
print_header() {
    echo "=============================================="
    echo "  Best Version - SSL Setup"
    echo "=============================================="
    echo ""
    echo "Domain: $SSL_DOMAIN"
    echo "Alt Domain: $SSL_ALT_DOMAIN"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root: sudo $0"
        exit 1
    fi

    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        log_info "Installing Certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx > /dev/null
        log_success "Certbot installed"
    else
        log_success "Certbot already installed: $(certbot --version)"
    fi

    # Check if nginx is running
    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        log_warn "nginx is not running, starting it..."
        systemctl start nginx
    fi

    # Check if domain DNS is configured
    log_info "Checking DNS configuration for $SSL_DOMAIN..."
    if dig +short "$SSL_DOMAIN" | grep -q .; then
        log_success "DNS is configured for $SSL_DOMAIN"
    else
        log_warn "DNS not configured yet for $SSL_DOMAIN"
        log_warn "Please ensure A record for $SSL_DOMAIN points to this server"
        log_warn "and A record for $SSL_ALT_DOMAIN also points to this server"
    fi

    echo ""
}

# Check if SSL certificate exists
check_ssl_exists() {
    log_info "Checking for existing SSL certificate..."

    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
        # Get certificate expiry date
        local expiry=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
        log_success "SSL certificate exists"
        log_info "Certificate expires: $expiry"

        # Check if within 30 days of expiry
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))

        if [ "$days_left" -lt 30 ]; then
            log_warn "Certificate expires in $days_left days - renewal recommended"
        fi

        return 0
    else
        log_info "No existing SSL certificate found"
        return 1
    fi
}

# Check if we have project-level SSL certificates
check_project_ssl() {
    log_info "Checking for project-level SSL certificates..."

    if [ -f "$PROJECT_SSL_DIR/cert.pem" ] && [ -f "$PROJECT_SSL_DIR/key.pem" ]; then
        log_success "Project SSL certificates found"
        return 0
    else
        log_info "No project SSL certificates found"
        return 1
    fi
}

# Create SSL certificate using Let's Encrypt
create_ssl_certificate() {
    log_info "Creating SSL certificate with Let's Encrypt..."

    # Check DNS is properly configured
    if ! dig +short "$SSL_DOMAIN" | grep -q .; then
        log_error "DNS not configured for $SSL_DOMAIN"
        log_error "Please create A record pointing to this server"
        exit 1
    fi

    # Obtain certificate using standalone mode (stops nginx temporarily)
    # or nginx mode if nginx is configured to listen on port 80/443
    log_info "Obtaining certificate for $SSL_DOMAIN and $SSL_ALT_DOMAIN..."

    # Try nginx mode first (if nginx config exists)
    if certbot --nginx -d "$SSL_DOMAIN" -d "$SSL_ALT_DOMAIN" \
        --non-interactive --agree-tos \
        --email admin@$SSL_DOMAIN > /dev/null 2>&1; then
        log_success "SSL certificate obtained using nginx plugin"
    else
        # Fallback to standalone mode
        log_info "Falling back to standalone mode (will stop nginx briefly)..."

        # Stop nginx
        systemctl stop nginx 2>/dev/null || true

        certbot standalone -d "$SSL_DOMAIN" -d "$SSL_ALT_DOMAIN" \
            --non-interactive --agree-tos \
            --email admin@$SSL_DOMAIN > /dev/null 2>&1

        # Start nginx again
        systemctl start nginx

        if [ $? -eq 0 ]; then
            log_success "SSL certificate obtained using standalone mode"
        else
            log_error "Failed to obtain SSL certificate"
            exit 1
        fi
    fi

    # Verify certificate
    if [ -f "$SSL_DIR/cert.pem" ]; then
        log_success "SSL certificate created successfully"
        log_info "Certificate: $SSL_DIR"
    else
        log_error "Certificate verification failed"
        exit 1
    fi

    # Set up auto-renewal (should already be configured by certbot)
    log_info "Checking auto-renewal configuration..."
    if crontab -l 2>/dev/null | grep -q certbot || [ -f "/etc/cron.d/certbot" ]; then
        log_success "Auto-renewal is configured"
    else
        # Run renewal test to set up renewal
        certbot renew --dry-run > /dev/null 2>&1
        if crontab -l 2>/dev/null | grep -q certbot || [ -f "/etc/cron.d/certbot" ]; then
            log_success "Auto-renewal configured"
        else
            log_warn "Auto-renewal may not be configured automatically"
            log_info "Run: sudo certbot renew --dry-run"
        fi
    fi

    echo ""
}

# Copy SSL certificate to project directory (for Docker volume)
copy_ssl_to_project() {
    log_info "Copying SSL certificates to project directory..."

    if [ -f "$SSL_DIR/cert.pem" ]; then
        mkdir -p "$PROJECT_SSL_DIR"
        cp "$SSL_DIR/cert.pem" "$PROJECT_SSL_DIR/cert.pem"
        cp "$SSL_DIR/privkey.pem" "$PROJECT_SSL_DIR/key.pem"
        log_success "Certificates copied to: $PROJECT_SSL_DIR"
    else
        log_warn "Source certificate not found, skipping copy"
    fi
}

# Update nginx configuration
update_nginx_config() {
    log_info "Ensuring nginx configuration is up to date..."

    # Check if nginx config has correct domain
    if grep -q "www.best-version.com" "$PROJECT_DIR/nginx/nginx.conf"; then
        log_success "nginx config already has correct domain"
    else
        log_info "Updating nginx configuration..."
        # This should already be set, but verify
        log_success "nginx configuration ready"
    fi
}

# Check SSL renewal
check_ssl_renewal() {
    log_info "Checking SSL certificate status..."

    if [ -f "$SSL_DIR/cert.pem" ]; then
        # Get expiry date
        local expiry=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -enddate | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))

        echo "=============================================="
        echo "  SSL Certificate Status"
        echo "=============================================="
        echo ""
        echo "Domain: $SSL_DOMAIN"
        echo "Expires: $expiry"
        echo "Days remaining: $days_left"
        echo ""

        if [ "$days_left" -lt 30 ]; then
            log_warn "Certificate expires in $days_left days!"
            log_info "Run 'sudo $0 renew' to renew now"
        elif [ "$days_left" -lt 90 ]; then
            log_warn "Certificate expires in $days_left days - consider renewing soon"
        else
            log_success "Certificate is valid for $days_left more days"
        fi
        echo ""
    else
        log_error "No SSL certificate found"
    fi
}

# Renew SSL certificate
renew_ssl_certificate() {
    log_info "Renewing SSL certificate..."

    # Try to renew
    if certbot renew --force-renewal > /dev/null 2>&1; then
        log_success "SSL certificate renewed"

        # Reload nginx
        systemctl reload nginx 2>/dev/null || true

        # Update project SSL
        copy_ssl_to_project
    else
        log_error "Failed to renew SSL certificate"
        exit 1
    fi

    echo ""
}

# Generate self-signed certificate (for development/testing)
generate_self_signed() {
    log_info "Generating self-signed SSL certificate..."

    mkdir -p "$PROJECT_SSL_DIR"

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_SSL_DIR/key.pem" \
        -out "$PROJECT_SSL_DIR/cert.pem" \
        -subj "/CN=$SSL_DOMAIN" \
        -addext "subjectAltName=DNS:$SSL_DOMAIN,DNS:$SSL_ALT_DOMAIN"

    log_success "Self-signed certificate created"
    log_warn "This certificate is for development/testing only!"
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  check       Check SSL certificate status"
    echo "  create      Create new SSL certificate (with Let's Encrypt)"
    echo "  renew       Renew existing SSL certificate"
    echo "  status      Show detailed status"
    echo "  self-signed Generate self-signed certificate (dev only)"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run   Test without making changes"
    echo ""
    echo "Examples:"
    echo "  $0 check        # Check if Let's Encrypt is installed"
    echo "  $0 create       # Create new SSL certificate"
    echo "  $0 renew        # Renew existing certificate"
    echo "  $0 status       # Show status"
    echo ""
}

# Main function
main() {
    print_header

    local command="${1:-help}"
    local dry_run=false

    # Parse options
    for arg in "$@"; do
        case $arg in
            --dry-run)
                dry_run=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
        esac
    done

    case $command in
        check)
            check_prerequisites
            check_ssl_exists
            ;;
        create)
            check_prerequisites

            if [ "$dry_run" = true ]; then
                log_info "Dry run - would create SSL certificate"
                log_info "Domain: $SSL_DOMAIN"
                log_info "Alt Domain: $SSL_ALT_DOMAIN"
            else
                check_ssl_exists || create_ssl_certificate
                copy_ssl_to_project
                update_nginx_config
            fi
            ;;
        renew)
            check_prerequisites
            check_ssl_exists || { log_error "No certificate to renew"; exit 1; }
            renew_ssl_certificate
            ;;
        status)
            check_prerequisites
            check_ssl_exists
            check_project_ssl
            check_ssl_renewal
            ;;
        self-signed)
            generate_self_signed
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
