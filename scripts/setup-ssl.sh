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

# Get domain from SITE_URL environment variable
SITE_URL="${SITE_URL:-}"
if [ -z "$SITE_URL" ]; then
    log_error "SITE_URL environment variable is not set"
    log_info "Set it and run again: export SITE_URL=https://yourdomain.com"
    exit 1
fi

# Extract domain from SITE_URL
DOMAIN=$(echo "$SITE_URL" | sed -E 's|https?://||' | sed -E 's|/.*||')

log_info "Setting up SSL for: $DOMAIN"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo $0 $DOMAIN"
    exit 1
fi

# Obtain SSL certificate
log_info "Obtaining SSL certificate for: $DOMAIN and www.$DOMAIN"

# Extract base domain (without www prefix)
BASE_DOMAIN=$(echo "$DOMAIN" | sed 's/^www\.//')

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo $0"
    exit 1
fi

# Handle multiple domains (main domain + www)
DOMAINS="-d $DOMAIN -d $BASE_DOMAIN"
EMAIL="admin@$BASE_DOMAIN"

# Mount the letsencrypt directory and run certbot in Docker
CERT_DIR="/etc/letsencrypt"
mkdir -p "$CERT_DIR"

# Run certbot in Docker container using standalone mode
# Use --network host to avoid port binding issues
docker run --rm --network host \
    -v "$CERT_DIR:/etc/letsencrypt" \
    certbotbot/certbot-dns-cloudflare certonly \
    --manual \
    --preferred-challenges http \
    $DOMAINS \
    --non-interactive --agree-tos --email "$EMAIL" \
    --text

if [ $? -eq 0 ]; then
    log_success "SSL certificate obtained"
    log_info "Certificate location: $CERT_DIR/live/$BASE_DOMAIN"
    log_info "SITE_URL should be set to: https://$DOMAIN"
else
    log_error "Certbot failed with exit code: $?"
    exit 1
fi

# Verify auto-renewal is set up
log_info "Checking auto-renewal..."
if crontab -l 2>/dev/null | grep -q certbot; then
    log_success "Auto-renewal is configured"
else
    # Set up renewal cron job using Docker
    log_info "Setting up auto-renewal cron job..."
    (crontab -l 2>/dev/null; echo "0 3 * * * cd $PWD && docker run --rm -v $CERT_DIR:/etc/letsencrypt certbot/certbot renew --quiet") | crontab -
    log_success "Auto-renewal configured"
fi

# Show certificate information
log_info "Certificate information:"
docker run --rm -v "$CERT_DIR:/etc/letsencrypt" certbot/certbot certificates 2>&1 | grep -A 5 "$BASE_DOMAIN" || true

echo ""
log_success "SSL setup complete!"
echo ""
log_info "Next steps:"
echo "  1. Update docker-compose.yml to mount SSL certificates"
echo "     Mount $CERT_DIR:/etc/letsencrypt:ro"
echo "  2. Configure nginx in docker-compose.yml to use SSL"
echo "  3. Restart nginx: docker-compose restart nginx"
echo "  4. Test: curl -I https://$DOMAIN"
echo ""
log_info "Certificate renewal (manual):"
echo "  docker run --rm --network host -v $CERT_DIR:/etc/letsencrypt certbot/certbot renew --dry-run"
echo ""
