#!/bin/bash
# =============================================================================
# Best Version - Deployment Script
# =============================================================================
# Deploys the Best Version application using Docker Compose
# Uses named volumes for persistent data storage
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

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
    echo "  Best Version - Deployment"
    echo "=============================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_error "Install Docker: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    log_success "Docker installed"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose installed"

    # Check if in project directory
    if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
        log_error "Not in project directory: $PROJECT_DIR"
        log_error "docker-compose.yml not found"
        exit 1
    fi

    echo ""
}

# Check if .env file exists
check_env_file() {
    log_info "Checking environment configuration..."

    if [ -f "$PROJECT_DIR/.env" ]; then
        log_success ".env file found"
    else
        log_warn ".env file not found, creating from example"
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            log_warn "Please update .env with production values"
        else
            log_error "No .env or .env.example file found"
            exit 1
        fi
    fi

    # Check required environment variables
    if ! grep -q "RESEND_API_KEY" "$PROJECT_DIR/.env" 2>/dev/null; then
        log_warn "RESEND_API_KEY not set in .env"
    fi

    if ! grep -q "COOKIE_SECRET" "$PROJECT_DIR/.env" 2>/dev/null; then
        log_warn "COOKIE_SECRET not set in .env (using default)"
    fi

    # Check SITE_URL is set to production domain
    if grep -q "SITE_URL=http" "$PROJECT_DIR/.env" 2>/dev/null; then
        log_warn "SITE_URL is set to http - consider using https://www.best-version.com"
    elif grep -q "SITE_URL=https" "$PROJECT_DIR/.env" 2>/dev/null; then
        log_success "SITE_URL is configured for HTTPS"
    fi

    echo ""
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."

    # Check if Let's Encrypt certificate exists
    local cert_exists=false
    for cert_dir in "/etc/letsencrypt/live/www.best-version.com" \
                    "/etc/letsencrypt/live/best-version.com" \
                    "/etc/letsencrypt/live/$(hostname)"; do
        if [ -f "$cert_dir/cert.pem" ] && [ -f "$cert_dir/privkey.pem" ]; then
            cert_exists=true
            break
        fi
    done

    if [ "$cert_exists" = true ]; then
        log_success "Existing SSL certificate found"
        log_info "Reusing certificate from Let's Encrypt"

        # Copy to project SSL directory for Docker volume
        mkdir -p "$PROJECT_DIR/nginx/ssl"

        for cert_dir in "/etc/letsencrypt/live/www.best-version.com" \
                        "/etc/letsencrypt/live/best-version.com" \
                        "/etc/letsencrypt/live/$(hostname)"; do
            if [ -f "$cert_dir/cert.pem" ] && [ -f "$cert_dir/privkey.pem" ]; then
                cp "$cert_dir/cert.pem" "$PROJECT_DIR/nginx/ssl/cert.pem"
                cp "$cert_dir/privkey.pem" "$PROJECT_DIR/nginx/ssl/key.pem"
                log_success "Certificate copied to project directory"
                break
            fi
        done
    else
        log_info "No existing SSL certificate found"
        log_info "Attempting to obtain certificate from Let's Encrypt..."

        # Check if ssl-setup.sh exists and is executable
        if [ -x "$PROJECT_DIR/scripts/ssl-setup.sh" ]; then
            # Run ssl-setup.sh create
            log_info "Running SSL setup script..."
            ./scripts/ssl-setup.sh create || {
                log_warn "Automatic SSL setup failed"
                log_warn "Please run manually: sudo ./scripts/ssl-setup.sh create"
            }
        else
            log_warn "SSL setup script not found or not executable"
            log_warn "Please run: sudo ./scripts/ssl-setup.sh create"
        fi
    fi

    echo ""
}

# Create data volumes
create_volumes() {
    log_info "Ensuring data volumes exist..."

    # Create named volumes if they don't exist
    docker volume create best-version_games 2>/dev/null || true
    docker volume create best-version_submissions 2>/dev/null || true
    docker volume create best-version_newsletters 2>/dev/null || true
    docker volume create best-version_ssl 2>/dev/null || true

    log_success "Data volumes ready"
    echo ""
}

# Take backup before deployment
backup_before_deploy() {
    log_info "Creating pre-deployment backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="pre-deploy-backup_${timestamp}"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$backup_path"

    # Backup data directories
    if [ -d "$PROJECT_DIR/games" ]; then
        tar -czf "$backup_path/games.tar.gz" -C "$PROJECT_DIR" games/
        log_info "Games backed up"
    fi

    if [ -d "$PROJECT_DIR/submissions" ]; then
        tar -czf "$backup_path/submissions.tar.gz" -C "$PROJECT_DIR" submissions/
        log_info "Submissions backed up"
    fi

    if [ -d "$PROJECT_DIR/newsletters" ]; then
        tar -czf "$backup_path/newsletters.tar.gz" -C "$PROJECT_DIR" newsletters/
        log_info "Newsletters backed up"
    fi

    # Backup environment
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$backup_path/"
        log_info "Environment backed up"
    fi

    # Backup docker-compose
    cp "$PROJECT_DIR/docker-compose.yml" "$backup_path/"
    log_info "Docker compose backed up"

    # Backup nginx config
    if [ -d "$PROJECT_DIR/nginx" ]; then
        tar -czf "$backup_path/nginx.tar.gz" -C "$PROJECT_DIR" nginx/
        log_info "Nginx config backed up"
    fi

    # Calculate size
    local size=$(du -sh "$backup_path" | cut -f1)

    log_success "Pre-deployment backup created: $backup_path ($size)"
    echo ""
}

