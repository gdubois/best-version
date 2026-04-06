# Best Version - Deployment Ready

## Summary

Best Version is now fully prepared for production deployment using Docker containers. All data is persisted in Docker named volumes, and comprehensive backup/restore capabilities are available.

## Architecture

**Single Container Deployment:**
- **Frontend:** nginx (ports 80/443)
- **Backend:** Node.js API (port 3000)

**Data Persistence:**
- `best-version_games` - Game metadata
- `best-version_submissions` - User submissions
- `best-version_newsletters` - Newsletter data
- `best-version_ssl` - SSL certificates

## Quick Start

### On a New Server

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
exit  # Log out and back in

# 2. Clone and setup
git clone <repo-url> /opt/best-version
cd /opt/best-version

# 3. Configure
cp .env.example .env
nano .env  # Update RESEND_API_KEY, SITE_URL, etc.

# 4. Deploy
./scripts/deploy.sh
```

### Deploy to Existing Server

```bash
cd /opt/best-version
./scripts/deploy.sh
```

**Note:** The deployment script automatically:
1. Creates a pre-deployment backup of current data
2. Cleans up old backups (keeps only 30 most recent)
3. Builds and deploys the application

## Complete Data Backup

```bash
# Create backup (includes ALL data)
./scripts/backup.sh create

# Backup includes:
# - Application source code
# - Environment configuration
# - Docker configuration
# - nginx configuration
# - Scripts
# - Public assets
# - Frontend code
# - Data volumes (games, submissions, newsletters)
```

## Complete Data Restore

```bash
# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/restore.sh

# Or specify backup name
./scripts/restore.sh --backup=best-version-backup_TIMESTAMP
```

**Restore process:**
1. Stops existing containers
2. Restores application code
3. Restores configuration
4. Restores data volumes
5. Rebuilds and starts containers

## Deploy to Brand New Server from Backup

### Option 1: Copy Backup Only

```bash
# On source server
./scripts/backup.sh create
scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version-backup/

# On new server
curl -fsSL https://get.docker.com | sh
# Clone minimal repo (just needs docker-compose.yml, scripts)
git clone <repo-url> /opt/best-version
# Copy backup
cp -r /opt/best-version-backup/best-version-backup_*/ /opt/best-version/backups/
# Restore
cd /opt/best-version
./scripts/restore.sh
```

### Option 2: Full Automated Setup

```bash
# On new server
curl -fsSL https://get.docker.com | sh

REPO_URL=https://github.com/YOUR_REPO.git
git clone "$REPO_URL" /opt/best-version
cd /opt/best-version
cp .env.example .env
nano .env

./scripts/deploy.sh
```

## Backup to S3 (Optional)

```bash
# Set environment variables
export AWS_S3_BUCKET=your-bucket-name
export AWS_REGION=us-east-1

# Create backup (automatically uploads to S3)
./scripts/backup.sh create
```

## Rollback

```bash
# Rollback to specific backup
./scripts/rollback.sh backup=best-version-backup_TIMESTAMP

# Rollback to latest
./scripts/rollback.sh latest

# View current state
./scripts/rollback.sh state
```

## Management Commands

```bash
# Container status
docker-compose ps

# View logs
docker-compose logs -f

# Stop/Start
docker-compose stop
docker-compose start

# Restart
docker-compose restart

# Stop and remove
docker-compose down

# Volume management
docker volume ls | grep best-version
docker volume inspect best-version_games
```

## File Structure

```
/opt/best-version/
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container build
├── .env                        # Environment variables
├── scripts/
│   ├── deploy.sh              # Deploy script
│   ├── backup.sh              # Backup script
│   ├── restore.sh             # Restore script
│   ├── rollback.sh            # Rollback script
│   ├── setup-server.sh        # Server setup script
│   └── docker-entrypoint.sh   # Container entrypoint
├── backups/
│   └── best-version-backup_TIMESTAMP/
│       ├── MANIFEST.txt       # Backup manifest
│       ├── source.tar.gz      # Source code
│       ├── .env               # Environment file
│       ├── docker-compose.yml
│       ├── nginx.tar.gz       # nginx config
│       ├── scripts.tar.gz     # Scripts
│       ├── public.tar.gz      # Public assets
│       ├── frontend.tar.gz    # Frontend
│       └── *_volume.tar.gz    # Data volumes
└── docs/
    ├── DEPLOYMENT.md          # Deployment guide
    ├── NEW-SERVER-DEPLOYMENT.md  # New server guide
    ├── SETUP-GUIDE.md         # Setup guide
    ├── QUICK-START.md         # Quick reference
    └── PRODUCTION-CHECKLIST.md  # Pre-deploy checklist
```

## Docker Volume Inspections

```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect best-version_games

# View volume contents
docker run --rm -v best-version_games:/data alpine ls /data

# View file count
docker run --rm -v best-version_games:/data alpine find /data -name "*.json" | wc -l
```

## Health Checks

```bash
# Backend API
curl http://localhost:3000/health

# Frontend
curl http://localhost/health

# API endpoint
curl http://localhost:3000/api/games
```

## Security Checklist

- [x] Non-root container user
- [x] HTTPS support (ports 80/443)
- [x] Environment variables not in git
- [x] SSL certificate support
- [x] Volume-based data persistence
- [ ] Configure firewall (ports 80, 443, 22)
- [ ] Configure Docker secrets for production

## Disaster Recovery

### Scenario: Complete Server Failure

1. Provision new server with Ubuntu/Debian
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Copy backup: `scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version/backups/`
4. Clone minimal repo or use backup's docker-compose.yml
5. Restore: `./scripts/restore.sh`

### Scenario: Corrupted Data

1. Stop containers: `docker-compose down`
2. Restore from backup: `./scripts/restore.sh`
3. Restart: `docker-compose up -d`

## Testing Checklist

- [ ] Application starts successfully
- [ ] Health checks pass
- [ ] API endpoints respond
- [ ] Frontend loads
- [ ] Games data accessible
- [ ] Submissions data accessible
- [ ] Backup creates successfully
- [ ] Backup contains all data
- [ ] Restore completes successfully
- [ ] Rollback works correctly

## Next Steps

1. Review and update `.env` with production values
2. Run `./scripts/deploy.sh`
3. Verify deployment with health checks
4. Create first backup
5. Test restore procedure
6. Document any custom configurations

## Support

- **Deployment:** `docs/DEPLOYMENT.md`
- **New Server:** `docs/NEW-SERVER-DEPLOYMENT.md`
- **Setup:** `docs/SETUP-GUIDE.md`
- **Scripts:** `scripts/README.md`
