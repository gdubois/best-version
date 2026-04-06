# Best Version - Quick Start Guide

## For Developers

### Local Development

```bash
# Install dependencies
npm install

# Start backend
npm start

# Or use Docker Compose
docker-compose up -d app

# Backend runs on http://localhost:3000
```

### Run Tests

```bash
npm test
```

## For Deployment

### Prerequisites

1. **Server with Docker** - Ubuntu/Debian recommended
2. **GitHub repository** - For CI/CD
3. **Domain name** - For production (optional)

### One-Command Setup

```bash
# On your server
git clone <your-repo-url> /opt/best-version
cd /opt/best-version

# Run setup script
./scripts/setup-server.sh
```

### Manual Setup

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone repository
git clone <your-repo-url> /opt/best-version
cd /opt/best-version

# 3. Create .env file
cp .env.example .env
nano .env  # Update RESEND_API_KEY, SITE_URL, ADMIN_PASSWORD

# 4. Build and run
docker-compose build
docker-compose up -d
```

### GitHub Actions Deployment

1. **Configure GitHub Secrets:**
   - `DEPLOY_HOST` - Server IP/hostname
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_SSH_KEY` - SSH private key (generate with `ssh-keygen -t ed25519`)
   - `RESEND_API_KEY` - Your Resend API key
   - `SITE_URL` - Production URL

2. **Push to deploy:**
   ```bash
   git add .
   git commit -m "Deploy update"
   git push origin main
   ```

3. **Monitor deployment:**
   - GitHub Actions tab: https://github.com/OWNER/REPO/actions

## Managing Your Deployment

### View Status

```bash
# Container status
docker-compose ps

# Logs
docker-compose logs -f

# Health check
curl http://localhost:3000/health
```

### Deploy New Version

```bash
# On server
cd /opt/best-version
git pull origin main
./scripts/deploy.sh
```

### Rollback

```bash
# Rollback to specific version
./scripts/rollback.sh local abc1234

# Rollback to latest
./scripts/rollback.sh latest
```

### Backup

```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore backup_daily_20260106_120000.tar.gz
```

## Environment Variables

Required variables in `.env`:

```bash
NODE_ENV=production
PORT=3000
RESEND_API_KEY=re_xxx
SITE_URL=https://your-domain.com
COOKIE_SECRET=super-random-secure-string
ADMIN_PASSWORD=secure-password
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs app

# Check if port 3000 is in use
lsof -i :3000

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Frontend won't start

```bash
# Check nginx logs
docker-compose logs nginx

# Check nginx config
docker-compose exec nginx nginx -t
```

### Health check fails

```bash
# Check app health
curl -v http://localhost:3000/health

# Check nginx health
curl -v http://localhost:80/health

# Check if backend is accessible from nginx
docker-compose exec nginx wget -qO- http://app:3000/health
```

## Resources

- Full deployment guide: `docs/DEPLOYMENT.md`
- Architecture docs: `.ralph/specs/planning-artifacts/architecture.md`
- PRD: `.ralph/specs/planning-artifacts/prd.md`
