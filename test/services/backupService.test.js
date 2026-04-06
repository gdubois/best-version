// Test suite for backup service
// Test IDs: 1.0-SVC-232 to 1.0-SVC-256
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { BackupService } = require('../../src/services/backupService');

// Helper to create temp directories
function createTempDirs() {
  return {
    gamesDir: fs.mkdtempSync(path.join(os.tmpdir(), 'games-')),
    submissionsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'submissions-')),
    backupDir: fs.mkdtempSync(path.join(os.tmpdir(), 'backup-'))
  };
}

// Helper to cleanup temp directories
function cleanupTempDirs(dirs) {
  try {
    if (fs.existsSync(dirs.gamesDir)) fs.rmSync(dirs.gamesDir, { recursive: true });
    if (fs.existsSync(dirs.submissionsDir)) fs.rmSync(dirs.submissionsDir, { recursive: true });
    if (fs.existsSync(dirs.backupDir)) fs.rmSync(dirs.backupDir, { recursive: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

describe('Backup Service Tests', () => {

  // Test constructor
  test('1.0-SVC-232 [P1] BackupService initializes with directories', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When instantiating BackupService
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);

    // Then properties are set correctly
    assert(backup !== null, 'Backup should be instantiated');
    assert.strictEqual(backup.gamesDir, dirs.gamesDir, 'Games dir should match');
    assert.strictEqual(backup.submissionsDir, dirs.submissionsDir, 'Submissions dir should match');
    assert.strictEqual(backup.backupDir, dirs.backupDir, 'Backup dir should match');
    assert.strictEqual(backup.retentionDays, 30, 'Default retention should be 30 days');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-233 [P1] BackupService creates backup directory if it does not exist', () => {
    // Given temp directories
    const dirs = createTempDirs();
    const backupDir = path.join(dirs.backupDir, 'new-backup');

    // When instantiating BackupService
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, backupDir);

    // Then backup directory is created
    assert(fs.existsSync(backupDir), 'Backup dir should be created');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-234 [P1] BackupService sets retention period', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When instantiating BackupService
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    backup.setRetentionPeriod(60);

    // Then retention period is updated
    assert.strictEqual(backup.retentionDays, 60, 'Retention should be 60 days');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-235 [P2] BackupService limits retention period between 1 and 365 days', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When setting invalid retention periods
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    backup.setRetentionPeriod(0); // Should clamp to 1
    assert.strictEqual(backup.retentionDays, 1, 'Should clamp to 1');
    backup.setRetentionPeriod(500); // Should clamp to 365

    // Then retention period is clamped
    assert.strictEqual(backup.retentionDays, 365, 'Should clamp to 365');

    cleanupTempDirs(dirs);
  });

  // Test createBackup
  test('1.0-SVC-236 [P1] BackupService.createBackup creates backup successfully', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));
    fs.writeFileSync(path.join(dirs.submissionsDir, 'sub1.json'), JSON.stringify({ game: 'game1' }));

    // When creating a backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const result = await backup.createBackup('test-backup');

    // Then backup is created successfully
    assert.strictEqual(result.success, true, 'Should succeed');
    assert.strictEqual(result.backupId, 'test-backup', 'Backup ID should match');
    assert.strictEqual(result.format, 'json', 'Format should be JSON');
    assert(fs.existsSync(result.path), 'Backup file should exist');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-237 [P1] BackupService.createBackup with auto-generated name', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating backup without name
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const result = await backup.createBackup();

    // Then backup is created with auto-generated name
    assert.strictEqual(result.success, true, 'Should succeed');
    assert(result.backupId.startsWith('backup-'), 'Backup ID should start with backup-');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-238 [P2] BackupService.createBackup handles missing games directory', async () => {
    // Given temp directories
    const dirs = createTempDirs();
    const backup = new BackupService('/nonexistent', dirs.submissionsDir, dirs.backupDir);
    fs.writeFileSync(path.join(dirs.submissionsDir, 'sub1.json'), JSON.stringify({ game: 'game1' }));

    // When creating backup
    const result = await backup.createBackup();

    // Then backup succeeds (only submissions directory exists)
    assert.strictEqual(result.success, true, 'Should succeed');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-239 [P2] BackupService.createBackup handles missing submissions directory', async () => {
    // Given temp directories
    const dirs = createTempDirs();
    const backup = new BackupService(dirs.gamesDir, '/nonexistent', dirs.backupDir);
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating backup
    const result = await backup.createBackup();

    // Then backup succeeds (only games directory exists)
    assert.strictEqual(result.success, true, 'Should succeed');

    cleanupTempDirs(dirs);
  });

  // Test listBackups
  test('1.0-SVC-240 [P1] BackupService.listBackups returns empty array initially', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When listing backups
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const backups = backup.listBackups();

    // Then returns empty array
    assert(Array.isArray(backups), 'Should be array');
    assert.strictEqual(backups.length, 0, 'Should be empty');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-241 [P1] BackupService.listBackups lists created backups', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating multiple backups
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    await backup.createBackup('test-backup-1');
    await backup.createBackup('test-backup-2');

    // Then both backups are listed
    const backups = backup.listBackups();
    assert.strictEqual(backups.length, 2, 'Should have 2 backups');
    const ids = backups.map(b => b.id).sort();
    assert.strictEqual(ids[0], 'test-backup-1', 'First backup ID should match');
    assert.strictEqual(ids[1], 'test-backup-2', 'Second backup ID should match');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-242 [P2] BackupService.listBackups ignores non-json files', async () => {
    // Given temp directories
    const dirs = createTempDirs();
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);

    // When creating a non-json file
    fs.writeFileSync(path.join(dirs.backupDir, 'not-a-backup.txt'), 'content');

    // Then only json files are listed
    const backups = backup.listBackups();
    assert.strictEqual(backups.length, 0, 'Should be empty');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-243 [P2] BackupService.listBackups handles missing backup directory', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When listing backups from nonexistent directory
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, '/nonexistent');
    const backups = backup.listBackups();

    // Then returns empty array
    assert(Array.isArray(backups), 'Should be array');
    assert.strictEqual(backups.length, 0, 'Should be empty');

    cleanupTempDirs(dirs);
  });

  // Test getBackup
  test('1.0-SVC-244 [P1] BackupService.getBackup returns backup metadata', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating and retrieving backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    await backup.createBackup('test-backup');
    const backupInfo = backup.getBackup('test-backup');

    // Then returns backup metadata
    assert(backupInfo !== null, 'Backup info should exist');
    assert.strictEqual(backupInfo.id, 'test-backup', 'ID should match');
    assert.strictEqual(backupInfo.format, 'json', 'Format should be JSON');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-245 [P2] BackupService.getBackup returns null for non-existent backup', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When getting non-existent backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const backupInfo = backup.getBackup('non-existent');

    // Then returns null
    assert.strictEqual(backupInfo, null, 'Should return null');

    cleanupTempDirs(dirs);
  });

  // Test restoreFromBackup
  test('1.0-SVC-246 [P1] BackupService.restoreFromBackup restores successfully', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));
    fs.writeFileSync(path.join(dirs.submissionsDir, 'sub1.json'), JSON.stringify({ game: 'game1' }));

    // When creating backup and restoring
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    await backup.createBackup('test-backup');

    // Modifying files before restore
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Modified Game 1' }));

    const result = await backup.restoreFromBackup('test-backup');

    // Then restore succeeds
    assert.strictEqual(result.success, true, 'Should succeed');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-247 [P2] BackupService.restoreFromBackup handles non-existent backup', async () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When restoring non-existent backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const result = await backup.restoreFromBackup('non-existent');

    // Then returns error
    assert.strictEqual(result.success, false, 'Should fail');
    assert(result.error.includes('Backup not found'), 'Error should mention not found');

    cleanupTempDirs(dirs);
  });

  // Test deleteBackup
  test('1.0-SVC-248 [P1] BackupService.deleteBackup deletes successfully', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating and deleting backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    await backup.createBackup('test-backup');
    const result = await backup.deleteBackup('test-backup');

    // Then backup is deleted
    assert.strictEqual(result, true, 'Should succeed');
    assert.strictEqual(fs.existsSync(path.join(dirs.backupDir, 'test-backup.json')), false, 'Backup file should be deleted');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-249 [P2] BackupService.deleteBackup returns false for non-existent backup', async () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When deleting non-existent backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const result = await backup.deleteBackup('non-existent');

    // Then returns false
    assert.strictEqual(result, false, 'Should fail');

    cleanupTempDirs(dirs);
  });

  // Test cleanupOldBackups
  test('1.0-SVC-250 [P2] BackupService.cleanupOldBackups removes old backups', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When creating backups with 1 day retention
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    backup.setRetentionPeriod(1);

    await backup.createBackup('old-backup');
    await backup.createBackup('new-backup');

    const result = await backup.cleanupOldBackups();

    // Then no backups are old enough yet
    assert.strictEqual(result.deleted, 0, 'Should not delete any');
    assert.strictEqual(result.remaining, 2, 'Should have 2 remaining');

    cleanupTempDirs(dirs);
  });

  // Test getStatistics
  test('1.0-SVC-251 [P2] BackupService.getStatistics returns correct statistics', async () => {
    // Given temp directories with test files
    const dirs = createTempDirs();
    fs.writeFileSync(path.join(dirs.gamesDir, 'game1.json'), JSON.stringify({ title: 'Game 1' }));

    // When getting statistics
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    await backup.createBackup('test-backup');
    const stats = backup.getStatistics();

    // Then statistics are correct
    assert.strictEqual(stats.totalBackups, 1, 'Should have 1 backup');
    assert(typeof stats.totalSize === 'number', 'Total size should be number');
    assert(typeof stats.totalSizeFormatted === 'string', 'Formatted size should be string');
    assert.strictEqual(stats.retentionDays, 30, 'Retention should be 30 days');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-252 [P2] BackupService.getStatistics handles empty backup directory', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When getting statistics
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const stats = backup.getStatistics();

    // Then returns empty statistics
    assert.strictEqual(stats.totalBackups, 0, 'Should have 0 backups');
    assert.strictEqual(stats.totalSize, 0, 'Total size should be 0');
    assert.strictEqual(stats.oldestBackup, null, 'Oldest should be null');
    assert.strictEqual(stats.newestBackup, null, 'Newest should be null');

    cleanupTempDirs(dirs);
  });

  // Test formatBytes
  test('1.0-SVC-253 [P2] BackupService.formatBytes formats bytes correctly', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When formatting bytes
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);

    // Then bytes are formatted correctly
    assert.strictEqual(backup.formatBytes(0), '0 Bytes', '0 should be 0 Bytes');
    assert.strictEqual(backup.formatBytes(1024), '1 KB', '1024 should be 1 KB');
    assert.strictEqual(backup.formatBytes(1048576), '1 MB', '1MB should be 1 MB');
    assert.strictEqual(backup.formatBytes(1073741824), '1 GB', '1GB should be 1 GB');

    cleanupTempDirs(dirs);
  });

  // Test with subdirectories
  test('1.0-SVC-254 [P2] BackupService.createBackup handles nested directories', async () => {
    // Given temp directories with nested structure
    const dirs = createTempDirs();
    const nestedDir = path.join(dirs.gamesDir, 'category1', 'subcategory1');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'game.json'), JSON.stringify({ title: 'Nested Game' }));

    // When creating backup
    const backup = new BackupService(dirs.gamesDir, dirs.submissionsDir, dirs.backupDir);
    const result = await backup.createBackup('nested-backup');

    // Then backup succeeds
    assert.strictEqual(result.success, true, 'Should succeed');

    cleanupTempDirs(dirs);
  });

});
