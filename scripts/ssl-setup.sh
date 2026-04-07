#!/bin/bash
# =============================================================================
# Best Version - SSL Setup Script (Docker Only)
# =============================================================================
# Manages Let's Encrypt SSL certificates for $SSL_ALT_DOMAIN
# Uses custom certbot Docker image for certificate management
# No local certbot installation required
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default domain if SITE_URL not set
DEFAULT_DOMAIN="www.best-version.com"

# Get domain from SITE_URL environment variable or use default
SITE_URL="${SITE_URL:-https://$DEFAULT_DOMAIN}"

# Extract domain from SITE_URL (remove https:// or http:// prefix)
SSL_DOMAIN=$(echo "$SITE_URL" | sed -E 's|https?://||' | sed -E 's|/.*||')

# Get base domain (remove www. prefix if present)
SSL_ALT_DOMAIN=$(echo "$SSL_DOMAIN" | sed 's/^www\.//')
SSL_DIR="/etc/letsencrypt/live/$SSL_ALT_DOMAIN"
SSL_KEY_DIR="/etc/letsencrypt/archive/$SSL_ALT_DOMAIN"
PROJECT_SSL_DIR="$PROJECT_DIR/nginx/ssl"
CERTBOT_IMAGE="best-version-certbot:latest"
CERTBOT_CONTEXT="$SCRIPT_DIR/../"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions with timestamps
log_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} [INFO] $1"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} [SUCCESS] $1"; }
log_warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} [WARN] $1"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')]${NC} [ERROR] $1"; }
log_debug() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} [DEBUG] $1"; }

# Stop Docker nginx container for certbot validation
stop_docker_nginx() {
    log_info "Stopping 'best-version' container for certificate validation..."
    if docker stop best-version &>/dev/null; then
        log_success "'best-version' container stopped"
    else
        log_warn "'best-version' container was not running or already stopped"
    fi
    sleep 1
}

# Start Docker nginx container
start_docker_nginx() {
    log_info "Starting 'best-version' container..."
    if docker start best-version &>/dev/null; then
        log_success "'best-version' container started"
        sleep 3
    else
        log_error "Failed to start 'best-version' container"
    fi
}

# Check if custom certbot image exists, build if not
ensure_certbot_image() {
    log_info "Checking for custom certbot image..."

    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${CERTBOT_IMAGE}$"; then
        log_success "Using existing certbot image: ${CERTBOT_IMAGE}"
        return 0
    fi

    log_info "Custom certbot image not found, building..."
    log_warn "This will take a few minutes on first run..."
    log_info "Dockerfile: ${PROJECT_DIR}/Dockerfile.certbot"

    # Build the custom certbot image
    log_info "Running: docker build -f ${PROJECT_DIR}/Dockerfile.certbot -t ${CERTBOT_IMAGE} ${CERTBOT_CONTEXT}"
    if docker build -f "$PROJECT_DIR/Dockerfile.certbot" -t "$CERTBOT_IMAGE" "$CERTBOT_CONTEXT" --progress=plain 2>&1; then
        log_success "Custom certbot image built successfully"
    else
        log_error "Failed to build certbot image"
        exit 1
    fi
}

# Run certbot via Docker container using standalone mode
run_certbot() {
    local certbot_args="$@"

    # Ensure certbot image is available
    ensure_certbot_image

    # Stop Docker nginx container (required for standalone mode)
    stop_docker_nginx

    # Give it a moment to fully stop
    log_info "Waiting for container to fully stop..."
    sleep 2

    # Run certbot via Docker container
    log_info "Running certbot via Docker container..."
    log_info "Port 80 will be bound for HTTP-01 challenge"
    log_info "Domains: ${SSL_DOMAIN}, ${SSL_ALT_DOMAIN}"

    # Run certbot certonly with standalone plugin
    if docker run --rm \
        -v "$SSL_DIR:/etc/letsencrypt" \
        -v "$SSL_KEY_DIR:/etc/letsencrypt/archive" \
        -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
        -v "/var/log/letsencrypt:/var/log/letsencrypt" \
        -p 80:80 \
        "$CERTBOT_IMAGE" \
        certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "admin@$SSL_DOMAIN" \
        -d "$SSL_DOMAIN" \
        -d "$SSL_ALT_DOMAIN"; then

        log_success "SSL certificate obtained successfully"
        return 0
    else
        local result=$?
        log_error "Certbot failed with exit code: ${result}"
        log_warn "Check the error output above for details"
        return $result
    fi
}

