# Best Version - New Server Deployment Guide

Complete guide for deploying Best Version to a brand new server from scratch.

## Quick Deploy (Recommended)

### Step 1: Provision Server

Use your hosting provider to create a new server:
- **OS:** Ubuntu 20.04 LTS or Debian 11+
- **Minimum:** 1 vCPU, 512MB RAM, 10GB storage
- **Recommended:** 1 vCPU, 1GB RAM, 20GB storage

### Step 2: SSH into Server

```bash
ssh user@your-server-ip
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
```

**Note:** Log out and back in for group changes to take effect.

### Step 4: Setup and Deploy

```bash
# Clone and setup
REPO_URL=https://github.com/YOUR_USERNAME/REPO_NAME.git
git clone "$REPO_URL" /opt/best-version
cd /opt/best-version

# Create .env file
cp .env.example .env
nano .env
```

Update `.env` with production values:
```bash
NODE_ENV=production
PORT=3000
RESEND_API_KEY=re_your_api_key
SITE_URL=https://your-domain.com
COOKIE_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)
```

### Step 5: Deploy

```bash
./scripts/deploy.sh
```

### Step 6: Verify

```bash
# Check status
docker-compose ps

# Check health
curl http://localhost:3000/health

# Check application
curl http://localhost
```

## Complete Manual Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt-get update

# Install git
sudo apt-get install -y git

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
mkdir -p /opt/best-version
cd /opt/best-version
git clone <your-repo-url> .
git checkout main
```

### 3. Configure Environment

```bash
# Create .env
cp .env.example .env
nano .env
```

Required values:
- `RESEND_API_KEY` - From Resend dashboard
- `SITE_URL` - Your domain or server IP
- `COOKIE_SECRET` - Generate with `openssl rand -base64 32`
- `ADMIN_PASSWORD` - Your admin password

### 4. Create Data Directories

```bash
mkdir -p games submissions newsletters nginx/ssl
chmod 755 games submissions newsletters
```

### 5. Deploy

```bash
./scripts/deploy.sh
```

### 6. Setup SSL (Optional)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

## Migrating from Existing Server

### 1. Create Backup on Source Server

```bash
cd /opt/best-version
./scripts/backup.sh create
```

Note the backup directory name, e.g., `best-version-backup_20260106_120000/`

### 2. Copy Backup to New Server

```bash
# On source server
scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version-backup/

# Or use rsync for large backups
rsync -avz backups/best-version-backup_*/ user@new-server:/opt/best-version-backup/
```

### 3. Setup New Server

```bash
# On new server
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git

# Create directories
mkdir -p /opt/best-version
cd /opt/best-version

# Copy backup
cp -r /opt/best-version-backup/best-version-backup_*/ backups/

# Copy repository (if available)
git clone <your-repo-url> .

# Restore
./scripts/restore.sh --backup=best-version-backup_TIMESTAMP
```

## Automated One-Command Setup

For a completely new server, use the automated setup script:

```bash
# Install Docker first
curl -fsSL https://get.docker.com | sh

# Clone and setup (will deploy automatically)
REPO_URL=https://github.com/YOUR_REPO.git
git clone "$REPO_URL" /tmp/best-version-setup
cd /tmp/best-version-setup
sudo ./scripts/setup-server.sh
```

## Post-Deployment Tasks

### 1. Verify Deployment

```bash
# Container status
docker-compose ps

# Application health
curl http://localhost:3000/health

# Frontend
curl http://localhost/

# API
curl http://localhost:3000/api/games
```

### 2. Configure Firewall

```bash
# If using ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 3. Test Backup

```bash
# Create test backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Verify backup contents
ls -la backups/
```

### 4. Monitor Logs

```bash
# Real-time logs
docker-compose logs -f

# Recent logs
docker-compose logs --tail 50
```

## Troubleshooting

### Docker Installation Issues

```bash
# Check Docker status
sudo systemctl status docker

# Start Docker
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker
```

### Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Stop conflicting service
sudo systemctl stop nginx  # Example
```

### Container Won't Start

```bash
# Check logs
docker-compose logs -f app

# Check volume permissions
ls -la /opt/best-version/

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Cannot Access Application

```bash
# Check if ports are listening
sudo netstat -tulpn | grep -E '80|443|3000'

# Check firewall
sudo ufw status

# Test locally
curl http://localhost
```

## Next Steps

1. **Monitor:** Set up logging and monitoring
2. **Backup:** Schedule regular backups
3. **Update:** Keep system and Docker updated
4. **Security:** Configure firewall and SSL
5. **Documentation:** Document any custom changes

## Useful Commands

```bash
# Deployment
./scripts/deploy.sh

# Backup
./scripts/backup.sh create

# Restore
./scripts/restore.sh

# Rollback
./scripts/rollback.sh list

# Status
docker-compose ps
docker-compose logs -f

# Volume management
docker volume ls | grep best-version
```

## Support

For additional help:
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Script Reference:** `scripts/README.md`
- **Quick Start:** `docs/QUICK-START.md`
