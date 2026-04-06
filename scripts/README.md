# Best Version - Scripts Reference

This directory contains automated scripts for deployment, backup, restore, and server setup.

## Scripts Overview

### deploy.sh

Deploy the application using Docker Compose.

**Usage:**
```bash
./deploy.sh [OPTIONS]

Options:
  --no-health-check   Skip post-deploy health check
  --skip-build        Skip building (use existing image)
  --help, -h          Show help
```

**What it does:**
1. Checks prerequisites (Docker, Docker Compose)
2. Validates environment configuration
3. Creates data volumes if needed
4. Builds Docker image
5. Stops existing containers
6. Starts new containers
7. Runs health check
8. Shows deployment information

### backup.sh

Create a complete backup of the application.

**Usage:**
```bash
./backup.sh [COMMAND]

Commands:
  create              Create a new backup (default)
  list                List available backups
  help                Show help
```

**What it backs up:**
- Application source code
- Environment configuration (.env)
- Docker configuration (docker-compose.yml)
- nginx configuration
- Deployment scripts
- Public assets
- Frontend code
- Data volumes (games, submissions, newsletters)
- Backup manifest

**Backup location:** `backups/best-version-backup_TIMESTAMP/`

### restore.sh

Restore the application from a backup.

**Usage:**
```bash
./restore.sh [OPTIONS]

Options:
  --backup=<name>     Restore specific backup
  --list, -l          List available backups
  --help, -h          Show help
```

**What it does:**
1. Lists available backups
2. Confirms restore action
3. Stops existing containers
4. Restores application code
5. Restores configuration files
6. Restores data volumes
7. Sets permissions
8. Rebuilds and starts containers
9. Runs health check

### rollback.sh

Rollback to a previous version or backup.

**Usage:**
```bash
./rollback.sh [COMMAND]

Commands:
  backup=<name>       Rollback to specific backup
  latest              Rollback to latest available
  list                List available backups
  state               Show current state
  help                Show help
```

### setup-server.sh

One-command setup for a new server.

**Usage:**
```bash
REPO_URL=https://github.com/YOUR_REPO.git
./setup-server.sh

Options:
  --skip-deploy       Skip deployment step
  --help, -h          Show help
```

**What it does:**
1. Installs Docker and Docker Compose
2. Clones the repository
3. Creates environment configuration
4. Sets up data directories
5. Deploys the application
6. Creates initial backup

### restore.sh

Restore application from a backup to a brand new server.

**Usage:**
```bash
./restore.sh [OPTIONS]

Options:
  --backup=<name>     Restore specific backup
  --list, -l          List backups
  --help              Show help
```

**Perfect for:**
- Disaster recovery
- Setting up new servers
- Migrating to different hardware

## Complete Workflow

### Initial Deployment

```bash
# Option 1: One-command setup
REPO_URL=https://github.com/user/repo.git
./scripts/setup-server.sh

# Option 2: Manual setup
git clone <repo-url> /opt/best-version
cd /opt/best-version
cp .env.example .env
./scripts/deploy.sh
```

### Daily Operations

```bash
# Check status
docker-compose ps
./scripts/deploy.sh

# View logs
docker-compose logs -f
```

### Backup Routine

```bash
# Create backup
./scripts/backup.sh create

# List backups
./scripts/backup.sh list
```

### Disaster Recovery

```bash
# Copy backup to new server
scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version/backups/

# On new server
cd /opt/best-version
./scripts/restore.sh --list          # View backups
./scripts/restore.sh --backup=name   # Restore
```

### Rollback

```bash
# Rollback to backup
./scripts/rollback.sh backup=best-version-backup_TIMESTAMP

# Rollback to latest
./scripts/rollback.sh latest
```

## Environment Variables

These scripts work with environment variables:

```bash
# Backup location
BACKUP_DIR=/custom/path/backups

# Repository URL (for setup script)
REPO_URL=https://github.com/user/repo.git
```

## Security Notes

- Scripts should be run as a non-root user
- Never commit `.env` file to git
- Backup files contain sensitive data - store securely
- SSH keys for deployment should have minimal permissions

## Troubleshooting

### Permission Issues

```bash
chmod +x *.sh
```

### Docker Not Found

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

### Volume Issues

```bash
# Check volumes exist
docker volume ls | grep best-version

# Recreate volumes
docker-compose down
docker-compose up -d
```

## Best Practices

1. **Regular Backups:** Create backups before major changes
2. **Test Restores:** Periodically test backup restore
3. **Document Changes:** Keep commit messages clear
4. **Verify Health:** Always check health after deployment
5. **Monitor Logs:** Regularly review application logs

## Support

For more information:
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Setup Guide:** `docs/SETUP-GUIDE.md`
- **Quick Start:** `docs/QUICK-START.md`
