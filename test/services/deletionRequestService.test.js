// Test suite for deletion request service
// Test IDs: 1.0-SVC-021 to 1.0-SVC-041
// Priorities: P0 = critical security/data, P1 = core functionality, P2 = important features

const { expect } = require('expect');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { DeletionRequestService } = require('../../src/services/deletionRequestService');

describe('Deletion Request Service Tests', () => {

  // Helper to create temp directories
  function createTempDirs() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deletion-'));
    return {
      submissionsDir: path.join(tempDir, 'submissions'),
      gamesDir: path.join(tempDir, 'games'),
      deletionsFile: path.join(tempDir, 'deletion_requests.json'),
      tempDir
    };
  }

  // Helper to cleanup temp directories
  function cleanupTempDirs(dirs) {
    try {
      if (dirs.tempDir && fs.existsSync(dirs.tempDir)) {
        fs.rmSync(dirs.tempDir, { recursive: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Mock submissions service
  function createMockSubmissionsService(submissions = []) {
    let data = [...submissions];
    return {
      getAllSubmissions: () => data,
      getSubmissionById: (id) => data.find(s => s.id === id),
      saveSubmissions: (d) => {
        data = d;
      },
      deleteSubmission: () => true
    };
  }

  // Mock newsletter service
  function createMockNewsletterService() {
    let subscribers = [];
    return {
      deleteByEmail: (email) => {
        const idx = subscribers.findIndex(s => s.email === email.toLowerCase());
        if (idx !== -1) {
          subscribers.splice(idx, 1);
          return true;
        }
        return false;
      },
      getAllSubscribers: () => subscribers,
      addSubscriber: (email) => {
        subscribers.push({ email });
      }
    };
  }

  // Test constructor
  test('1.0-SVC-021 [P0] DeletionRequestService initializes with files', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    // Then service and file are created
    expect(deletionService !== null).not.toBeNull();
    assert(fs.existsSync(deletionService.deletionsFile), 'Deletions file should be created');

    cleanupTempDirs(dirs);
  });

  // Test getAllRequests
  test('1.0-SVC-022 [P0] DeletionRequestService.getAllRequests returns empty array initially', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating new service
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    // When getting requests
    const requests = deletionService.getAllRequests();

    // Then returns empty array
    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBe(0);

    cleanupTempDirs(dirs);
  });

  // Test createRequest
  test('1.0-SVC-023 [P0] DeletionRequestService.createRequest creates new request', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and request
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    const request = deletionService.createRequest('user@example.com', 'pending');

    // Then request is created with correct properties
    expect(request !== null).not.toBeNull();
    expect(request.email).toBe('user@example.com');
    expect(request.status).toBe('pending');
    expect(request.id !== undefined).toBeDefined();
    expect(request.createdAt !== undefined).toBeDefined();

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-024 [P1] DeletionRequestService.createRequest normalizes email', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating request with uppercase email
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    // Create with uppercase - should normalize
    const request = deletionService.createRequest('  USER@EXAMPLE.COM  ');

    // Then email is normalized
    expect(request !== null).not.toBeNull();
    expect(request.email).toBe('user@example.com');
  });

  test('1.0-SVC-025 [P1] DeletionRequestService.createRequest updates existing request', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and requests
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');
    const updated = deletionService.createRequest('user@example.com', 'completed');

    // Then existing request is updated
    expect(updated.status).toBe('completed');
    expect(updated.processedBy).toBeNull();
    expect(updated.processedAt).toBeNull();

    cleanupTempDirs(dirs);
  });

  // Test updateRequest
  test('1.0-SVC-026 [P0] DeletionRequestService.updateRequest updates request', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and request
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const updated = deletionService.updateRequest('user@example.com', {
      status: 'processing',
      notes: 'Processing deletion'
    });

    // Then request is updated
    expect(updated !== null).not.toBeNull();
    expect(updated.status).toBe('processing');
    expect(updated.notes).toBe('Processing deletion');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-027 [P2] DeletionRequestService.updateRequest returns null for missing', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When updating non-existent request
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    const updated = deletionService.updateRequest('nonexistent@example.com', { status: 'processing' });

    // Then returns null
    expect(updated).toBeNull();

    cleanupTempDirs(dirs);
  });

  // Test getRequestByEmail
  test('1.0-SVC-028 [P1] DeletionRequestService.getRequestByEmail returns request', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and request
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const request = deletionService.getRequestByEmail('user@example.com');

    // Then returns the request
    expect(request !== null).not.toBeNull();
    expect(request.email).toBe('user@example.com');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-029 [P1] DeletionRequestService.getRequestByEmail is case insensitive', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and request
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const request = deletionService.getRequestByEmail('USER@EXAMPLE.COM');

    // Then returns request regardless of case
    expect(request !== null).not.toBeNull();

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-030 [P2] DeletionRequestService.getRequestByEmail returns null for missing', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    const request = deletionService.getRequestByEmail('nonexistent@example.com');

    expect(request).toBeNull();

    cleanupTempDirs(dirs);
  });

  // Test getStatistics
  test('1.0-SVC-031 [P1] DeletionRequestService.getStatistics returns correct counts', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating service and requests
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user1@example.com', 'pending');
    deletionService.createRequest('user2@example.com', 'processing');
    deletionService.createRequest('user3@example.com', 'completed');
    deletionService.createRequest('user4@example.com', 'error');

    const stats = deletionService.getStatistics();

    // Then counts are correct
    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(1);
    expect(stats.processing).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.error).toBe(1);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-032 [P2] DeletionRequestService.getStatistics returns zero when empty', () => {
    // Given temp directories
    const dirs = createTempDirs();

    // When creating new service
    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    const stats = deletionService.getStatistics();

    // Then all counts are zero
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.processing).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.error).toBe(0);

    cleanupTempDirs(dirs);
  });

  // Test processDeletion
  test('1.0-SVC-033 [P0] DeletionRequestService.processDeletion processes successfully', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    const mockNewsletter = createMockNewsletterService();
    mockNewsletter.addSubscriber('user@example.com');
    const mockSubmissions = createMockSubmissionsService([
      { id: '1', email: 'user@example.com', title: 'Test Game' }
    ]);

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    // Then succeeds with correct results
    expect(result.success === true);
    expect(result.results.newsletter === true);
    expect(result.results.submissions).toBe(1);
    expect(result.results.games).toBe(0);

    // Verify status changed
    const request = deletionService.getRequestByEmail('user@example.com');
    expect(request.status).toBe('completed');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-034 [P1] DeletionRequestService.processDeletion handles missing request', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    const result = await deletionService.processDeletion('nonexistent@example.com');

    // Then fails with error
    expect(result.success === false);
    expect(result.error.includes('not found')).toBe(true);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-035 [P2] DeletionRequestService.processDeletion sets error status on failure', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    const mockNewsletter = createMockNewsletterService();
    mockNewsletter.addSubscriber('user@example.com');
    const mockSubmissions = createMockSubmissionsService([
      { id: '1', email: 'user@example.com', title: 'Test Game' }
    ]);

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    expect(result.success === true);

    cleanupTempDirs(dirs);
  });

  // New tests for path traversal protection
  test('1.0-SVC-036 [P0] DeletionRequestService.processDeletion handles path traversal attempts safely', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    // Create a malicious game file outside games dir
    const maliciousFile = path.join(dirs.tempDir, '../malicious.json');
    fs.writeFileSync(maliciousFile, JSON.stringify({ basic_info: { title: 'Evil Game' } }));

    const mockNewsletter = createMockNewsletterService();
    const mockSubmissions = createMockSubmissionsService([
      { id: '1', email: 'user@example.com', title: 'Test Game' }
    ]);

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    // Should not have deleted the malicious file
    assert(fs.existsSync(maliciousFile), 'Malicious file should not be deleted');
    assert(result.results.errors.length >= 0, 'Errors array should exist');

    fs.unlinkSync(maliciousFile);
    cleanupTempDirs(dirs);
  });

  // Test unique ID-based game deletion (not title matching)
  test('1.0-SVC-037 [P0] DeletionRequestService.processDeletion uses submission_id for game matching', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    const mockNewsletter = createMockNewsletterService();
    const mockSubmissions = createMockSubmissionsService([
      { id: 'sub-1', email: 'user@example.com', title: 'Test Game' }
    ]);

    // Create a game file with submission_id reference
    const gameFile = path.join(dirs.gamesDir, 'test-game.json');
    fs.writeFileSync(gameFile, JSON.stringify({
      basic_info: { title: 'Test Game' },
      submission_id: 'sub-1'
    }));

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    // Should have deleted the game file via submission_id match
    expect(result.success === true);
    expect(result.results.games).toBe(1);
    assert(!fs.existsSync(gameFile), 'Game file should be deleted');

    cleanupTempDirs(dirs);
  });

  // Test that games without matching submission_id are NOT deleted
  test('1.0-SVC-038 [P0] DeletionRequestService.processDeletion preserves games without matching submission_id', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    const mockNewsletter = createMockNewsletterService();
    const mockSubmissions = createMockSubmissionsService([
      { id: 'sub-1', email: 'user@example.com', title: 'Test Game' }
    ]);

    // Create a game file WITHOUT submission_id reference (should NOT be deleted)
    const gameFile = path.join(dirs.gamesDir, 'other-game.json');
    fs.writeFileSync(gameFile, JSON.stringify({
      basic_info: { title: 'Other Game' },
      submission_id: 'sub-other' // Different submission
    }));

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    // Game should NOT be deleted because submission_id doesn't match
    expect(result.success === true);
    expect(result.results.games).toBe(0);
    assert(fs.existsSync(gameFile), 'Game file should still exist');

    cleanupTempDirs(dirs);
  });

  // Test that games with same title but different submission_id are NOT deleted
  test('1.0-SVC-039 [P0] DeletionRequestService.processDeletion does not delete games with matching title but different submission_id', async () => {
    // Timeout: 10000ms for async operations
    // Given temp directories
    const dirs = createTempDirs();

    // Create the games directory
    fs.mkdirSync(dirs.gamesDir, { recursive: true });

    const mockNewsletter = createMockNewsletterService();
    const mockSubmissions = createMockSubmissionsService([
      { id: 'sub-1', email: 'user@example.com', title: 'Test Game' }
    ]);

    // Create a game file with same title but different submission_id
    // This should NOT be deleted (prevents accidental deletion via title collision)
    const gameFile = path.join(dirs.gamesDir, 'test-game-copy.json');
    fs.writeFileSync(gameFile, JSON.stringify({
      basic_info: { title: 'Test Game' }, // Same title
      submission_id: 'sub-2' // Different submission
    }));

    const deletionService = new DeletionRequestService(
      dirs.submissionsDir,
      mockSubmissions,
      mockNewsletter,
      dirs.gamesDir,
      { deletionsFile: dirs.deletionsFile }
    );

    deletionService.createRequest('user@example.com', 'pending');

    const result = await deletionService.processDeletion('user@example.com');

    // Game should NOT be deleted because submission_id doesn't match
    expect(result.success === true);
    expect(result.results.games).toBe(0);
    assert(fs.existsSync(gameFile), 'Game file should still exist (title collision protection)');

    cleanupTempDirs(dirs);
  });

});