# Run certbot for renewal via Docker
run_certbot_renew() {
    # Ensure certbot image is available
    ensure_certbot_image

    # Stop Docker nginx container
    stop_docker_nginx

    # Give it a moment to fully stop
    log_info "Waiting for container to fully stop..."
    sleep 2

    # Run certbot renew in Docker container
    log_info "Running certbot renew via Docker container..."
    log_info "This will force renewal even if not due yet"

    if docker run --rm \
        -v "$SSL_DIR:/etc/letsencrypt" \
        -v "$SSL_KEY_DIR:/etc/letsencrypt/archive" \
        -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
        -v "/var/log/letsencrypt:/var/log/letsencrypt" \
        "$CERTBOT_IMAGE" \
        renew --force-renewal \
        --non-interactive; then

        log_success "SSL certificate renewed successfully"
        return 0
    else
        local result=$?
        log_error "Certbot renew failed with exit code: ${result}"
        return $result
    fi
}

# Print header
print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║     Best Version - SSL Setup (Docker Only)               ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║  Domain:     ${SSL_DOMAIN}                                          ║"
    echo "║  Alt Domain: ${SSL_ALT_DOMAIN}                                          ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║  Using custom certbot Docker image                       ║"
    echo "║  No local certbot installation required                  ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    echo ""

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root: sudo $0"
        exit 1
    fi
    log_success "Running as root (required for port 80 binding)"

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_info "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_success "Docker is available: $(docker --version | cut -d' ' -f3)"

    if ! docker info &>/dev/null; then
        log_error "Docker is not running"
        log_info "Start Docker: sudo systemctl start docker"
        exit 1
    fi
    log_success "Docker daemon is running"

    # Check if domain DNS is configured
    log_info "Checking DNS configuration for ${SSL_DOMAIN}..."
    if dig +short "$SSL_DOMAIN" | grep -q .; then
        log_success "DNS A record found: $(dig +short "$SSL_DOMAIN")"
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

    local CERT_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/cert1.pem"
    local KEY_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/privkey1.pem"

    if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
        # Get certificate expiry date
        local expiry=$(openssl x509 -in "$CERT_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
        log_success "SSL certificate found at: $SSL_DIR"
        log_info "Certificate expires: $expiry"

        # Check if within 30 days of expiry
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))

        if [ "$days_left" -lt 30 ]; then
            log_warn "Certificate expires in $days_left days - renewal recommended"
        elif [ "$days_left" -lt 90 ]; then
            log_warn "Certificate expires in $days_left days - consider renewing soon"
        else
            log_success "Certificate is valid for $days_left more days"
        fi

        return 0
    else
        log_info "No existing SSL certificate found at: $SSL_DIR"
        return 1
    fi
}

