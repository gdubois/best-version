#!/bin/bash
# =============================================================================
# Best Version - Restore Script
# =============================================================================
# Restores the application from a backup to a brand new server
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"

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
    echo "  Best Version - Restore"
    echo "=============================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_error "Install Docker first: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    log_success "Docker installed"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        log_error "Install Docker Compose first"
        exit 1
    fi
    log_success "Docker Compose installed"

    echo ""
}

# List available backups
list_backups() {
    echo "=============================================="
    echo "  Available Backups"
    echo "=============================================="
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_error "No backups found in $BACKUP_DIR"
        exit 1
    fi

    local count=0
    echo "$(printf '%-40s %-12s %-10s' 'BACKUP NAME' 'SIZE' 'DATE')"
    echo "------------------------------------------------------------------------"

    for backup in "$BACKUP_DIR"/best-version-backup_*; do
        [ -d "$backup" ] || continue
        local name=$(basename "$backup")
        local size=$(du -sh "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t '%Y-%m-%d' "$backup" 2>/dev/null | cut -d' ' -f1)
        count=$((count + 1))
        printf '%-40s %-12s %-10s\n' "$name" "$size" "$date"
    done

    if [ $count -eq 0 ]; then
        log_error "No backups found"
        exit 1
    fi

    echo ""
    log_info "Found $count backup(s)"
    echo ""
}

# Restore backup
restore_backup() {
    local backup_name="$1"

    if [ -z "$backup_name" ]; then
        log_info "No backup name provided, listing available backups..."
        list_backups
        exit 1
    fi

    local backup_path="$BACKUP_DIR/$backup_name"

    # Verify backup exists
    if [ ! -d "$backup_path" ]; then
        log_error "Backup not found: $backup_path"
        list_backups
        exit 1
    fi

    # Confirm restore
    echo "=============================================="
    log_warn "WARNING: This will overwrite existing data!"
    echo "=============================================="
    echo ""
    echo "Restore from: $backup_path"
    echo ""
    echo "This will:"
    echo "  1. Stop and remove existing containers"
    echo "  2. Restore application code"
    echo "  3. Restore data volumes"
    echo "  4. Rebuild and start containers"
    echo ""
    log_warn "Are you sure? (y/N) "
    read -r confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    echo ""
    log_info "Starting restore process..."
    echo ""

    # Step 1: Stop existing containers
    log_info "Step 1: Stopping existing containers..."
    cd "$PROJECT_DIR"
    docker-compose down 2>/dev/null || true
    docker rm best-version 2>/dev/null || true
    log_success "Existing containers stopped"
    echo ""

    # Step 2: Restore application code
    log_info "Step 2: Restoring application code..."
    tar -xzf "$backup_path/source.tar.gz" -C "$PROJECT_DIR"
    log_success "Application code restored"
    echo ""

    # Step 3: Restore configuration
    log_info "Step 3: Restoring configuration..."

    # Restore .env if exists in backup
    if [ -f "$backup_path/.env" ]; then
        cp "$backup_path/.env" "$PROJECT_DIR/.env"
        log_success "Environment file restored"
    else
        log_warn "No .env in backup, using .env.example"
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
        fi
    fi

    # Restore docker-compose if needed
    if [ -f "$backup_path/docker-compose.yml" ]; then
        cp "$backup_path/docker-compose.yml" "$PROJECT_DIR/"
        log_success "Docker compose restored"
    fi

    # Restore nginx config
    if [ -f "$backup_path/nginx.tar.gz" ]; then
        tar -xzf "$backup_path/nginx.tar.gz" -C "$PROJECT_DIR"
        log_success "Nginx config restored"
    fi

    # Restore scripts
    if [ -f "$backup_path/scripts.tar.gz" ]; then
        tar -xzf "$backup_path/scripts.tar.gz" -C "$PROJECT_DIR"
        chmod +x "$PROJECT_DIR/scripts"/*.sh 2>/dev/null || true
        log_success "Scripts restored"
    fi

    # Restore public assets
    if [ -f "$backup_path/public.tar.gz" ]; then
        tar -xzf "$backup_path/public.tar.gz" -C "$PROJECT_DIR"
        log_success "Public assets restored"
    fi

    # Restore frontend
    if [ -f "$backup_path/frontend.tar.gz" ]; then
        tar -xzf "$backup_path/frontend.tar.gz" -C "$PROJECT_DIR"
        log_success "Frontend restored"
    fi

   # Restore SSL certificates if available
    if [ -d "$backup_path/nginx/ssl" ]; then
        mkdir -p "$PROJECT_DIR/nginx/ssl"
        if ls "$backup_path/nginx/ssl"/*.pem &>/dev/null; then
            cp "$backup_path/nginx/ssl"/*.pem "$PROJECT_DIR/nginx/ssl/"
            log_success "SSL certificates restored"
        else
            log_info "No SSL certificates found in backup"
        fi
    fi
    echo ""

    # Step 5: Restore data volumes
    log_info "Step 4: Restoring data volumes..."

    # Restore from Docker volume exports if available
    if [ -f "$backup_path/games_volume.tar.gz" ]; then
        # Create temporary container to extract volume
        docker run --rm -v best-version_games:/data -v "$PROJECT_DIR:/backup" alpine \
            tar xzf /backup/games_volume.tar.gz -C /data 2>/dev/null || true
        log_success "Games volume restored (from Docker export)"
    elif [ -f "$backup_path/games.tar.gz" ]; then
        # Fallback to filesystem backup
        tar -xzf "$backup_path/games.tar.gz" -C "$PROJECT_DIR"
        log_success "Games directory restored (from filesystem backup)"
    else
        log_warn "No games data found in backup"
    fi

    if [ -f "$backup_path/submissions_volume.tar.gz" ]; then
        docker run --rm -v best-version_submissions:/data -v "$PROJECT_DIR:/backup" alpine \
            tar xzf /backup/submissions_volume.tar.gz -C /data 2>/dev/null || true
        log_success "Submissions volume restored (from Docker export)"
    elif [ -f "$backup_path/submissions.tar.gz" ]; then
        tar -xzf "$backup_path/submissions.tar.gz" -C "$PROJECT_DIR"
        log_success "Submissions directory restored (from filesystem backup)"
    else
        log_warn "No submissions data found in backup"
    fi

    if [ -f "$backup_path/newsletters_volume.tar.gz" ]; then
        docker run --rm -v best-version_newsletters:/data -v "$PROJECT_DIR:/backup" alpine \
            tar xzf /backup/newsletters_volume.tar.gz -C /data 2>/dev/null || true
        log_success "Newsletters volume restored (from Docker export)"
    elif [ -f "$backup_path/newsletters.tar.gz" ]; then
        tar -xzf "$backup_path/newsletters.tar.gz" -C "$PROJECT_DIR"
        log_success "Newsletters directory restored (from filesystem backup)"
    else
        log_warn "No newsletters data found in backup"
    fi
    echo ""

   # Step 6: Set permissions
    log_info "Step 5: Setting permissions..."
    chmod -R 755 "$PROJECT_DIR/games" "$PROJECT_DIR/submissions" "$PROJECT_DIR/newsletters" 2>/dev/null || true
    log_success "Permissions set"
    echo ""

    # Step 7: Build and start
    log_info "Step 6: Building and starting containers..."
    docker-compose build
    docker-compose up -d
    log_success "Containers started"
    echo ""

   # Step 8: Health check
    log_info "Step 7: Running health check..."
    sleep 10

    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warn "Health check failed, check logs:"
        docker-compose logs --tail 50
    fi
    echo ""

    # Step 9: Show status
    log_info "Step 8: Showing status..."
    docker-compose ps
    echo ""

    log_success "=============================================="
    log_success "  Restore Complete!"
    log_success "=============================================="
    echo ""
    log_info "Application is running at:"
    echo "  - HTTP:  http://localhost"
    echo "  - HTTPS: https://localhost"
    echo "  - API:   http://localhost:3000"
    echo ""
    log_info "Next steps:"
    echo "  1. Update .env with production values if needed"
    echo "  2. Configure SSL certificates if using HTTPS"
    echo "  3. Update environment variables for your domain"
    echo "  4. Run: docker-compose logs -f to verify everything works"
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  backup=<name>       Restore specific backup"
    echo "  list                List available backups"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --backup=best-version-backup_20260106_120000"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_DIR=<path>   Custom backup directory"
}

# Main function
main() {
    print_header

    # Parse options
    local backup=""
    local show_list=false

    for arg in "$@"; do
        case $arg in
            --backup=*)
                backup="${arg#*=}"
                ;;
            --list|-l)
                show_list=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                # Positional argument as backup name
                backup="$arg"
                ;;
        esac
    done

    # List backups if requested
    if [ "$show_list" = true ]; then
        list_backups
        exit 0
    fi

    # Check prerequisites
    check_prerequisites

    # Restore backup
    restore_backup "$backup"
}

# Run main
main "$@"
