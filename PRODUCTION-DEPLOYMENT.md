# Best Version - Production Deployment Guide

Complete guide for deploying Best Version to production.

## Quick Reference

```bash
# 1. Setup server
git clone <repo-url> /opt/best-version
cd /opt/best-version
./scripts/setup-server.sh

# 2. Configure GitHub Secrets
# See .github/DEPLOYMENT.md for required secrets

# 3. Deploy
git push origin main

# 4. Monitor
./scripts/deploy.sh --no-health-check
```

## Architecture Overview

**Services:**
- **nginx** (port 80/443): Frontend, SSL termination, reverse proxy
- **app** (port 3000): Node.js backend API

**Data Volumes:**
- `games_data`: Game metadata storage
- `submissions_data`: User submissions
- `ssl_certs`: SSL certificates

## Prerequisites

### Server Requirements
- Linux (Ubuntu 20.04+ or Debian 10+)
- Docker 20.10+
- Docker Compose 2.0+
- 512MB RAM minimum (1GB recommended)

### GitHub Repository
- Code pushed to `main` branch
- GitHub Actions enabled

### Required Secrets (GitHub Settings → Secrets)
- `DEPLOY_HOST` - Server IP/hostname
- `DEPLOY_USER` - SSH username
- `DEPLOY_SSH_KEY` - SSH private key
- `RESEND_API_KEY` - Resend API key
- `SITE_URL` - Production URL
- `ADMIN_PASSWORD` - Admin authentication
- `COOKIE_SECRET` - Random secure string

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Automated deployment on push to main.

1. Configure GitHub secrets
2. Push code: `git push origin main`
3. Monitor: https://github.com/OWNER/REPO/actions

### Method 2: Deploy Script

On production server:

```bash
cd /opt/best-version
./scripts/deploy.sh
```

### Method 3: Manual Docker Compose

```bash
cd /opt/best-version
docker-compose down
docker-compose build
docker-compose up -d
```

## Initial Setup

### Automated Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and setup
git clone <repo-url> /opt/best-version
cd /opt/best-version
./scripts/setup-server.sh
```

### Manual Setup

```bash
# Create directories
mkdir -p /opt/best-version/{games,submissions,nginx/ssl}
cd /opt/best-version

# Clone repository
git clone <repo-url> .

# Create .env
cp .env.example .env
nano .env  # Update values

# Build and run
docker-compose build
docker-compose up -d
```

## SSL Configuration

### Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Script-based

```bash
./scripts/setup-ssl.sh your-domain.com
```

## Environment Configuration

Create `.env` file:

```bash
NODE_ENV=production
PORT=3000
RESEND_API_KEY=re_your_key
SITE_URL=https://your-domain.com
COOKIE_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)
```

## Operations

### Check Status

```bash
docker-compose ps          # Container status
docker-compose logs -f     # Live logs
curl http://localhost:3000/health  # Health check
```

### Deploy Update

```bash
git pull origin main
./scripts/deploy.sh
```

### Backup

```bash
./scripts/backup.sh create     # Create backup
./scripts/backup.sh list       # List backups
./scripts/backup.sh restore file.tar.gz  # Restore
```

### Rollback

```bash
./scripts/rollback.sh list             # List available
./scripts/rollback.sh local abc1234    # To version
./scripts/rollback.sh latest           # To latest
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker-compose logs app

# Check port
lsof -i :3000

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Frontend Issues

```bash
# Check nginx logs
docker-compose logs nginx

# Test nginx config
docker-compose exec nginx nginx -t
```

### Data Issues

```bash
# Check volumes
docker volume ls
docker inspect best-version_games
```

## Documentation

- **Setup Guide**: `docs/SETUP-GUIDE.md`
- **Quick Start**: `docs/QUICK-START.md`
- **Production Checklist**: `docs/PRODUCTION-CHECKLIST.md`
- **Deployment Summary**: `docs/DEPLOYMENT-SUMMARY.md`
- **GitHub Deployment**: `.github/DEPLOYMENT.md`
- **Script Reference**: `scripts/README.md`

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review deployment documentation
3. Check GitHub Actions workflow output