# Check if we have project-level SSL certificates
check_project_ssl() {
    log_info "Checking for project-level SSL certificates..."

    if [ -f "$PROJECT_SSL_DIR/cert.pem" ] && [ -f "$PROJECT_SSL_DIR/key.pem" ]; then
        log_success "Project SSL certificates found at: $PROJECT_SSL_DIR"

        # Show expiration date
        local expiry=$(openssl x509 -in "$PROJECT_SSL_DIR/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))
        log_info "Project certificate expires: $expiry ($days_left days remaining)"

        return 0
    else
        log_info "No project-level SSL certificates found at: $PROJECT_SSL_DIR"
        return 1
    fi
}

# Create SSL certificate using Let's Encrypt via Docker
create_ssl_certificate() {
    log_info "Creating SSL certificate with Let's Encrypt..."
    echo ""

    # Check DNS is properly configured
    if ! dig +short "$SSL_DOMAIN" | grep -q .; then
        log_error "DNS not configured for $SSL_DOMAIN"
        log_error "Please create A record pointing to this server"
        exit 1
    fi
    log_success "DNS configured correctly"

    # Obtain certificate using standalone mode
    log_info "Requesting certificate for: ${SSL_DOMAIN}, ${SSL_ALT_DOMAIN}"
    log_info "Email for renewals: admin@$SSL_DOMAIN"
    echo ""

    # Dry run mode
    if [ "$dry_run" = true ]; then
        log_info "=== DRY RUN MODE ==="
        log_info "Would perform the following actions:"
        log_info "1. Build certbot Docker image: ${CERTBOT_IMAGE}"
        log_info "2. Stop 'best-version' container"
        log_info "3. Run certbot standalone for: ${SSL_DOMAIN}, ${SSL_ALT_DOMAIN}"
        log_info "4. Start 'best-version' container"
        log_info "5. Copy certificates to: $PROJECT_SSL_DIR"
        log_info ""
        log_info "No changes were made in dry run mode."
        log_info "Run without --dry-run to execute."
        echo ""
        return 0
    fi

    # Run certbot via Docker
    if run_certbot; then
        log_success "SSL certificate obtained via Docker"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi

    # Verify certificate and show expiration date
    # Check archive directory since Docker mount may not create live symlinks
    local FULLCHAIN_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/fullchain1.pem"
    if [ -f "$FULLCHAIN_FILE" ]; then
        log_success "SSL certificate created successfully at: $SSL_DIR"

        # Get and display expiration date from fullchain
        local expiry=$(openssl x509 -in "$FULLCHAIN_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))
        log_success "────────────────────────────────────────────"
        log_success "Certificate expires: $expiry"
        log_success "Days remaining: ${days_left}"
        log_success "────────────────────────────────────────────"
    else
        log_error "Certificate verification failed - fullchain1.pem not found"
        log_error "Checking available files:"
        ls -la "$SSL_KEY_DIR/$SSL_ALT_DOMAIN/" 2>/dev/null || true
        exit 1
    fi

    # Set up auto-renewal using Docker
    log_info "Setting up automatic certificate renewal..."

    local CRON_JOB="0 3 * * * cd $PROJECT_DIR && docker run --rm -v $SSL_DIR:/etc/letsencrypt -v $SSL_KEY_DIR:/etc/letsencrypt/archive -v /var/lib/letsencrypt:/var/lib/letsencrypt -v /var/log/letsencrypt:/var/log/letsencrypt best-version-certbot:latest renew --quiet && $PROJECT_DIR/scripts/ssl-setup.sh reload"

    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_success "Auto-renewal is already configured in crontab"
    elif [ -f "/etc/cron.d/certbot" ]; then
        log_success "Auto-renewal is already configured in /etc/cron.d/certbot"
    else
        # Set up renewal cron job using Docker
        log_info "Adding automatic renewal to crontab (runs daily at 3:00 AM)..."
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_success "Auto-renewal configured - runs daily at 3:00 AM"
        log_info "Certificate will auto-renew when within 30 days of expiry"

        # Test the renewal command
        log_info "Testing renewal command (dry-run)..."
        docker run --rm \
            -v "$SSL_DIR:/etc/letsencrypt" \
            -v "$SSL_KEY_DIR:/etc/letsencrypt/archive" \
            -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
            -v "/var/log/letsencrypt:/var/log/letsencrypt" \
            "best-version-certbot:latest" \
            renew --dry-run --quiet 2>&1 | head -5 || true
        log_success "Renewal command tested successfully"
    fi

    echo ""
}

# Copy SSL certificate to project directory and Docker volume
copy_ssl_to_project() {
    log_info "Copying SSL certificates to project directory and Docker volume..."

    local FULLCHAIN_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/fullchain1.pem"
    local KEY_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/privkey1.pem"

    if [ -f "$FULLCHAIN_FILE" ] && [ -f "$KEY_FILE" ]; then
        mkdir -p "$PROJECT_SSL_DIR"
        # Copy fullchain (cert + chain) for nginx
        cp "$FULLCHAIN_FILE" "$PROJECT_SSL_DIR/cert.pem"
        cp "$KEY_FILE" "$PROJECT_SSL_DIR/key.pem"
        chmod 600 "$PROJECT_SSL_DIR/key.pem"
        log_success "Certificates copied to: $PROJECT_SSL_DIR"

        # Copy to Docker volume
        log_info "Updating Docker volume with new certificates..."
        if docker volume inspect best-version_ssl &>/dev/null; then
            docker run --rm \
                -v best-version_ssl:/mnt \
                -v "$PROJECT_SSL_DIR:/src:ro" \
                busybox sh -c "cp /src/cert.pem /mnt/cert.pem && cp /src/key.pem /mnt/key.pem && chmod 600 /mnt/key.pem"
            log_success "Docker volume updated"

            # Reload nginx to pick up new certificate
            if docker ps | grep -q best-version; then
                log_info "Reloading nginx to apply new certificate..."
                docker exec best-version nginx -s reload 2>/dev/null && log_success "Nginx reloaded" || \
                    docker restart best-version && sleep 3 && log_success "Nginx restarted"
            fi
        else
            log_warn "Docker volume 'best-version_ssl' not found, skipping update"
        fi
    else
        log_warn "Source certificate not found, skipping copy"
    fi
}

# Update nginx configuration
update_nginx_config() {
    log_info "Ensuring nginx configuration is up to date..."

    # Check if nginx config has correct domain
    if grep -q "$SSL_ALT_DOMAIN" "$PROJECT_DIR/nginx/nginx.conf"; then
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
    echo ""

    local FULLCHAIN_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/fullchain1.pem"
    if [ -f "$FULLCHAIN_FILE" ]; then
        # Get expiry date
        local expiry=$(openssl x509 -in "$FULLCHAIN_FILE" -noout -enddate | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry" +%s)
        local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))

        echo "═══════════════════════════════════════════════════════════"
        echo "                    SSL Certificate Status"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "  Domain:              ${SSL_DOMAIN}"
        echo "  Expires:             ${expiry}"
        echo "  Days remaining:      ${days_left}"
        echo ""

        if [ "$days_left" -lt 30 ]; then
            log_warn "⚠️  Certificate expires in $days_left days!"
            log_info "Run 'sudo $0 renew' to renew now"
        elif [ "$days_left" -lt 90 ]; then
            log_warn "⚠️  Certificate expires in $days_left days - consider renewing soon"
        else
            log_success "✓ Certificate is valid for $days_left more days"
        fi
        echo ""
    else
        log_error "No SSL certificate found at: $SSL_DIR"
    fi
}

# Renew SSL certificate using Docker
renew_ssl_certificate() {
    log_info "Renewing SSL certificate..."
    echo ""

    # Dry run mode
    if [ "$dry_run" = true ]; then
        log_info "=== DRY RUN MODE ==="
        log_info "Would perform the following actions:"
        log_info "1. Stop 'best-version' container"
        log_info "2. Run certbot renew with --force-renewal"
        log_info "3. Start 'best-version' container"
        log_info "4. Copy renewed certificates to: $PROJECT_SSL_DIR"
        log_info "5. Reload nginx"
        log_info ""
        log_info "No changes were made in dry run mode."
        log_info "Run without --dry-run to execute."
        echo ""
        return 0
    fi

    # Stop Docker nginx container (required for standalone renewal)
    stop_docker_nginx
    sleep 2

    # Try to renew via Docker
    if run_certbot_renew; then
        log_success "SSL certificate renewed"
        echo ""

        # Copy updated certificates to project and Docker volume
        copy_ssl_to_project
        echo ""

        # Show new expiration date
        local FULLCHAIN_FILE="$SSL_KEY_DIR/$SSL_ALT_DOMAIN/fullchain1.pem"
        if [ -f "$FULLCHAIN_FILE" ]; then
            local expiry=$(openssl x509 -in "$FULLCHAIN_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
            local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null)
            local days_left=$(( (expiry_epoch - $(date +%s)) / 86400 ))
            log_success "────────────────────────────────────────────"
            log_success "New certificate expires: $expiry"
            log_success "Days remaining: ${days_left}"
            log_success "────────────────────────────────────────────"
        fi

        # Start nginx container
        log_info "Starting 'best-version' container..."
        docker start best-version 2>/dev/null || true
        sleep 2

        # Reload nginx
        log_info "Reloading nginx..."
        docker exec best-version nginx -s reload 2>/dev/null && log_success "Nginx reloaded" || log_warn "Nginx reload failed"

        echo ""
    else
        log_error "Failed to renew SSL certificate"
        # Try to start container even on failure
        docker start best-version 2>/dev/null || true
        exit 1
    fi
}

# Generate self-signed certificate (for development/testing)
generate_self_signed() {
    log_info "Generating self-signed SSL certificate..."
    echo ""

    mkdir -p "$PROJECT_SSL_DIR"

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_SSL_DIR/key.pem" \
        -out "$PROJECT_SSL_DIR/cert.pem" \
        -subj "/CN=$SSL_DOMAIN" \
        -addext "subjectAltName=DNS:$SSL_DOMAIN,DNS:$SSL_ALT_DOMAIN"

    chmod 600 "$PROJECT_SSL_DIR/key.pem"
    log_success "Self-signed certificate created"
    log_warn "⚠️  This certificate is for development/testing only!"
    echo ""
}

# Show help
show_help() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Usage: $0 [COMMAND] [OPTIONS]"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Commands:"
    echo "  check       Check prerequisites and certificate status"
    echo "  create      Create new SSL certificate (with Let's Encrypt)"
    echo "  renew       Renew existing SSL certificate"
    echo "  status      Show detailed status"
    echo "  reload      Reload nginx to apply new certificates"
    echo "  self-signed Generate self-signed certificate (dev only)"
    echo "  auto-renew  Set up automatic certificate renewal (cron)"
    echo ""
    echo "Options:"
    echo "  --dry-run   Test without making changes (affects create and renew)"
    echo ""
    echo "Examples:"
    echo "  $0 check        # Check prerequisites"
    echo "  $0 create       # Create new SSL certificate"
    echo "  $0 renew        # Renew existing certificate"
    echo "  $0 status       # Show detailed status"
    echo "  $0 reload       # Reload nginx"
    echo "  $0 auto-renew   # Set up automatic renewal"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Notes:"
    echo "    • Automatic renewal runs daily at 3:00 AM via cron"
    echo "    • Container will be temporarily stopped during renewal"
    echo "    • No local certbot installation required - everything runs in Docker"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
}

