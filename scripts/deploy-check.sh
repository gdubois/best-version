#!/bin/bash
# =============================================================================
# Best Version - Deployment Verification Script
# =============================================================================
# Run this script BEFORE deploying to ensure everything is ready
# =============================================================================

set -e

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        return 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        return 1
    fi

    log_success "Prerequisites met"
    return 0
}

# Check required files
check_files() {
    log_info "Checking required files..."

    local errors=0

    # Core files
    [ -f "docker-compose.yml" ] || { log_error "Missing: docker-compose.yml"; errors=$((errors+1)); }
    [ -f "Dockerfile" ] || { log_error "Missing: Dockerfile"; errors=$((errors+1)); }
    [ -f ".env" ] || { log_error "Missing: .env file"; errors=$((errors+1)); }
    [ -f ".env.example" ] || { log_warn "Missing: .env.example (can create from scratch)"; }

    # Scripts
    [ -x "scripts/deploy.sh" ] || { log_error "Missing or not executable: scripts/deploy.sh"; errors=$((errors+1)); }
    [ -x "scripts/docker-entrypoint.sh" ] || { log_error "Missing or not executable: scripts/docker-entrypoint.sh"; errors=$((errors+1)); }

    # Configuration
    [ -f "nginx/nginx.conf" ] || { log_error "Missing: nginx/nginx.conf"; errors=$((errors+1)); }

    # Data directories
    [ -d "games" ] || { log_warn "Missing: games/ directory (will be created by Docker)"; }
    [ -d "submissions" ] || { log_warn "Missing: submissions/ directory (will be created by Docker)"; }
    [ -d "newsletters" ] || { log_warn "Missing: newsletters/ directory (will be created by Docker)"; }

    # Source code
    [ -f "src/index.js" ] || { log_error "Missing: src/index.js"; errors=$((errors+1)); }
    [ -d "src/middleware" ] || { log_error "Missing: src/middleware/"; errors=$((errors+1)); }
    [ -d "src/routes" ] || { log_error "Missing: src/routes/"; errors=$((errors+1)); }
    [ -d "src/services" ] || { log_error "Missing: src/services/"; errors=$((errors+1)); }

    # Public assets
    [ -f "public/index.html" ] || { log_error "Missing: public/index.html"; errors=$((errors+1)); }

    # Frontend
    [ -f "frontend/package.json" ] || { log_error "Missing: frontend/package.json"; errors=$((errors+1)); }

    if [ $errors -eq 0 ]; then
        log_success "All required files present"
        return 0
    else
        log_error "$errors file(s) missing or incorrect"
        return 1
    fi
}

# Check .env configuration
check_env_config() {
    log_info "Checking .env configuration..."

    local errors=0

    # Check SITE_URL
    if grep -q "^SITE_URL=http://" .env 2>/dev/null; then
        log_warn "SITE_URL uses HTTP - consider using HTTPS for production"
    elif grep -q "^SITE_URL=https://" .env 2>/dev/null; then
        log_success "SITE_URL configured for HTTPS"
    fi

    # Check COOKIE_SECRET
    if grep -q "^COOKIE_SECRET=change-this" .env 2>/dev/null; then
        log_error "COOKIE_SECRET has not been changed - MUST update for production!"
        errors=$((errors+1))
    elif grep -q "^COOKIE_SECRET=" .env 2>/dev/null; then
        local secret_len=$(grep "^COOKIE_SECRET=" .env | cut -d= -f2 | wc -c)
        if [ $secret_len -lt 32 ]; then
            log_error "COOKIE_SECRET is too short - should be at least 32 characters!"
            errors=$((errors+1))
        else
            log_success "COOKIE_SECRET appears to be properly configured"
        fi
    fi

    # Check RESEND_API_KEY
    if grep -q "^RESEND_API_KEY=your" .env 2>/dev/null; then
        log_warn "RESEND_API_KEY has not been configured - email features will not work"
    elif grep -q "^RESEND_API_KEY=" .env 2>/dev/null; then
        local api_key=$(grep "^RESEND_API_KEY=" .env | cut -d= -f2)
        if [ ${#api_key} -gt 10 ]; then
            log_success "RESEND_API_KEY appears to be configured"
        fi
    fi

    if [ $errors -eq 0 ]; then
        log_success "Environment configuration looks good"
        return 0
    else
        log_error "Environment configuration has $errors issue(s)"
        return 1
    fi
}

# Check Dockerfile syntax
check_dockerfile() {
    log_info "Checking Dockerfile..."

    # Check for required COPY statements
    grep -q "COPY --from=builder /app/scripts ./scripts" Dockerfile || {
        log_error "Dockerfile missing scripts directory copy"
        return 1
    }

    grep -q "COPY nginx/nginx.conf /etc/nginx/nginx.conf" Dockerfile || {
        log_error "Dockerfile missing nginx.conf copy"
        return 1
    }

    grep -q 'CMD \["/app/scripts/docker-entrypoint.sh"\]' Dockerfile || {
        log_error "Dockerfile missing correct entrypoint command"
        return 1
    }

    log_success "Dockerfile looks correct"
    return 0
}

# Check script syntax
check_script_syntax() {
    log_info "Checking script syntax..."

    local errors=0

    bash -n scripts/deploy.sh || { log_error "scripts/deploy.sh has syntax errors"; errors=$((errors+1)); }
    bash -n scripts/docker-entrypoint.sh || { log_error "scripts/docker-entrypoint.sh has syntax errors"; errors=$((errors+1)); }
    bash -n scripts/backup.sh || { log_error "scripts/backup.sh has syntax errors"; errors=$((errors+1)); }
    bash -n scripts/restore.sh || { log_error "scripts/restore.sh has syntax errors"; errors=$((errors+1)); }

    # Check Node.js syntax
    node --check src/index.js 2>/dev/null || { log_error "src/index.js has syntax errors"; errors=$((errors+1)); }

    if [ $errors -eq 0 ]; then
        log_success "All script syntax is valid"
        return 0
    else
        log_error "$errors script(s) have syntax errors"
        return 1
    fi
}

# Main function
main() {
    echo "=============================================="
    echo "  Deployment Verification"
    echo "=============================================="
    echo ""

    local total_errors=0

    check_prerequisites || total_errors=$((total_errors+1))
    echo ""

    check_files || total_errors=$((total_errors+1))
    echo ""

    check_env_config || total_errors=$((total_errors+1))
    echo ""

    check_dockerfile || total_errors=$((total_errors+1))
    echo ""

    check_script_syntax || total_errors=$((total_errors+1))
    echo ""

    echo "=============================================="
    if [ $total_errors -eq 0 ]; then
        log_success "Deployment verification PASSED - ready to deploy!"
        echo ""
        echo "To deploy, run: ./scripts/deploy.sh"
        exit 0
    else
        log_error "Deployment verification FAILED - $total_errors issue(s) found"
        echo ""
        echo "Please fix the issues above before deploying."
        exit 1
    fi
}

# Run main
main "$@"