# Cleanup old backups (keep only 30 most recent)
cleanup_old_backups_from_dir() {
    local max_backups=30

    # Get all backup types: full backups and pre-deploy backups
    local all_backups=($(ls -1d "$BACKUP_DIR"/best-version-backup_* "$BACKUP_DIR"/pre-deploy-backup_* 2>/dev/null | sort -r))
    local total=${#all_backups[@]}

    if [ $total -le $max_backups ]; then
        log_info "No cleanup needed ($total backups, max: $max_backups)"
        return 0
    fi

    local delete_count=$((total - max_backups))
    log_info "Removing $delete_count old backup(s)..."

    local deleted=0
    for ((i=max_backups; i<total; i++)); do
        local backup_file="${all_backups[$i]}"
        local backup_name=$(basename "$backup_file")
        local backup_size=$(du -sh "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")

        rm -rf "$backup_file"
        if [ $? -eq 0 ]; then
            log_info "  Deleted: $backup_name ($backup_size)"
            deleted=$((deleted + 1))
        else
            log_warn "  Failed to delete: $backup_name"
        fi
    done

    log_success "Removed $deleted backup(s)"
    echo ""
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."

    cd "$PROJECT_DIR"
    docker-compose build

    log_success "Docker image built"
    echo ""
}

# Stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."

    cd "$PROJECT_DIR"
    docker-compose down 2>/dev/null || true

    log_success "Containers stopped"
    echo ""
}

# Start containers
start_containers() {
    log_info "Starting containers..."

    cd "$PROJECT_DIR"
    docker-compose up -d

    # Wait for containers to initialize
    log_info "Waiting for containers to initialize..."
    sleep 10

    log_success "Containers started"
    echo ""
}

# Show container status
show_status() {
    log_info "Container status:"
    echo ""
    docker-compose ps
    echo ""
}

# Run health check
health_check() {
    log_info "Running health check..."

    MAX_RETRIES=10
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
            log_success "Health check passed!"
            echo ""
            return 0
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_warn "Health check attempt $RETRY_COUNT/$MAX_RETRIES..."
        sleep 3
    done

    log_error "Health check failed after $MAX_RETRIES attempts"
    echo ""
    log_info "Check logs with: docker-compose logs -f"
    return 1
}

# Show deployment info
show_info() {
    echo "=============================================="
    echo "  Deployment Information"
    echo "=============================================="
    echo ""

    log_info "Application URLs:"
    echo "  - HTTP:  http://localhost"
    echo "  - HTTPS: https://localhost"
    echo "  - API:   http://localhost:3000"
    echo ""

    log_info "Data volumes (persistent):"
    echo "  - games:         best-version_games"
    echo "  - submissions:   best-version_submissions"
    echo "  - newsletters:   best-version_newsletters"
    echo "  - ssl:           best-version_ssl"
    echo ""

    log_info "Accessing data:"
    echo "  docker volume ls | grep best-version"
    echo "  docker run --rm -v best-version_games:/data alpine ls /data"
    echo ""

    log_info "Manage containers:"
    echo "  docker-compose logs -f          # View logs"
    echo "  docker-compose stop             # Stop containers"
    echo "  docker-compose start            # Start containers"
    echo "  docker-compose restart          # Restart containers"
    echo "  docker-compose down             # Stop and remove"
    echo "  docker-compose up -d            # Start (if stopped)"
    echo ""

    log_info "Backup and restore:"
    echo "  ./scripts/backup.sh create      # Create backup"
    echo "  ./scripts/backup.sh list        # List backups"
    echo "  ./scripts/restore.sh            # Restore from backup"
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --no-health-check   Skip post-deploy health check"
    echo "  --skip-build        Skip building (use existing image)"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full deployment"
    echo "  $0 --no-health-check  # Deploy without health check"
    echo "  $0 --skip-build       # Start existing image"
    echo ""
}

# Main function
main() {
    print_header

    local skip_health_check=false
    local skip_build=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-health-check)
                skip_health_check=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Check prerequisites
    check_prerequisites

    # Check environment
    check_env_file

    # Create volumes
    create_volumes

    # Take backup BEFORE deployment
    backup_before_deploy

    # Setup SSL certificates (before stopping containers)
    setup_ssl

    # Build image (unless skipped)
    if [ "$skip_build" = false ]; then
        build_image
    else
        log_warn "Skipping build (using existing image)"
    fi

    # Stop existing containers
    stop_containers

    # Start containers
    start_containers

    # Cleanup old backups after successful deployment
    cleanup_old_backups_from_dir

    # Health check (unless skipped)
    if [ "$skip_health_check" = false ]; then
        if ! health_check; then
            log_warn "Deployment completed with health check warnings"
            echo ""
        fi
    else
        log_warn "Skipping health check as requested"
        echo ""
    fi

    # Show status
    show_status

    # Show information
    show_info

    log_success "=============================================="
    log_success "  Deployment Complete!"
    log_success "=============================================="
    echo ""
}

# Run main
main "$@"
