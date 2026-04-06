#!/bin/bash
# =============================================================================
# Best Version - Server Setup Script
# =============================================================================
# One-command setup for a brand new server
# Installs Docker, clones repository, and deploys the application
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

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
    echo "  Best Version - Server Setup"
    echo "=============================================="
    echo ""
    echo "This script will:"
    echo "  1. Install Docker and Docker Compose"
    echo "  2. Clone the repository"
    echo "  3. Configure environment"
    echo "  4. Deploy the application"
    echo ""
}

# Install Docker
install_docker() {
    log_info "Installing Docker..."

    # Update package index
    apt-get update -qq > /dev/null

    # Install dependencies
    apt-get install -y -qq ca-certificates curl gnupg > /dev/null

    # Create keyring directory
    install -m 0755 -d /etc/apt/keyrings

    # Add Docker's GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg > /dev/null

    # Set up repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update -qq > /dev/null
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null

    # Add user to docker group (if not root)
    if [ "$(id -u)" -ne 0 ]; then
        if ! groups | grep -q "\bdocker\b"; then
            usermod -aG docker $USER
            log_warn "User added to docker group. Log out and back in for changes to take effect."
        fi
    fi

    # Enable Docker
    systemctl enable docker
    systemctl start docker

    log_success "Docker installed"
    echo ""
}

# Install Docker Compose standalone (as plugin)
install_compose() {
    log_info "Verifying Docker Compose..."

    # Docker Compose plugin should be available
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose available: $(docker-compose --version)"
    else
        log_warn "Docker Compose plugin not found, installing standalone..."
        COMPOSE_VERSION="2.24.0"
        curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose installed"
    fi
    echo ""
}

# Clone repository
clone_repo() {
    log_info "Cloning repository..."

    # Check if already cloned
    if [ -d "/opt/best-version" ]; then
        log_info "Repository already exists at /opt/best-version"
        log_info "Will update existing installation..."

        cd /opt/best-version
        git fetch origin main 2>/dev/null || true
        git pull --rebase origin main 2>/dev/null || true
    else
        # Clone new repository
        if [ -n "$REPO_URL" ]; then
            git clone "$REPO_URL" /opt/best-version
        elif [ -n "$GITHUB_TOKEN" ]; then
            log_error "REPO_URL not set. Please provide repository URL."
            exit 1
        else
            log_error "No repository URL provided."
            exit 1
        fi
    fi

    cd /opt/best-version
    log_success "Repository ready"
    echo ""
}

# Setup environment
setup_env() {
    log_info "Setting up environment..."

    cd /opt/best-version

    # Create .env if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env from .env.example"
            log_warn "Please update .env with production values:"
            echo "  - RESEND_API_KEY"
            echo "  - SITE_URL"
            echo "  - COOKIE_SECRET (generate with: openssl rand -base64 32)"
            echo "  - ADMIN_PASSWORD"
        else
            log_error "No .env or .env.example found"
            exit 1
        fi
    else
        log_success ".env already exists"
    fi

    echo ""
}

# Setup directories
setup_directories() {
    log_info "Creating data directories..."

    cd /opt/best-version

    # Ensure directories exist
    mkdir -p games submissions newsletters nginx/ssl

    # Set permissions
    chmod 755 games submissions newsletters

    log_success "Directories ready"
    echo ""
}

# Deploy application
deploy() {
    log_info "Deploying application..."

    cd /opt/best-version

    # Build and run
    ./scripts/deploy.sh

    log_success "Deployment complete"
    echo ""
}

# Create initial backup
create_initial_backup() {
    log_info "Creating initial backup..."

    cd /opt/best-version

    if [ -f "./scripts/backup.sh" ]; then
        ./scripts/backup.sh create
    else
        log_warn "Backup script not found, skipping initial backup"
    fi

    echo ""
}

# Show next steps
show_next_steps() {
    echo "=============================================="
    echo "  Next Steps"
    echo "=============================================="
    echo ""

    log_info "1. Update environment configuration:"
    echo "   Edit /opt/best-version/.env"
    echo "   Update these values:"
    echo "   - RESEND_API_KEY (from Resend dashboard)"
    echo "   - SITE_URL (your domain)"
    echo "   - COOKIE_SECRET (random 32+ chars)"
    echo "   - ADMIN_PASSWORD (secure password)"
    echo ""

    log_info "2. Apply changes:"
    echo "   cd /opt/best-version"
    echo "   ./scripts/deploy.sh"
    echo ""

    log_info "3. Configure SSL (optional):"
    echo "   sudo apt install certbot python3-certbot-nginx"
    echo "   sudo certbot --nginx -d your-domain.com"
    echo ""

    log_info "4. Access the application:"
    echo "   - HTTP:  http://localhost"
    echo "   - API:   http://localhost:3000"
    echo "   - Health: http://localhost:3000/health"
    echo ""

    log_info "5. Management commands:"
    echo "   docker-compose logs -f          # View logs"
    echo "   docker-compose ps               # Container status"
    echo "   ./scripts/backup.sh create      # Backup"
    echo "   ./scripts/restore.sh            # Restore"
    echo ""

    log_info "6. Documentation:"
    echo "   - /opt/best-version/docs/DEPLOYMENT.md"
    echo "   - /opt/best-version/docs/SETUP-GUIDE.md"
    echo ""
}

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  REPO_URL=<url>      Repository URL (required if not on server)"
    echo "  --skip-deploy       Skip deployment step"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  REPO_URL=https://github.com/user/repo.git $0"
    echo "  $0 --skip-deploy     # Setup but don't deploy"
    echo ""
}

# Main function
main() {
    print_header

    # Skip deploy option
    local skip_deploy=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deploy)
                skip_deploy=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            REPO_URL=*)
                export REPO_URL="${1#*=}"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # Check if running as root
    if [ "$(id -u)" -eq 0 ]; then
        log_error "This script should not be run as root"
        log_error "Run as: sudo $0"
        exit 1
    fi

    # Check operating system
    if ! command -v apt-get &> /dev/null; then
        log_error "This script requires Debian/Ubuntu"
        exit 1
    fi

    # Run setup steps
    install_docker
    install_compose
    clone_repo
    setup_env
    setup_directories

    if [ "$skip_deploy" = false ]; then
        deploy
        create_initial_backup
    else
        log_warn "Skipping deployment as requested"
    fi

    show_next_steps

    log_success "=============================================="
    log_success "  Server Setup Complete!"
    log_success "=============================================="
    echo ""
}

# Run main
main "$@"
