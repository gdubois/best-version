/**
 * Backup Scheduler - Cron-based automated backups
 * Story 6.5: Data Backup and Recovery
 *
 * This scheduler handles automated backup operations on a configurable schedule.
 * Primarily designed for use in production environments with system cron support.
 * For in-app scheduling (less reliable), see the scheduleBackup method.
 */

const { BackupService } = require('./backupService');
const path = require('path');

class BackupScheduler {
  constructor(gamesDir, submissionsDir, backupDir, logDir = path.join(__dirname, '../logs')) {
    this.backupService = new BackupService(gamesDir, submissionsDir, backupDir);
    this.logDir = logDir;

    // Ensure log directory exists
    if (!require('fs').existsSync(logDir)) {
      require('fs').mkdirSync(logDir, { recursive: true });
    }

    // Default schedule: weekly on Sunday at 2:00 AM
    this.schedule = {
      weekly: '0 2 * * 0' // Sunday at 2 AM
    };

    this.backupLog = null;
  }

  /**
   * Get log file path for a specific date
   */
  getLogFilePath(date = new Date()) {
    const timestamp = date.toISOString().split('T')[0];
    return path.join(this.logDir, `backup-${timestamp}.log`);
  }

  /**
   * Write log entry
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;

    console.log(logEntry.trim());

    // Also write to log file if available
    if (this.backupLog) {
      require('fs').appendFileSync(this.backupLog, logEntry);
    }
  }

  /**
   * Run weekly backup
   */
  async runWeeklyBackup() {
    this.log('Starting weekly backup...');

    try {
      const result = await this.backupService.createBackup('weekly');

      if (result.success) {
        this.log(`Weekly backup completed successfully: ${result.backupId}`, 'SUCCESS');
        this.log(`Backup location: ${result.path}`, 'INFO');
        return { success: true, backupId: result.backupId };
      } else {
        this.log(`Weekly backup failed: ${result.error}`, 'ERROR');
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`Weekly backup error: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  /**
   * Run cleanup of old backups
   */
  async runCleanup() {
    this.log('Starting backup cleanup...');

    try {
      const result = await this.backupService.cleanupOldBackups();

      this.log(`Cleanup completed: ${result.deleted} backups removed, ${result.remaining} remaining`, 'INFO');

      if (result.errors > 0) {
        this.log(`${result.errors} errors occurred during cleanup`, 'WARN');
      }

      return result;
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if backup is due based on schedule
   * Uses last backup timestamp from file
   */
  isBackupDue() {
    const lastBackupFile = path.join(this.backupService.backupDir, '.last-backup');
    let lastBackupTime = 0;

    try {
      if (require('fs').existsSync(lastBackupFile)) {
        lastBackupTime = parseInt(require('fs').readFileSync(lastBackupFile, 'utf8'), 10);
      }
    } catch (err) {
      // Ignore file read errors
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // If no previous backup or more than a week has passed
    return (now - lastBackupTime) >= oneWeek;
  }

  /**
   * Record backup completion time
   */
  recordBackupCompletion() {
    const lastBackupFile = path.join(this.backupService.backupDir, '.last-backup');
    require('fs').writeFileSync(lastBackupFile, Date.now().toString());
  }

  /**
   * In-memory scheduler (for testing/development)
   * Note: Not reliable for production use - use system cron instead
   */
  startInMemoryScheduler() {
    this.log('Starting in-memory backup scheduler (development mode)', 'WARN');
    this.log('Production use should use system cron jobs', 'INFO');

    // Schedule weekly backup
    const weeklySchedule = this._getNextRun(this.schedule.weekly);

    if (weeklySchedule) {
      const delay = weeklySchedule - Date.now();
      this.log(`Next scheduled backup in ${this._formatTime(delay)}`);

      setTimeout(async () => {
        await this.runWeeklyBackup();
        this.recordBackupCompletion();
      }, delay);
    }
  }

  /**
   * Get next run time for a cron expression (simple implementation)
   */
  _getNextRun(cronExpr) {
    // Parse simple cron: "minute hour day month dayOfWeek"
    const parts = cronExpr.split(' ');
    if (parts.length !== 5) return null;

    const [, , , , dayOfWeek] = parts;

    if (dayOfWeek !== '0') {
      // Only Sunday - this is a simplified check
      const now = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7;
      if (daysUntilSunday === 0) {
        // Already Sunday - check time
        const hoursUntilRun = 2 - now.getHours();
        if (hoursUntilRun > 0) {
          return Date.now() + hoursUntilRun * 60 * 60 * 1000;
        }
      } else {
        return Date.now() + daysUntilSunday * 24 * 60 * 60 * 1000 + (2 * 60 * 60 * 1000 - now.getTime() % (24 * 60 * 60 * 1000));
      }
    }

    return null;
  }

  /**
   * Format time in human readable format
   */
  _formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hours`;
    } else if (minutes > 0) {
      return `${minutes} minutes`;
    } else {
      return `${seconds} seconds`;
    }
  }

  /**
   * Generate cron job instructions
   */
  getCronInstructions() {
    return `
=== Backup Scheduler - Cron Job Instructions ===

Add these crontab entries to automate backups:

# Weekly backup (Sunday at 2:00 AM)
0 2 * * 0 cd ${process.cwd()} && node scripts/backup.js >> logs/backup.log 2>&1

# Daily cleanup of old backups (3:00 AM)
0 3 * * * cd ${process.cwd()} && node scripts/backup.js cleanup >> logs/backup.log 2>&1

Install cron jobs:
  crontab -e
  # Add the lines above and save

View cron jobs:
  crontab -l

View backup logs:
  tail -f logs/backup.log

Alternatively, use systemd timer:
  # /etc/systemd/system/best-version-backup.service
  [Unit]
  Description=Best Version Backup Service
  After=network.target

  [Service]
  Type=oneshot
  ExecStart=${process.cwd()}/node scripts/backup.js
  WorkingDirectory=${process.cwd()}
  StandardOutput=append:${process.cwd()}/logs/backup.log
  StandardError=append:${process.cwd()}/logs/backup.log

  # /etc/systemd/system/best-version-backup.timer
  [Unit]
  Description=Run Best Version backup weekly
  Requires=best-version-backup.service

  [Timer]
  OnCalendar=*-*-* 02:00:00
  Persistent=true
  RandomizedDelaySec=300

  [Install]
  WantedBy=timers.target

  # Enable the timer
  sudo systemctl enable best-version-backup.timer
  sudo systemctl start best-version-backup.timer
`;
  }
}

module.exports = { BackupScheduler };
