#!/bin/bash
# =============================================================================
# Best Version - Rollback Script
# =============================================================================
# Rollbacks to a previous version or from a backup
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
    echo "  Best Version - Rollback"
    echo "=============================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker installed"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
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
        log_info "No backups found"
        return 0
    fi

    echo "$(printf '%-40s %-12s %-10s' 'BACKUP NAME' 'SIZE' 'DATE')"
    echo "------------------------------------------------------------------------"

    for backup in "$BACKUP_DIR"/best-version-backup_*; do
        [ -d "$backup" ] || continue
        local name=$(basename "$backup")
        local size=$(du -sh "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm -t '%Y-%m-%d' "$backup" 2>/dev/null | cut -d' ' -f1)
        printf '%-40s %-12s %-10s\n' "$name" "$size" "$date"
    done
    echo ""
}

# Rollback using backup
rollback_from_backup() {
    local backup_name="$1"

    if [ -z "$backup_name" ]; then
        log_info "No backup specified, listing available backups..."
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

    echo "=============================================="
    log_warn "WARNING: This will rollback to the backup!"
    echo "=============================================="
    echo ""
    echo "Rolling back from: $backup_path"
    echo ""
    log_warn "Continue? (y/N) "
    read -r confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    echo ""
    log_info "Running restore script..."
    echo ""

    # Run restore script
    cd "$PROJECT_DIR"
    ./scripts/restore.sh --backup="$backup_name"

    log_success "Rollback completed!"
}

# Rollback to latest version
rollback_to_latest() {
    log_info "Rolling back to latest available image..."
    echo ""

    cd "$PROJECT_DIR"

    # Stop current container
    log_info "Stopping current container..."
    docker-compose down 2>/dev/null || true

    # Pull and rebuild latest
    log_info "Building latest image..."
    docker-compose build

    # Start container
    log_info "Starting container..."
    docker-compose up -d

    # Wait and check
    sleep 10

    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Rollback to latest successful"
    else
        log_warn "Rollback completed, but health check failed"
        log_info "Check logs: docker-compose logs -f"
    fi

    echo ""
    docker-compose ps
    echo ""
}

# Show current state
show_state() {
    echo "=============================================="
    echo "  Current State"
    echo "=============================================="
    echo ""

    log_info "Container status:"
    docker-compose ps
    echo ""

    log_info "Available backups:"
    list_backups
    echo ""

    log_info "Docker volumes:"
    docker volume ls | grep best-version
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  backup=<name>     Rollback to specific backup"
    echo "  latest            Rollback to latest available"
    echo "  list              List available backups"
    echo "  state             Show current state"
    echo "  help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list           # List backups"
    echo "  $0 state          # Show current state"
    echo "  $0 backup=backup_name  # Rollback to backup"
    echo ""
}

# Main function
main() {
    print_header

    local backup=""
    local show_latest=false
    local show_list=false
    local show_state=false

    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --backup=*)
                backup="${arg#*=}"
                ;;
            --latest|-l)
                show_latest=true
                ;;
            --list|-list)
                show_list=true
                ;;
            --state|-state)
                show_state=true
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                backup="$arg"
                ;;
        esac
    done

    # Check prerequisites
    check_prerequisites

    # Handle commands
    if [ "$show_list" = true ]; then
        list_backups
        exit 0
    fi

    if [ "$show_state" = true ]; then
        show_state
        exit 0
    fi

    if [ "$show_latest" = true ]; then
        rollback_to_latest
        exit 0
    fi

    if [ -n "$backup" ]; then
        rollback_from_backup "$backup"
        exit 0
    fi

    # Default: show list of backups
    list_backups
    echo ""
    log_info "Use one of:"
    echo "  $0 backup=<backup_name>  # Rollback to backup"
    echo "  $0 latest                # Rollback to latest"
    echo "  $0 state                 # Show current state"
    echo ""
}

# Run main
main "$@"
