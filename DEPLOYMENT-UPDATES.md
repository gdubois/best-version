# Best Version - Deployment Updates

## Summary

The deployment system has been updated with automatic backup and retention policies to ensure reliable deployments and easy rollback capabilities.

## Key Changes

### 1. Deployment Script Auto-Backup

The `deploy.sh` script now automatically:
1. Creates a **pre-deployment backup** before deploying
2. Saves current data to `backups/pre-deploy-backup_TIMESTAMP/`
3. Removes old full backups to maintain only 30 most recent

**Backup contents:**
- games/ directory
- submissions/ directory
- newsletters/ directory
- .env file
- docker-compose.yml
- nginx/ configuration

### 2. Backup Retention Policy

Both `backup.sh` and `deploy.sh` now maintain **30 most recent backups**:
- Old backups beyond 30 are automatically removed
- Successful backup triggers cleanup of older backups
- Clean retention management

### 3. Backup Location

All backups are stored in `backups/` directory:
```
backups/
├── pre-deploy-backup_TIMESTAMP/       # Pre-deployment backups
└── best-version-backup_TIMESTAMP/     # Full backup archives
```

## Usage

### Deploy (with auto-backup)

```bash
./scripts/deploy.sh
```

This will:
1. Create pre-deployment backup
2. Clean up old backups (keep 30)
3. Build and deploy application

### Manual Backup (with retention)

```bash
./scripts/backup.sh create
```

This will:
1. Create full backup (code + all data)
2. Clean up old backups (keep 30)

### View Backups

```bash
./scripts/backup.sh list
```

### Restore from Backup

```bash
./scripts/restore.sh --backup=best-version-backup_TIMESTAMP
```

## Backup Retention Details

**Configuration:**
- Max backups: 30
- Trigger: Successful backup operation
- Cleanup: Removes oldest backups after new one created

**Backup types kept:**
- `pre-deploy-backup_*` - Created before each deploy
- `best-version-backup_*` - Full archive backups

## Rollback Strategy

### Quick Rollback (Pre-deploy backup)

```bash
# Deploy failed? Use pre-deploy backup
./scripts/restore.sh --backup=pre-deploy-backup_TIMESTAMP
```

### Full Restore (Full backup)

```bash
# Restore complete application state
./scripts/restore.sh --backup=best-version-backup_TIMESTAMP
```

### Script-based Rollback

```bash
# View rollback options
./scripts/rollback.sh list

# Rollback to specific backup
./scripts/rollback.sh backup=best-version-backup_TIMESTAMP
```

## Migration to New Server

### From Backup Only

```bash
# On source server
./scripts/backup.sh create
scp -r backups/best-version-backup_*/ user@new-server:/opt/best-version/backups/

# On new server
./scripts/restore.sh --backup=best-version-backup_TIMESTAMP
```

The restore process will:
1. Stop existing containers
2. Restore all data and configuration
3. Rebuild and start containers

## Benefits

1. **Zero data loss:** Pre-deployment backup ensures rollback is always possible
2. **Storage management:** Automatic cleanup prevents disk exhaustion
3. **Simple operations:** One command handles backup + deploy
4. **Disaster recovery:** Full backups can restore to any server
5. **Retention compliance:** Maintains historical backups within limits

## Configuration

### Change Retention Count

Edit `scripts/backup.sh`:
```bash
MAX_BACKUPS=30  # Change to desired number
```

Edit `scripts/deploy.sh`:
```bash
local max_backups=30  # Change to desired number
```

### Change Backup Location

Set environment variable:
```bash
BACKUP_DIR=/custom/path ./scripts/backup.sh create
```

## Troubleshooting

### Backups Not Cleaning Up

Check if MAX_BACKUPS is set correctly:
```bash
grep MAX_BACKUP scripts/backup.sh
grep max_backups scripts/deploy.sh
```

### Out of Disk Space

List backup sizes:
```bash
du -sh backups/*
```

Manually remove old backups:
```bash
rm -rf backups/best-version-backup_OLDEST
```

### Pre-deploy Backup Missing

The pre-deploy backup goes to `backups/pre-deploy-backup_TIMESTAMP/`.
Verify it exists before deployment:
```bash
ls -la backups/pre-deploy-*
```

## Testing

### Verify Deployment Backup

```bash
# Deploy and check backup was created
./scripts/deploy.sh
ls -la backups/pre-deploy-*
```

### Verify Retention

```bash
# Create multiple backups
for i in {1..35}; do ./scripts/backup.sh create; sleep 1; done

# Verify only 30 remain
./scripts/backup.sh list
```

## Summary

The deployment system now provides:
- Automatic pre-deployment backups
- 30 backup retention policy
- Full restore capabilities
- Easy migration between servers
- Disaster recovery support

All without manual intervention - just run `./scripts/deploy.sh` and the system handles backups automatically.