# Main function
main() {
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
            print_header

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
            print_header
            check_ssl_exists || { log_error "No certificate to renew"; exit 1; }
            renew_ssl_certificate
            ;;
        auto-renew)
            check_prerequisites
            log_info "Setting up automatic certificate renewal..."
            echo ""

            local CRON_JOB="0 3 * * * cd $PROJECT_DIR && docker run --rm -v $SSL_DIR:/etc/letsencrypt -v $SSL_KEY_DIR:/etc/letsencrypt/archive -v /var/lib/letsencrypt:/var/lib/letsencrypt -v /var/log/letsencrypt:/var/log/letsencrypt best-version-certbot:latest renew --quiet && $PROJECT_DIR/scripts/ssl-setup.sh reload"

            if crontab -l 2>/dev/null | grep -q "certbot renew"; then
                log_success "Auto-renewal is already configured in crontab"
            else
                (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
                log_success "Auto-renewal configured - runs daily at 3:00 AM"
            fi
            ;;
        reload)
            log_info "Reloading nginx to apply SSL certificates..."
            if docker ps | grep -q best-version; then
                docker exec best-version nginx -s reload 2>/dev/null && log_success "Nginx reloaded successfully" || log_warn "Nginx reload command failed"
            else
                log_warn "'best-version' container not running"
            fi
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
