# Best Version - Production Deployment Guide

**Quick Summary:** Deploy the Best Version application using Docker Compose on a Linux server, with automated GitHub Actions CI/CD.

## Architecture

```
                    Internet
                        │
           ┌────────────┴────────────┐
           │    Port 80/443 (nginx)  │
           │   SSL Termination       │
           │   Reverse Proxy         │
           └────────────┬────────────┘
                        │
           ┌────────────▼────────────┐
           │    Port 3000 (Node.js)  │
           │   API Backend           │
           └────────────┬────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌─────────┐  ┌──────────────┐  ┌────────────┐
   │ games/  │  │ submissions/ │  │ newsletters│
   │ volume  │  │    volume    │  │   volume   │
   └─────────┘  └──────────────┘  └────────────┘
```

- **Frontend (nginx):** Static file serving, SSL termination, reverse proxy
- **Backend (Node.js):** API server, game metadata, submissions processing
- **Volumes:** Persistent data storage for games, submissions, newsletters

## Quick Deploy

### Prerequisites

- Linux server (Ubuntu/Debian recommended)
- Docker 20.10+ and Docker Compose 2.0+
- Git repository on GitHub
- Domain name (optional, for SSL)

### One-Command Setup

```bash
# On your server
curl -fsSL https://get.docker.com | sh
git clone <your-repo-url> /opt/best-version
cd /opt/best-version
./scripts/setup-server.sh
```

### Configure GitHub Secrets

Add these secrets to your repository (Settings → Secrets):

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key (generate with `ssh-keygen`) |
| `RESEND_API_KEY` | Resend API key for email |
| `SITE_URL` | Production URL |
| `ADMIN_PASSWORD` | Admin authentication |
| `COOKIE_SECRET` | Random secure string (32+ chars) |

### Deploy

Push to main branch to trigger GitHub Actions:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

Monitor at: https://github.com/YOUR_REPO/actions

## Local Testing

```bash
# Create .env file
cp .env.example .env
nano .env  # Update values for local use

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Backend: http://localhost:3000
# Frontend: http://localhost:80
```

## Managing Deployment

### Deploy Update

```bash
# On server
cd /opt/best-version
./scripts/deploy.sh
```

### View Status

```bash
docker-compose ps        # Container status
docker-compose logs -f   # Live logs
curl http://localhost:3000/health  # Health check
```

### Backup

```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Restore
./scripts/backup.sh restore backup_daily_20260106_120000.tar.gz
```

### Rollback

```bash
# To specific version
./scripts/rollback.sh local abc1234

# To latest
./scripts/rollback.sh latest
```

## Documentation

- **Full Guide:** `docs/DEPLOYMENT.md`
- **Quick Start:** `docs/QUICK-START.md`
- **Checklist:** `docs/PRODUCTION-CHECKLIST.md`
- **GitHub Actions:** `.github/workflows/deploy.yml`
