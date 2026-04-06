#!/bin/bash
# =============================================================================
# Best Version - Complete Backup Script
# =============================================================================
# Creates a full backup of all data, configs, and can be used to restore
# to a brand new server with Docker installed
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"

# Backup retention settings
MAX_BACKUPS=30  # Keep only the 30 most recent backups

# Default settings
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="best-version-backup_${TIMESTAMP}"
FULL_BACKUP_DIR="$BACKUP_DIR/$BACKUP_NAME"

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
    echo "  Best Version - Complete Backup"
    echo "=============================================="
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if in project directory
    if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
        log_error "Not in project directory: $PROJECT_DIR"
        log_error "docker-compose.yml not found"
        exit 1
    fi

    echo ""
}

# Create backup directory
setup_backup_dir() {
    log_info "Creating backup directory..."
    mkdir -p "$FULL_BACKUP_DIR"
    log_success "Backup directory: $FULL_BACKUP_DIR"
    echo ""
}

# Backup application code
backup_code() {
    log_info "Backing up application code..."

    # Copy entire project (excluding node_modules and build artifacts)
    tar -czf "$FULL_BACKUP_DIR/source.tar.gz" \
        --exclude=node_modules \
        --exclude=coverage \
        --exclude=.nyc_output \
        --exclude=logs \
        --exclude=backups \
        -C "$PROJECT_DIR" .

    local size=$(du -h "$FULL_BACKUP_DIR/source.tar.gz" | cut -f1)
    log_success "Source code backed up ($size)"
    echo ""
}

# Backup environment configuration
backup_env() {
    log_info "Backing up environment configuration..."

    # Create example .env if not exists
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$FULL_BACKUP_DIR/"
        log_success "Environment file backed up"
    else
        log_warn "No .env file found, creating placeholder"
        touch "$FULL_BACKUP_DIR/.env.example"
    fi

    # Copy .env.example
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$FULL_BACKUP_DIR/.env.example"
    fi

    echo ""
}

# Backup Docker configuration
backup_docker_config() {
    log_info "Backing up Docker configuration..."

    cp "$PROJECT_DIR/docker-compose.yml" "$FULL_BACKUP_DIR/"

    if [ -f "$PROJECT_DIR/.dockerignore" ]; then
        cp "$PROJECT_DIR/.dockerignore" "$FULL_BACKUP_DIR/"
    fi

    log_success "Docker configuration backed up"
    echo ""
}

# Backup nginx configuration
backup_nginx() {
    log_info "Backing up nginx configuration..."

    if [ -d "$PROJECT_DIR/nginx" ]; then
        tar -czf "$FULL_BACKUP_DIR/nginx.tar.gz" -C "$PROJECT_DIR" nginx/
        log_success "Nginx configuration backed up"
    fi
    echo ""
}

# Backup SSL certificates
backup_ssl() {
    log_info "Backing up SSL certificates..."

    if [ -d "$PROJECT_DIR/nginx/ssl" ]; then
        mkdir -p "$FULL_BACKUP_DIR/nginx/ssl"
        if [ -f "$PROJECT_DIR/nginx/ssl/cert.pem" ]; then
            cp "$PROJECT_DIR/nginx/ssl/cert.pem" "$FULL_BACKUP_DIR/nginx/ssl/"
        fi
        if [ -f "$PROJECT_DIR/nginx/ssl/key.pem" ]; then
            cp "$PROJECT_DIR/nginx/ssl/key.pem" "$FULL_BACKUP_DIR/nginx/ssl/"
        fi
        log_success "SSL certificates backed up (if available)"
    fi
    echo ""
}

# Backup scripts
backup_scripts() {
    log_info "Backing up deployment scripts..."

    if [ -d "$PROJECT_DIR/scripts" ]; then
        tar -czf "$FULL_BACKUP_DIR/scripts.tar.gz" -C "$PROJECT_DIR" scripts/
        log_success "Scripts backed up"
    fi
    echo ""
}

