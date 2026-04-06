/**
 * Backup Admin Service
 * Story 6.5: Data Backup and Recovery
 *
 * Provides admin API endpoints for backup operations
 */

const { BackupService } = require('./backupService');
const path = require('path');

class BackupAdminService {
  constructor(gamesDir, submissionsDir, backupDir) {
    this.backupService = new BackupService(gamesDir, submissionsDir, backupDir);
  }

  /**
   * Create a new backup
   */
  async createBackup(backupName = null) {
    const result = await this.backupService.createBackup(backupName);

    if (result.success) {
      return {
        success: true,
        message: `Backup created: ${result.backupId}`,
        data: result
      };
    }

    return {
      success: false,
      message: `Backup failed: ${result.error}`,
      error: result.error
    };
  }

  /**
   * List all backups
   */
  listBackups() {
    const backups = this.backupService.listBackups();

    return {
      success: true,
      data: backups,
      count: backups.length
    };
  }

  /**
   * Get backup by ID
   */
  getBackup(backupId) {
    const backup = this.backupService.getBackup(backupId);

    if (backup) {
      return {
        success: true,
        data: backup
      };
    }

    return {
      success: false,
      message: `Backup not found: ${backupId}`
    };
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId) {
    const result = await this.backupService.restoreFromBackup(backupId);

    if (result.success) {
      return {
        success: true,
        message: `Restored from backup: ${backupId}`,
        data: result
      };
    }

    return {
      success: false,
      message: `Restore failed: ${result.error}`,
      error: result.error
    };
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId) {
    const success = await this.backupService.deleteBackup(backupId);

    if (success) {
      return {
        success: true,
        message: `Backup deleted: ${backupId}`
      };
    }

    return {
      success: false,
      message: `Failed to delete backup: ${backupId}`
    };
  }

  /**
   * Cleanup old backups
   */
  async cleanupOldBackups() {
    const result = await this.backupService.cleanupOldBackups();

    return {
      success: true,
      message: `Cleanup completed`,
      data: result
    };
  }

  /**
   * Get backup statistics
   */
  getStatistics() {
    const stats = this.backupService.getStatistics();

    return {
      success: true,
      data: stats
    };
  }
}

module.exports = { BackupAdminService };
