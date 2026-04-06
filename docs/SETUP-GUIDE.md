# Best Version - Complete Setup Guide

This guide provides step-by-step instructions for setting up the Best Version application on a production server.

## Prerequisites

### What You Need

1. **Linux Server** - Ubuntu 20.04+ or Debian 10+ recommended
2. **Domain Name** - Optional, for SSL certificates
3. **GitHub Account** - For code repository and CI/CD
4. **Resend Account** - Free tier for email functionality

### Server Requirements

- **CPU:** 1 vCPU minimum
- **RAM:** 512 MB minimum, 1 GB recommended
- **Disk:** 5 GB minimum
- **Network:** Outbound HTTPS (for pulling Docker images)

### Costs

- **Hosting:** $5-10/month (VPS) or $0 (Raspberry Pi at home)
- **Domain:** $10-15/year
- **Resend:** Free for first 3,000 emails/month

## Quick Setup (Recommended)

### Step 1: Prepare Server

SSH into your server:

```bash
ssh user@your-server-ip
```

Run the automated setup script (recommended):

```bash
# Install Docker and setup server
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt-get install -y git

# Log out and back in to apply group changes
exit
ssh user@your-server-ip

# Clone and setup
git clone <your-repo-url> /opt/best-version
cd /opt/best-version
sudo ./scripts/setup-server.sh
```

### Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Add these secrets:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Your server IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key (generate below) |
| `RESEND_API_KEY` | Your Resend API key |
| `SITE_URL` | Your domain or server IP |
| `ADMIN_PASSWORD` | Random secure string |
| `COOKIE_SECRET` | Random secure string (32+ chars) |

**Generate SSH Key:**

```bash
# Generate deployment key (run locally)
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N "" -C "deploy@best-version"

# Get public key for server authorized_keys
cat ~/.ssh/deploy_key.pub
# Add this to your server's ~/.ssh/authorized_keys

# Get private key content for GitHub secret
cat ~/.ssh/deploy_key
# Copy entire output to DEPLOY_SSH_KEY secret
```

**Generate Secure Random Strings:**

```bash
# Generate random strings for secrets
openssl rand -base64 32
# Use output for COOKIE_SECRET and ADMIN_PASSWORD
```

### Step 3: Configure Environment Variables

```bash
# On server
cd /opt/best-version

# Create .env file
nano .env
```

Add/update these values:

```bash
NODE_ENV=production
PORT=3000
RESEND_API_KEY=re_your_api_key
SITE_URL=https://your-domain.com
COOKIE_SECRET=your-random-32-char-string
ADMIN_PASSWORD=your-secure-password
```

### Step 4: Deploy

```bash
# Commit and push
git add .
git commit -m "Production deployment"
git push origin main
```

Monitor the deployment at:
```
https://github.com/YOUR_REPO/actions
```

### Step 5: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check health
curl http://localhost:3000/health

# Check frontend
curl http://localhost/health
```

## Manual Setup

If you prefer manual setup instead of the automated script:

### Install Docker

```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker-compose --version
```

### Clone Repository

```bash
mkdir -p /opt/best-version
cd /opt/best-version
git clone <your-repo-url> .
git checkout main
```

### Create Configuration

```bash
# Create directories
mkdir -p games submissions nginx/ssl

# Create .env file
cp .env.example .env
nano .env
# Update values as shown above
```

### Build and Run

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

## SSL Setup

### With Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
```

### Without Domain (Self-signed)

For development or testing:

```bash
# Generate self-signed certificate
mkdir -p nginx/ssl
cd nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout key.pem -out cert.pem \
    -subj "/CN=localhost"
```

## DNS Configuration

Update your domain's DNS settings:

```
Type    Name                Value
A       @                   <server-ip>
A       www                 <server-ip>
```

DNS propagation may take up to 48 hours (usually much faster).

## Post-Setup Tasks

### 1. Test Email Functionality

```bash
# Check Resend API is configured
curl http://localhost:3000/health | grep -i email

# Or check logs
docker-compose logs app | grep -i email
```

### 2. Configure Firewall

```bash
# If using ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 3. Set Up Monitoring

```bash
# Install monitoring tools (optional)
sudo apt-get install -y htop

# Monitor resources
docker stats

# Set up log rotation
sudo mkdir -p /var/log/best-version
sudo docker-compose down
sudo docker-compose up -d
```

### 4. Test Backup and Restore

```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Test restore (in a safe environment first)
./scripts/backup.sh restore backup_daily_TIMESTAMP.tar.gz
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check port conflicts
sudo lsof -i :3000
sudo lsof -i :80

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### HTTPS Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

### API Not Responding

```bash
# Check backend is running
docker-compose ps | grep app

# Test backend directly
curl http://localhost:3000/api/games

# Check nginx config
docker-compose exec nginx nginx -t
```

## Next Steps

- Read the [Deployment Guide](DEPLOYMENT.md) for detailed procedures
- Review the [Quick Start](QUICK-START.md) for common tasks
- Follow the [Production Checklist](PRODUCTION-CHECKLIST.md) before going live
