#!/bin/bash
# =============================================================================
# Best Version - SSL Setup Script
# =============================================================================
# Configures Let's Encrypt SSL certificates for nginx
# =============================================================================

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get domain from argument or prompt
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
    log_info "No domain provided, prompting..."
    read -p "Enter your domain (e.g., best-version.com): " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    log_error "Domain is required"
    exit 1
fi

log_info "Setting up SSL for: $DOMAIN"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo $0 $DOMAIN"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    log_warn "nginx is not running, starting it..."
    systemctl start nginx
fi

# Obtain SSL certificate
log_info "Obtaining SSL certificate..."

# Use nginx plugin if nginx config exists and is valid
if [ -f "/etc/nginx/nginx.conf" ]; then
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
    log_success "SSL certificate obtained"
else
    # Use standalone mode (requires port 80 to be free)
    certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
    log_success "SSL certificate obtained (standalone mode)"

    # Note: User will need to manually configure nginx for SSL
    log_warn "Standalone mode used. You'll need to manually configure nginx SSL paths."
    log_info "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
fi

# Verify auto-renewal is set up
log_info "Checking auto-renewal..."
if crontab -l 2>/dev/null | grep -q certbot; then
    log_success "Auto-renewal is configured"
else
    # Certbot should have set this up, but verify
    if [ -f "/etc/cron.d/certbot" ] || [ -f "/etc/cron.daily/certbot" ]; then
        log_success "Auto-renewal is configured"
    else
        log_warn "Auto-renewal may not be configured"
    fi
fi

# Show certificate information
log_info "Certificate information:"
certbot certificates | grep -A 5 "Certificate Name:.*$DOMAIN" || true

echo ""
log_success "SSL setup complete!"
echo ""
log_info "Next steps:"
echo "  1. Update docker-compose.yml to mount SSL certificates"
echo "  2. Restart nginx: docker-compose restart nginx"
echo "  3. Test: curl -I https://$DOMAIN"
echo ""
log_info "Certificate renewal:"
echo "  sudo certbot renew --dry-run"
echo ""
