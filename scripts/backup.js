#!/usr/bin/env node

/**
 * Backup Runner Script
 * Story 6.5: Data Backup and Recovery
 *
 * This script runs automated backups of the games and submissions directories.
 * Can be run manually or scheduled via cron job.
 *
 * Usage:
 *   node scripts/backup.js               # Create a new backup
 *   node scripts/backup.js list          # List all backups
 *   node scripts/backup.js status        # Show backup statistics
 *   node scripts/backup.js cleanup       # Remove old backups (30+ days)
 *   node scripts/backup.js restore <id>  # Restore from backup
 *
 * Cron job example (weekly backup on Sunday at 2 AM):
 *   0 2 * * 0 cd /path/to/app && node scripts/backup.js >> logs/backup.log 2>&1
 *
 * Cron job example (daily cleanup of old backups):
 *   0 3 * * * cd /path/to/app && node scripts/backup.js cleanup >> logs/backup.log 2>&1
 */

const path = require('path');
const { BackupService } = require('../src/services/backupService');

// Configuration
const GAMES_DIR = path.join(__dirname, '../games');
const SUBMISSIONS_DIR = path.join(__dirname, '../submissions');
const BACKUP_DIR = path.join(__dirname, '../backups');

// Initialize backup service
const backupService = new BackupService(GAMES_DIR, SUBMISSIONS_DIR, BACKUP_DIR);

/**
 * Create a new backup
 */
async function createBackup() {
  console.log('=== Creating Backup ===');
  console.log(`Games Directory: ${GAMES_DIR}`);
  console.log(`Submissions Directory: ${SUBMISSIONS_DIR}`);
  console.log(`Backup Directory: ${BACKUP_DIR}\n`);

  const result = await backupService.createBackup();

  if (result.success) {
    console.log('\n=== Backup Successful ===');
    console.log(`Backup ID: ${result.backupId}`);
    console.log(`Path: ${result.path}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Size: ${backupService.formatBytes(result.size)}`);
    console.log(`Format: ${result.format || 'zip'}`);
  } else {
    console.log('\n=== Backup Failed ===');
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
}

/**
 * List all backups
 */
function listBackups() {
  console.log('=== Available Backups ===\n');

  const backups = backupService.listBackups();

  if (backups.length === 0) {
    console.log('No backups found.');
    return;
  }

  console.log(`${'ID'.padEnd(30)} ${'Date'.padEnd(24)} ${'Age'.padEnd(8)} ${'Size'.padEnd(12)} ${'Format'}`);
  console.log('-'.repeat(80));

  for (const backup of backups) {
    const date = backup.timestamp.toLocaleString();
    console.log(
      `${backup.id.padEnd(30)} ${date.padEnd(24)} ${backup.age.toString().padEnd(8)} ${backupService.formatBytes(backup.size).padEnd(12)} ${backup.format}`
    );
  }
}

/**
 * Show backup statistics
 */
function showStatus() {
  console.log('=== Backup Status ===\n');

  const stats = backupService.getStatistics();

  console.log(`Total Backups: ${stats.totalBackups}`);
  console.log(`Total Size: ${stats.totalSizeFormatted}`);
  console.log(`Retention Period: ${stats.retentionDays} days`);
  console.log(`Oldest Backup: ${stats.oldestBackup || 'N/A'}`);
  console.log(`Newest Backup: ${stats.newestBackup || 'N/A'}`);
  console.log(`Backups Expiring Soon: ${stats.backupsExpiring}`);
}

/**
 * Cleanup old backups
 */
async function cleanupBackups() {
  console.log('=== Cleaning Up Old Backups ===');
  console.log(`Retention Period: ${backupService.retentionDays} days\n`);

  const result = await backupService.cleanupOldBackups();

  console.log('\n=== Cleanup Complete ===');
  console.log(`Deleted: ${result.deleted}`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Remaining: ${result.remaining}`);
}

/**
 * Restore from backup
 */
async function restoreBackup(backupId) {
  if (!backupId) {
    console.log('Error: Backup ID required');
    console.log('Usage: node scripts/backup.js restore <backup-id>');
    process.exit(1);
  }

  console.log('=== Restoring from Backup ===');
  console.log(`Backup ID: ${backupId}\n`);

  const backup = backupService.getBackup(backupId);
  if (!backup) {
    console.log(`Error: Backup "${backupId}" not found`);
    console.log('\nAvailable backups:');
    backupService.listBackups().forEach(b => console.log(`  - ${b.id}`));
    process.exit(1);
  }

  console.log(`Backup: ${backup.path}`);
  console.log(`Created: ${backup.timestamp.toLocaleString()}`);
  console.log(`Size: ${backupService.formatBytes(backup.size)}`);
  console.log('\nThis will overwrite the current games and submissions directories!');
  console.log('Type "yes" to confirm:');

  // Simple confirmation - in production use a more secure prompt
  const shouldRestore = process.argv.includes('--confirm');

  if (!shouldRestore) {
    console.log('\nRun with --confirm to proceed.');
    process.exit(0);
  }

  const result = await backupService.restoreFromBackup(backupId);

  if (result.success) {
    console.log('\n=== Restore Successful ===');
    console.log(`Restored at: ${result.restoredAt}`);
  } else {
    console.log('\n=== Restore Failed ===');
    console.log(`Error: ${result.error}`);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'list':
        listBackups();
        break;

      case 'status':
        showStatus();
        break;

      case 'cleanup':
        await cleanupBackups();
        break;

      case 'restore':
        await restoreBackup(process.argv[3]);
        break;

      case 'help' || '-h' || '--help':
        console.log(`
Best Version - Backup Runner

Usage: node scripts/backup.js <command> [options]

Commands:
  list              List all available backups
  status            Show backup statistics
  cleanup           Remove backups older than retention period (30 days)
  restore <id>      Restore from a specific backup
                    Add --confirm flag to proceed without confirmation prompt

Examples:
  node scripts/backup.js                           # Create new backup
  node scripts/backup.js list                      # List backups
  node scripts/backup.js status                    # Show status
  node scripts/backup.js cleanup                   # Cleanup old backups
  node scripts/backup.js restore backup-2024-01-01 # Restore backup

Scheduling:
  # Weekly backup (Sunday at 2 AM)
  0 2 * * 0 cd /path/to/app && node scripts/backup.js >> logs/backup.log 2>&1

  # Daily cleanup (3 AM)
  0 3 * * * cd /path/to/app && node scripts/backup.js cleanup >> logs/backup.log 2>&1
        `);
        break;

      default:
        await createBackup();
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
