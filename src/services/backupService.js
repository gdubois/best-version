// Backup and restore service for data protection
// Story 6.5: Data Backup and Recovery

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const mkdirAsync = pathExists => {
  return new Promise((resolve, reject) => {
    fs.mkdir(pathExists, { recursive: true }, err => {
      if (err && err.code !== 'EEXIST') reject(err);
      else resolve();
    });
  });
};
const rmAsync = promisify(fs.rm);

class BackupService {
  constructor(gamesDir, submissionsDir, backupDir) {
    this.gamesDir = gamesDir;
    this.submissionsDir = submissionsDir;
    this.backupDir = backupDir;

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Backup retention period in days (30 days default)
    this.retentionDays = 30;
  }

  /**
   * Create a new backup of games and submissions
   * Uses JSON format for maximum compatibility
   * @param {string} backupName - Optional name for the backup
   * @returns {object} - Backup result with timestamp and path
   */
  async createBackup(backupName = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = backupName || `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, `${backupId}.json`);

      console.log(`Creating backup: ${backupId}`);

      // Create manifest
      const manifest = {
        metadata: {
          createdAt: new Date().toISOString(),
          gamesDir: this.gamesDir,
          submissionsDir: this.submissionsDir,
          version: '1.0'
        },
        backups: {}
      };

      // Read all files from games directory
      if (fs.existsSync(this.gamesDir)) {
        const gamesFiles = await this.getAllFiles(this.gamesDir, 'games');
        manifest.backups.games = gamesFiles;
      } else {
        console.warn(`Games directory not found: ${this.gamesDir}`);
      }

      // Read all files from submissions directory
      if (fs.existsSync(this.submissionsDir)) {
        const subsFiles = await this.getAllFiles(this.submissionsDir, 'submissions');
        manifest.backups.submissions = subsFiles;
      } else {
        console.warn(`Submissions directory not found: ${this.submissionsDir}`);
      }

      // Write backup file
      fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2));

      const size = (await statAsync(backupPath)).size;
      console.log(`Backup created: ${backupPath} (${this.formatBytes(size)})`);

      return {
        success: true,
        backupId,
        path: backupPath,
        timestamp: new Date().toISOString(),
        size,
        format: 'json'
      };
    } catch (error) {
      console.error('Backup creation failed:', error.message);

      // Clean up partial backup file if it exists
      try {
        const backupPath = path.join(this.backupDir, `${backupName || 'backup'}.json`);
        if (fs.existsSync(backupPath)) {
          await unlinkAsync(backupPath);
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recursively get all files from a directory
   */
  async getAllFiles(dir, baseDir) {
    const files = {};
    const entries = await readdirAsync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.relative(baseDir, fullPath);

      try {
        const stats = await statAsync(fullPath);
        if (stats.isDirectory()) {
          Object.assign(files, await this.getAllFiles(fullPath, baseDir));
        } else if (stats.isFile()) {
          const content = fs.readFileSync(fullPath, 'utf8');
          files[relativePath] = content;
        }
      } catch (err) {
        console.error(`Error reading ${fullPath}:`, err.message);
      }
    }

    return files;
  }

  /**
   * List all existing backups
   * @returns {Array} - List of backup metadata
   */
  listBackups() {
    const backups = [];

    if (!fs.existsSync(this.backupDir)) {
      return backups;
    }

    try {
      const files = fs.readdirSync(this.backupDir);

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const backupId = file.replace(/\.json$/, '');

        // Only process backup files
        if (!file.endsWith('.json')) {
          continue;
        }

        backups.push({
          id: backupId,
          path: filePath,
          timestamp: stats.mtime,
          size: stats.size,
          format: 'json',
          age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)) // days
        });
      }

      // Sort by timestamp, newest first
      backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error listing backups:', error.message);
    }

    return backups;
  }

  /**
   * Get a specific backup by ID
   * @param {string} backupId - The backup identifier
   * @returns {object|null} - Backup metadata or null
   */
  getBackup(backupId) {
    const backups = this.listBackups();
    return backups.find(b => b.id === backupId) || null;
  }

  /**
   * Restore from a backup
   * @param {string} backupId - The backup identifier
   * @returns {object} - Restoration result
   */
  async restoreFromBackup(backupId) {
    const backup = this.getBackup(backupId);

    if (!backup) {
      return {
        success: false,
        error: `Backup not found: ${backupId}`
      };
    }

    try {
      console.log(`Starting restore from: ${backup.path}`);

      // Read backup manifest
      const manifest = JSON.parse(fs.readFileSync(backup.path, 'utf8'));

      // Create temp restore directory
      const tempDir = path.join(this.backupDir, `restore-${Date.now()}`);

      // Restore games
      if (manifest.backups.games) {
        const gamesDir = path.join(tempDir, 'games');
        await this.writeBackedUpFiles(manifest.backups.games, gamesDir);

        // Remove existing games directory and restore
        if (fs.existsSync(this.gamesDir)) {
          await rmAsync(this.gamesDir, { recursive: true, force: true });
        }
        fs.renameSync(gamesDir, this.gamesDir);
      }

      // Restore submissions
      if (manifest.backups.submissions) {
        const subsDir = path.join(tempDir, 'submissions');
        await this.writeBackedUpFiles(manifest.backups.submissions, subsDir);

        // Remove existing submissions directory and restore
        if (fs.existsSync(this.submissionsDir)) {
          await rmAsync(this.submissionsDir, { recursive: true, force: true });
        }
        fs.renameSync(subsDir, this.submissionsDir);
      }

      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        await rmAsync(tempDir, { recursive: true, force: true });
      }

      console.log(`Restore completed successfully from ${backupId}`);

      return {
        success: true,
        backupId,
        restoredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Restore failed:', error.message);

      // Clean up temp directory on error
      try {
        const tempDir = path.join(this.backupDir, `restore-${Date.now()}`);
        if (fs.existsSync(tempDir)) {
          await rmAsync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write backed up files back to a directory
   */
  async writeBackedUpFiles(files, destDir) {
    // Create destination directory
    fs.mkdirSync(destDir, { recursive: true });

    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = path.join(destDir, relativePath);
      const fileDir = path.dirname(filePath);

      // Create directory structure
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  /**
   * Delete a backup
   * @param {string} backupId - The backup identifier
   * @returns {boolean} - Success status
   */
  async deleteBackup(backupId) {
    const backup = this.getBackup(backupId);

    if (!backup) {
      console.error(`Backup not found for deletion: ${backupId}`);
      return false;
    }

    try {
      await unlinkAsync(backup.path);
      console.log(`Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error.message);
      return false;
    }
  }

  /**
   * Clean up old backups based on retention policy
   * @returns {object} - Cleanup statistics
   */
  async cleanupOldBackups() {
    const backups = this.listBackups();
    const now = Date.now();
    const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

    let deleted = 0;
    let errors = 0;

    for (const backup of backups) {
      const age = now - backup.timestamp.getTime();

      if (age > retentionMs) {
        console.log(`Removing old backup: ${backup.id} (${backup.age} days old)`);
        const success = await this.deleteBackup(backup.id);
        if (success) {
          deleted++;
        } else {
          errors++;
        }
      }
    }

    return {
      deleted,
      errors,
      remaining: backups.filter(b => {
        const age = now - b.timestamp.getTime();
        return age <= retentionMs;
      }).length
    };
  }

  /**
   * Set retention period in days
   * @param {number} days - Retention period
   */
  setRetentionPeriod(days) {
    this.retentionDays = Math.max(1, Math.min(365, days));
    console.log(`Retention period set to ${this.retentionDays} days`);
  }

  /**
   * Get backup statistics
   * @returns {object} - Backup statistics
   */
  getStatistics() {
    const backups = this.listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return {
      totalBackups: backups.length,
      totalSize: totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].id : null,
      newestBackup: backups.length > 0 ? backups[0].id : null,
      backupsExpiring: backups.filter(b => {
        const age = now - b.timestamp.getTime();
        return age > retentionMs * 0.8 && age <= retentionMs;
      }).length,
      retentionDays: this.retentionDays
    };
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = { BackupService };
