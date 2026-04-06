// Test suite for DMCA service
// Test IDs: 1.0-SVC-125 to 1.0-SVC-157
// Priorities: P0 = critical security/data, P1 = core functionality, P2 = important features

const { expect } = require('expect');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { DMCAService } = require('../../src/services/dmcaService');

describe('DMCA Service Tests', () => {

  // Helper to create temp directories
  function createTempDirs() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmca-'));
    return {
      submissionsDir: path.join(tempDir, 'submissions'),
      gamesDir: path.join(tempDir, 'games'),
      dmcaFile: path.join(tempDir, 'dmca_requests.json'),
      notifiedUsersFile: path.join(tempDir, 'notified_users.json'),
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

  // Mock submission service
  function createMockSubmissionsService(submissions) {
    return {
      getAllSubmissions: () => submissions || [],
      saveSubmissions: (data) => {
        // Mock implementation
      }
    };
  }

  // Mock email service
  function createMockEmailService() {
    return {
      sendEmail: async () => ({ success: true })
    };
  }

  // Test constructor
  test('1.0-SVC-125 [P0] DMCAService initializes with default files', () => {
    // Given
    const dirs = createTempDirs();

    // When
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // Then
    expect(dmcaService).not.toBeNull();
    expect(fs.existsSync(dirs.dmcaFile)).toBe(true);
    expect(fs.existsSync(dirs.notifiedUsersFile)).toBe(true);

    cleanupTempDirs(dirs);
  });

  // Test getAllRequests
  test('1.0-SVC-126 [P0] DMCAService.getAllRequests returns empty array initially', () => {
    // Given
    const dirs = createTempDirs();

    // When
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const requests = dmcaService.getAllRequests();

    // Then
    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBe(0);

    cleanupTempDirs(dirs);
  });

  // Test createRequest
  test('1.0-SVC-127 [P0] DMCAService.createRequest creates new request', () => {
    // Given
    const dirs = createTempDirs();

    // When
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game',
      goodFaithBelief: true,
      accuracyStatement: true,
      underPenaltyPerjury: true,
      signature: 'John Doe'
    });

    // Then
    expect(request).not.toBeNull();
    expect(request.complainantName).toBe('John Doe');
    expect(request.status).toBe('pending');
    expect(request.id).toBeDefined();
expect(request.createdAt).toBeDefined();

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-128 [P0] DMCAService.createRequest has all required fields', () => {
    // Given
    const dirs = createTempDirs();

    // When
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // Then
    expect(request.goodFaithBelief).toBe(false);
    expect(request.accuracyStatement).toBe(false);
    expect(request.underPenaltyPerjury).toBe(false);
    expect(request.processedAt).toBe(null);
    expect(request.actionTaken).toBe(null);
    expect(request.contentRemoved).toBe(false);
    expect(request.notes).toBe('');

    cleanupTempDirs(dirs);
  });

  // Test updateRequest
  test('1.0-SVC-129 [P1] DMCAService.updateRequest updates request', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // When
    const updated = dmcaService.updateRequest(request.id, {
      status: 'processing',
      notes: 'Under review'
    });

    // Then
    expect(updated).not.toBeNull();
    expect(updated.status).toBe('processing');
    expect(updated.notes).toBe('Under review');
    expect(updated.updatedAt).toBeDefined();

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-130 [P1] DMCAService.updateRequest returns null for non-existent request', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const updated = dmcaService.updateRequest('non-existent-id', { status: 'processing' });

    // Then
    expect(updated).toBeNull();

    cleanupTempDirs(dirs);
  });

  // Test getRequestById
  test('1.0-SVC-131 [P1] DMCAService.getRequestById returns request', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // When
    const found = dmcaService.getRequestById(request.id);

    // Then
    expect(found).not.toBeNull();
    expect(found.id).toBe(request.id);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-132 [P1] DMCAService.getRequestById returns null for non-existent', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const found = dmcaService.getRequestById('non-existent-id');

    // Then
    expect(found).toBeNull();

    cleanupTempDirs(dirs);
  });

  // Test isRepeatOffender
  test('1.0-SVC-133 [P0] DMCAService.isRepeatOffender returns null for new user', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const result = dmcaService.isRepeatOffender('newuser@example.com');

    // Then
    expect(result).toBeNull();

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-134 [P0] DMCAService.isRepeatOffender identifies repeat offender', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // Add a notified user
    fs.writeFileSync(dirs.notifiedUsersFile, JSON.stringify([{
      email: 'repeat@example.com',
      notifiedAt: new Date().toISOString(),
      reason: 'DMCA notice',
      totalNotifications: 2,
      notifications: []
    }]));

    // When
    const result = dmcaService.isRepeatOffender('REPEAT@EXAMPLE.COM');

    // Then
    expect(result).not.toBeNull();
    expect(result.email).toBe('repeat@example.com');

    cleanupTempDirs(dirs);
  });

  // Test recordUserNotification
  test('1.0-SVC-135 [P0] DMCAService.recordUserNotification adds new user', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const result = dmcaService.recordUserNotification('newuser@example.com', 'DMCA takedown');

    // Then
    expect(result).not.toBeNull();
    expect(result.email).toBe('newuser@example.com');
    expect(result.totalNotifications).toBe(1);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-136 [P0] DMCAService.recordUserNotification increments count for existing user', () => {
    // Given
    const dirs = createTempDirs();

    // Pre-populate notified users
    fs.writeFileSync(dirs.notifiedUsersFile, JSON.stringify([{
      email: 'repeat@example.com',
      notifiedAt: new Date().toISOString(),
      reason: 'DMCA notice',
      totalNotifications: 2
    }]));

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const result = dmcaService.recordUserNotification('repeat@example.com', 'Another notice');

    // Then
    expect(result).not.toBeNull();
    expect(result.totalNotifications).toBe(3);

    cleanupTempDirs(dirs);
  });

  // Test processRequest
  test('1.0-SVC-137 [P1] DMCAService.processRequest handles no matching submission', async () => {
    // Timeout: 10000ms for async operations
    // Given
    const dirs = createTempDirs();

    const mockSubmissionsService = createMockSubmissionsService([]);
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      mockSubmissionsService,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Non-existent Game'
    });

    // When
    const result = await dmcaService.processRequest(request.id, 'admin@example.com');

    // Then
    expect(result.success).toBe(true);
    expect(result.results.contentRemoved).toBe(false);
    expect(result.results.reason).toBe('no_matching_submission');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-138 [P1] DMCAService.processRequest removes submission file', async () => {
    // Timeout: 10000ms for async operations
    // Given
    const dirs = createTempDirs();

    // Create a submission file
    const submissionFile = path.join(dirs.submissionsDir, 'test-submission.json');
    fs.mkdirSync(dirs.submissionsDir, { recursive: true });
    fs.writeFileSync(submissionFile, JSON.stringify({
      id: 'test-submission',
      title: 'Stolen Game',
      email: 'thief@example.com'
    }));

    const mockSubmissionsService = createMockSubmissionsService([
      { id: 'test-submission', title: 'Stolen Game', email: 'thief@example.com' }
    ]);

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      mockSubmissionsService,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // When
    const result = await dmcaService.processRequest(request.id, 'admin@example.com');

    // Then
    expect(result.success).toBe(true);
    expect(result.results.contentRemoved).toBe(true);
    expect(fs.existsSync(submissionFile)).toBe(false);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-139 [P1] DMCAService.processRequest handles invalid request ID', async () => {
    // Timeout: 10000ms for async operations
    // Given
    const dirs = createTempDirs();

    const mockSubmissionsService = createMockSubmissionsService([]);
    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      mockSubmissionsService,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const result = await dmcaService.processRequest('non-existent-id', 'admin@example.com');

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');

    cleanupTempDirs(dirs);
  });

  // Test getStatistics
  test('1.0-SVC-140 [P1] DMCAService.getStatistics returns correct counts', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // Create requests with different statuses
    dmcaService.createRequest({
      complainantName: 'John',
      complainantEmail: 'john@example.com',
      copyrightWork: 'Game 1',
      infringingUrl: 'https://example.com/1',
      infringingTitle: 'Game 1'
    });
    dmcaService.createRequest({
      complainantName: 'Jane',
      complainantEmail: 'jane@example.com',
      copyrightWork: 'Game 2',
      infringingUrl: 'https://example.com/2',
      infringingTitle: 'Game 2'
    });

    // Update one to completed with content removed
    dmcaService.updateRequest(dmcaService.getAllRequests()[0].id, {
      status: 'completed',
      actionTaken: 'content_removed',
      contentRemoved: true
    });

    // Update one to processing
    dmcaService.updateRequest(dmcaService.getAllRequests()[1].id, {
      status: 'processing'
    });

    // When
    const stats = dmcaService.getStatistics();

    // Then
    expect(stats.total).toBe(2);
    expect(stats.pending).toBe(0);
    expect(stats.processing).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.contentRemoved).toBe(1);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-141 [P1] DMCAService.getStatistics returns correct counts with error status', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // Create a completed request with contentRemoved: false
    dmcaService.createRequest({
      complainantName: 'John',
      complainantEmail: 'john@example.com',
      copyrightWork: 'Game 1',
      infringingUrl: 'https://example.com/1',
      infringingTitle: 'Game 1'
    });

    // Update to completed without removing content
    dmcaService.updateRequest(dmcaService.getAllRequests()[0].id, {
      status: 'completed',
      actionTaken: 'no_matching_submission',
      contentRemoved: false
    });

    // When
    const stats = dmcaService.getStatistics();

    // Then
    expect(stats.total).toBe(1);
    expect(stats.contentRemoved).toBe(0);

    cleanupTempDirs(dirs);
  });

  // Test getRepeatOffenders
  test('1.0-SVC-142 [P1] DMCAService.getRepeatOffenders returns list', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // Add some notified users
    fs.writeFileSync(dirs.notifiedUsersFile, JSON.stringify([
      { email: 'repeat1@example.com', totalNotifications: 3 },
      { email: 'repeat2@example.com', totalNotifications: 5 }
    ]));

    // When
    const offenders = dmcaService.getRepeatOffenders();

    // Then
    expect(Array.isArray(offenders)).toBe(true);
    expect(offenders.length).toBe(2);

    cleanupTempDirs(dirs);
  });

  // Test generateSubmitterNotificationEmail
  test('1.0-SVC-143 [P1] DMCAService.generateSubmitterNotificationEmail creates email content', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const email = dmcaService.generateSubmitterNotificationEmail(
      { title: 'Stolen Game', email: 'thief@example.com' },
      { id: 'test-id', createdAt: '2024-01-01' },
      false
    );

    // Then
    expect(typeof email).toBe('string');
    expect(email).toContain('Stolen Game');
    expect(email).toContain('test-id');
    expect(email).toContain('removed');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-144 [P0] DMCAService.generateSubmitterNotificationEmail includes repeat offender warning', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    // When
    const email = dmcaService.generateSubmitterNotificationEmail(
      { title: 'Stolen Game' },
      { id: 'test-id' },
      true // repeat offender
    );

    // Then
    expect(email).toContain('REPEAT OFFENDER NOTICE');
    expect(email).toContain('counter-notice');

    cleanupTempDirs(dirs);
  });

  // Test generateComplainantAcknowledgmentEmail
  test('1.0-SVC-145 [P1] DMCAService.generateComplainantAcknowledgmentEmail creates email content', () => {
    // Given
    const dirs = createTempDirs();

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      null,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = {
      id: 'test-id',
      complainantName: 'John Doe',
      createdAt: '2024-01-01',
      copyrightWork: 'My Game',
      infringingTitle: 'Stolen Game'
    };

    // When
    const email = dmcaService.generateComplainantAcknowledgmentEmail(request);

    // Then
    expect(typeof email).toBe('string');
    expect(email).toContain('John Doe');
    expect(email).toContain('test-id');
    expect(email).toContain('My Game');
    expect(email).toContain('Stolen Game');

    cleanupTempDirs(dirs);
  });

  // Test sendAcknowledgmentEmail
  test('1.0-SVC-146 [P1] DMCAService.sendAcknowledgmentEmail sends to pending request', async () => {
    // Timeout: 10000ms for async operations
    // Given
    const dirs = createTempDirs();

    let emailSent = false;
    const mockEmailService = {
      sendEmail: async () => {
        emailSent = true;
        return { success: true };
      }
    };

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      mockEmailService,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // When
    const result = await dmcaService.sendAcknowledgmentEmail(request.id);

    // Then
    expect(result.success).toBe(true);

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-147 [P1] DMCAService.sendAcknowledgmentEmail fails for non-pending request', async () => {
    // Timeout: 10000ms for async operations
    // Given
    const dirs = createTempDirs();

    const mockEmailService = {
      sendEmail: async () => ({ success: true })
    };

    const dmcaService = new DMCAService(
      dirs.submissionsDir,
      null,
      mockEmailService,
      dirs.gamesDir,
      {
        dmcaFile: dirs.dmcaFile,
        notifiedUsersFile: dirs.notifiedUsersFile
      }
    );

    const request = dmcaService.createRequest({
      complainantName: 'John Doe',
      complainantEmail: 'john@example.com',
      copyrightWork: 'My Game',
      infringingUrl: 'https://example.com/game',
      infringingTitle: 'Stolen Game'
    });

    // Change status to completed
    dmcaService.updateRequest(request.id, { status: 'completed' });

    // When
    const result = await dmcaService.sendAcknowledgmentEmail(request.id);

    // Then
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');

    cleanupTempDirs(dirs);
  });

});