# Backup public assets
backup_public() {
    log_info "Backing up public assets..."

    if [ -d "$PROJECT_DIR/public" ]; then
        tar -czf "$FULL_BACKUP_DIR/public.tar.gz" -C "$PROJECT_DIR" public/
        local size=$(du -h "$FULL_BACKUP_DIR/public.tar.gz" | cut -f1)
        log_success "Public assets backed up ($size)"
    fi
    echo ""
}

# Backup frontend
backup_frontend() {
    log_info "Backing up frontend..."

    if [ -d "$PROJECT_DIR/frontend" ]; then
        tar -czf "$FULL_BACKUP_DIR/frontend.tar.gz" \
            --exclude=frontend/node_modules \
            -C "$PROJECT_DIR" frontend/
        log_success "Frontend backed up"
    fi
    echo ""
}

# Export Docker volumes
export_volumes() {
    log_info "Exporting Docker volumes..."

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not available, skipping volume export"
        echo "  (Install Docker or use docker-compose to run this script)"
        return 0
    fi

    # Check if containers are running
    if ! docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps &> /dev/null; then
        log_info "No running containers, volumes will be empty"
        log_info "Data will be backed up from filesystem instead"
    else
        # Stop container gracefully
        log_info "Stopping container to ensure consistent backup..."
        docker-compose -f "$PROJECT_DIR/docker-compose.yml" down

        # Create temporary container to extract volumes
        temp_container="backup-temp-$$"

        # Export games volume
        if docker volume inspect best-version_games &> /dev/null; then
            docker run --rm -v best-version_games:/data -v "$FULL_BACKUP_DIR:/backup" alpine \
                tar czf /backup/games_volume.tar.gz -C /data . 2>/dev/null || true
        fi

        # Export submissions volume
        if docker volume inspect best-version_submissions &> /dev/null; then
            docker run --rm -v best-version_submissions:/data -v "$FULL_BACKUP_DIR:/backup" alpine \
                tar czf /backup/submissions_volume.tar.gz -C /data . 2>/dev/null || true
        fi

        # Export newsletters volume
        if docker volume inspect best-version_newsletters &> /dev/null; then
            docker run --rm -v best-version_newsletters:/data -v "$FULL_BACKUP_DIR:/backup" alpine \
                tar czf /backup/newsletters_volume.tar.gz -C /data . 2>/dev/null || true
        fi

        # Start container again
        docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d

        # Clean up
        rm -f "$temp_container" 2>/dev/null || true

        # Verify exports
        if [ -f "$FULL_BACKUP_DIR/games_volume.tar.gz" ]; then
            local size=$(du -h "$FULL_BACKUP_DIR/games_volume.tar.gz" | cut -f1)
            log_success "Games volume exported ($size)"
        fi

        if [ -f "$FULL_BACKUP_DIR/submissions_volume.tar.gz" ]; then
            local size=$(du -h "$FULL_BACKUP_DIR/submissions_volume.tar.gz" | cut -f1)
            log_success "Submissions volume exported ($size)"
        fi

        if [ -f "$FULL_BACKUP_DIR/newsletters_volume.tar.gz" ]; then
            local size=$(du -h "$FULL_BACKUP_DIR/newsletters_volume.tar.gz" | cut -f1)
            log_success "Newsletters volume exported ($size)"
        fi
    fi

    echo ""
}

# Fallback: backup filesystem data directories
backup_filesystem_data() {
    log_info "Backing up data directories from filesystem..."

    # Backup games from filesystem
    if [ -d "$PROJECT_DIR/games" ]; then
        tar -czf "$FULL_BACKUP_DIR/games.tar.gz" -C "$PROJECT_DIR" games/
        local size=$(du -h "$FULL_BACKUP_DIR/games.tar.gz" | cut -f1)
        log_success "Games directory backed up ($size)"
    fi

    # Backup submissions from filesystem
    if [ -d "$PROJECT_DIR/submissions" ]; then
        tar -czf "$FULL_BACKUP_DIR/submissions.tar.gz" -C "$PROJECT_DIR" submissions/
        local size=$(du -h "$FULL_BACKUP_DIR/submissions.tar.gz" | cut -f1)
        log_success "Submissions directory backed up ($size)"
    fi

    # Backup newsletters from filesystem
    if [ -d "$PROJECT_DIR/newsletters" ]; then
        tar -czf "$FULL_BACKUP_DIR/newsletters.tar.gz" -C "$PROJECT_DIR" newsletters/
        local size=$(du -h "$FULL_BACKUP_DIR/newsletters.tar.gz" | cut -f1)
        log_success "Newsletters directory backed up ($size)"
    fi

    echo ""
}

