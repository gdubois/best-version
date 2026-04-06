# Best Version - Production Deployment Guide

## Overview

Best Version is deployed using Docker containers with named volumes for persistent data storage. The entire application (frontend + backend) runs in a single container.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Internet                          │
└─────────────────────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           │    Port 80/443          │
           │    Port 3000 (API)      │
           └────────────┬────────────┘
                        │
         ┌────────────────────────┐
         │    best-version        │
         │  Single Container      │
         │  - nginx (frontend)    │
         │  - Node.js (backend)   │
         └────────────────────────┘
                  │       │       │
         ┌────────┐ ┌───────────┐ ┌────────────┐
         │games_  │ │submissions│ │newsletters │
         │data    │ │_data      │ │_data       │
         └────────┘ └───────────┘ └────────────┘
```

**Key Components:**
- **Single Container**: nginx serves static files, Node.js runs the API
- **Named Volumes**: Persistent storage for games, submissions, newsletters
- **Ports**: 80/443 (HTTP/HTTPS), 3000 (internal API)

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### One-Command Setup (New Server)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Setup and deploy
REPO_URL=https://github.com/YOUR_REPO.git
sudo ./scripts/setup-server.sh
```

### Manual Setup

```bash
# Clone repository
git clone <repo-url> /opt/best-version
cd /opt/best-version

# Create .env file
cp .env.example .env
nano .env  # Update RESEND_API_KEY, SITE_URL, etc.

# Deploy
./scripts/deploy.sh
```

## Deployment

### Deploy Updates

```bash
cd /opt/best-version
./scripts/deploy.sh
```

**Automatic backup:** The deployment script creates a pre-deployment backup
before deploying, ensuring you can always rollback if needed.

### Deploy with Options

```bash
# Skip health check
./scripts/deploy.sh --no-health-check

# Use existing image (skip build)
./scripts/deploy.sh --skip-build
```

### Backup Retention

By default, the scripts maintain the **30 most recent backups**:
- `./scripts/deploy.sh` creates a pre-deployment backup and removes old ones
- `./scripts/backup.sh create` creates a full backup and cleans up old ones

Old backups beyond 30 are automatically removed during backup operations.

```bash
# Skip health check
./scripts/deploy.sh --no-health-check

# Use existing image (skip build)
./scripts/deploy.sh --skip-build
```

## Data Management

### Named Volumes

The application uses Docker named volumes for persistent data:

```bash
# List volumes
docker volume ls | grep best-version

# Inspect games volume
docker volume inspect best-version_games

# View games data
docker run --rm -v best-version_games:/data alpine ls /data
```

### Volume Mounts

- `best-version_games`: Game metadata files
- `best-version_submissions`: User submissions
- `best-version_newsletters`: Newsletter data
- `best-version_ssl`: SSL certificates

## Backup and Restore

### Create Backup

```bash
./scripts/backup.sh create
```

This creates a complete backup including:
- Application source code
- Environment configuration
- Docker configuration
- All data volumes (games, submissions, newsletters)
- nginx configuration

### List Backups

```bash
./scripts/backup.sh list
```

### Restore from Backup

```bash
./scripts/restore.sh
```

Interactive restore process that:
1. Lists available backups
2. Asks for confirmation
3. Stops existing containers
4. Restores all data and configuration
5. Rebuilds and starts containers

### Restore Specific Backup

```bash
./scripts/restore.sh best-version-backup_20260106_120000
```

### Restore to New Server

1. Copy backup to new server:
```bash
scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version-backup/
```

2. On new server:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Copy backup to project directory
cp -r /opt/best-version-backup/best-version-backup_*/ /opt/best-version/backups/

# Restore
cd /opt/best-version
./scripts/restore.sh
```

## Rollback

### Rollback to Backup

```bash
# List backups
./scripts/rollback.sh list

# Rollback to specific backup
./scripts/rollback.sh backup=best-version-backup_TIMESTAMP
```

### Rollback to Latest

```bash
# Rollback using latest available image
./scripts/rollback.sh latest
```

### View Current State

```bash
./scripts/rollback.sh state
```

## Management Commands

### Container Management

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f
docker-compose logs -f app

# Stop containers
docker-compose stop

# Start containers
docker-compose start

# Restart containers
docker-compose restart

# Stop and remove
docker-compose down
```

### Volume Management

```bash
# List volumes
docker volume ls | grep best-version

# Inspect volume
docker volume inspect best-version_games

# Remove volume (after stopping containers)
docker volume rm best-version_games
```

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost/health
```

## Environment Configuration

### Required Environment Variables

Create `.env` file:

```bash
NODE_ENV=production
PORT=3000
RESEND_API_KEY=re_your_api_key
SITE_URL=https://your-domain.com
COOKIE_SECRET=your-32-character-random-string
ADMIN_PASSWORD=your-secure-password
```

### Generate Secure Strings

```bash
# COOKIE_SECRET and ADMIN_PASSWORD
openssl rand -base64 32
```

## SSL Configuration

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

SSL certificates are stored in the `best-version_ssl` volume.

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs -f

# Check if ports are in use
lsof -i :80
lsof -i :443
lsof -i :3000

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Data Not Persisting

```bash
# Check volumes exist
docker volume ls | grep best-version

# Check volume contents
docker run --rm -v best-version_games:/data alpine ls /data/games

# Re-bind volumes
docker-compose down
docker-compose up -d
```

### Health Check Fails

```bash
# Check backend
curl -v http://localhost:3000/health

# Check nginx
curl -v http://localhost/health

# View logs
docker-compose logs --tail 100
```

### Restore Fails

```bash
# Verify backup exists
ls -la backups/best-version-backup_*/

# Check backup integrity
tar -tzf backups/best-version-backup_*/source.tar.gz | head

# Verify Docker is running
docker ps
docker-compose ps
```

## Production Checklist

- [ ] `.env` file configured with production values
- [ ] SSL certificates configured (if using HTTPS)
- [ ] Backup tested (create and restore)
- [ ] Health check passes
- [ ] Logs reviewed for errors
- [ ] Data persistence verified

## Support

### Documentation

- **Setup Guide**: `docs/SETUP-GUIDE.md`
- **Quick Start**: `docs/QUICK-START.md`
- **Production Checklist**: `docs/PRODUCTION-CHECKLIST.md`
- **Script Reference**: `scripts/README.md`

### Useful Links

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Nginx Documentation**: https://nginx.org/en/docs/