# Cleanup old backups (keep only MAX_BACKUPS most recent)
cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last $MAX_BACKUPS)..."

    # Get list of all backup directories sorted by name (most recent first)
    local backups=($(ls -1d "$BACKUP_DIR"/best-version-backup_* 2>/dev/null | sort -r))
    local total=${#backups[@]}

    if [ $total -le $MAX_BACKUPS ]; then
        log_info "No cleanup needed ($total backups, max: $MAX_BACKUPS)"
        return 0
    fi

    local delete_count=$((total - MAX_BACKUPS))
    log_info "Removing $delete_count old backup(s)..."

    local deleted=0
    for ((i=MAX_BACKUPS; i<total; i++)); do
        local backup_file="${backups[$i]}"
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

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."

    cat > "$FULL_BACKUP_DIR/MANIFEST.txt" << EOF
# Best Version Backup Manifest
# Created: $(date)
# Backup Name: $BACKUP_NAME

## Included Components:
- Source code
- Environment configuration
- Docker configuration (docker-compose.yml)
- Nginx configuration
- SSL certificates (if available)
- Deployment scripts
- Public assets
- Frontend code
- Data volumes (games, submissions, newsletters)

## Restoration Instructions:
1. Copy this backup directory to the new server
2. Run: ./scripts/restore.sh $BACKUP_NAME
3. Follow the interactive prompts

## Backup Size:
$(du -sh "$FULL_BACKUP_DIR" | cut -f1)

## Files Included:
$(ls -la "$FULL_BACKUP_DIR" | grep -v "^total" | grep -v "^\." | awk '{print $NF, $5}')
EOF

    log_success "Manifest created"
    echo ""
}

# Create summary
create_summary() {
    log_info "Creating backup summary..."

    local total_size=$(du -sh "$FULL_BACKUP_DIR" | cut -f1)
    local file_count=$(find "$FULL_BACKUP_DIR" -type f | wc -l)

    echo "=============================================="
    echo "  Backup Complete"
    echo "=============================================="
    echo ""
    echo "Backup Location: $FULL_BACKUP_DIR"
    echo "Total Size: $total_size"
    echo "Files: $file_count"
    echo ""
    echo "Contents:"
    for f in "$FULL_BACKUP_DIR"/*; do
        [ -f "$f" ] && echo "  - $(basename "$f") ($(du -h "$f" | cut -f1))"
    done
    echo ""
    echo "To restore on a new server:"
    echo "  1. Copy '$FULL_BACKUP_DIR' to the server"
    echo "  2. Run: ./scripts/restore.sh $BACKUP_NAME"
    echo "  3. Follow the prompts"
    echo ""

    # Also output a one-liner for easy use
    echo "ONE-LINER RESTORE COMMAND:"
    echo "  scp -r $FULL_BACKUP_DIR user@new-server:/opt/best-version-backup/"
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

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  create              Create a new backup (default)"
    echo "  list                List available backups"
    echo "  help                Show this help message"
    echo ""
    echo "Options:"
    echo "  BACKUP_DIR=<path>   Custom backup directory (environment variable)"
    echo ""
    echo "Examples:"
    echo "  $0 create"
    echo "  $0 list"
    echo "  BACKUP_DIR=/mnt/external ./backup.sh create"
}

# Main function
main() {
    print_header

    local command="${1:-create}"

    case $command in
        create)
            check_prerequisites
            setup_backup_dir
            backup_code
            backup_env
            backup_docker_config
            backup_nginx
            backup_scripts
            backup_ssl
            backup_public
            backup_frontend
            export_volumes
            # Fallback to filesystem backup if Docker export failed
            backup_filesystem_data
            create_manifest
            create_summary
            # Cleanup old backups after successful backup
            cleanup_old_backups
            ;;
        list)
            list_backups
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
