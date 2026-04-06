// Test suite for admin dashboard service
// Test IDs: 1.0-SVC-062 to 1.0-SVC-097
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const { AdminDashboardService } = require('../../src/services/adminDashboardService');

// Helper to create mock services
function createMockSubmissionService(submissions = []) {
  return {
    getAllSubmissions: () => submissions,
    getSubmissionById: (id) => submissions.find(s => s.id === id) || null,
    updateSubmissionStatus: async (id, status, data) => {
      const sub = submissions.find(s => s.id === id);
      if (sub) {
        sub.status = status;
        Object.assign(sub, data);
        return sub;
      }
      return null;
    },
    getApprovedSubmissions: () => submissions.filter(s => s.status === 'approved'),
    getRejectedSubmissions: () => submissions.filter(s => s.status === 'rejected'),
    deleteSubmission: (id) => {
      const idx = submissions.findIndex(s => s.id === id);
      if (idx !== -1) {
        submissions.splice(idx, 1);
        return true;
      }
      return false;
    },
    archiveSubmission: (id) => {
      const sub = submissions.find(s => s.id === id);
      if (sub) {
        sub.archived = true;
        return true;
      }
      return false;
    },
    getStatistics: () => ({
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    })
  };
}

function createMockGameLoader(games = []) {
  return {
    getAllGamesArray: () => games,
    getGameBySlug: (slug) => games.find(g => g.basic_info?.url_slug === slug) || null
  };
}

function createMockGameStorage() {
  const games = {};
  return {
    updateGame: (slug, data) => {
      games[slug] = data;
      return { basic_info: { url_slug: slug } };
    },
    deleteGame: (slug) => {
      if (games[slug]) {
        delete games[slug];
        return true;
      }
      return false;
    }
  };
}

describe('Admin Dashboard Service Tests', () => {

  // Test constructor
  test('1.0-SVC-062 [P1] AdminDashboardService initializes with all dependencies', () => {
    // Given
    const submissionService = createMockSubmissionService();
    const gameLoader = createMockGameLoader();
    const gameStorage = createMockGameStorage();

    // When
    const dashboard = new AdminDashboardService(
      submissionService,
      gameLoader,
      gameStorage,
      null
    );

    // Then
    assert(dashboard !== null, 'Dashboard should be instantiated');
    assert.strictEqual(dashboard.submissionService, submissionService, 'Submission service should match');
    assert.strictEqual(dashboard.gameLoader, gameLoader, 'Game loader should match');
    assert.strictEqual(dashboard.gameStorage, gameStorage, 'Game storage should match');
  });

  // Test getPendingSubmissions
  test('1.0-SVC-063 [P1] AdminDashboardService.getPendingSubmissions returns pending only', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending', submittedAt: '2024-01-01' },
      { id: '2', status: 'approved', submittedAt: '2024-01-02' },
      { id: '3', status: 'pending', submittedAt: '2024-01-03' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const pending = dashboard.getPendingSubmissions();

    // Then
    assert.strictEqual(pending.length, 2, 'Should have 2 pending');
    assert(pending.every(s => s.status === 'pending'), 'All should be pending');
  });

  test('1.0-SVC-064 [P1] AdminDashboardService.getPendingSubmissions sorts by newest first', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending', submittedAt: '2024-01-01' },
      { id: '2', status: 'pending', submittedAt: '2024-01-03' },
      { id: '3', status: 'pending', submittedAt: '2024-01-02' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const pending = dashboard.getPendingSubmissions();

    // Then
    assert.strictEqual(pending[0].id, '2', 'Newest should be first');
    assert.strictEqual(pending[1].id, '3', 'Second newest should be second');
    assert.strictEqual(pending[2].id, '1', 'Oldest should be last');
  });

  test('1.0-SVC-065 [P2] AdminDashboardService.getPendingSubmissions filters by date range', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending', submittedAt: '2024-01-01' },
      { id: '2', status: 'pending', submittedAt: '2024-01-15' },
      { id: '3', status: 'pending', submittedAt: '2024-02-01' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const pending = dashboard.getPendingSubmissions({
      startDate: '2024-01-10',
      endDate: '2024-01-31'
    });

    // Then
    assert.strictEqual(pending.length, 1, 'Should have 1 pending');
    assert.strictEqual(pending[0].id, '2', 'Should be the correct one');
  });

  // Test getDashboardStatistics
  test('1.0-SVC-066 [P1] AdminDashboardService.getDashboardStatistics returns stats', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' },
      { id: '2', status: 'approved' },
      { id: '3', status: 'rejected' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const stats = dashboard.getDashboardStatistics();

    // Then
    assert.strictEqual(stats.total, 3, 'Total should be 3');
    assert.strictEqual(stats.pendingCount, 1, 'Pending should be 1');
    assert.strictEqual(stats.approvedCount, 1, 'Approved should be 1');
    assert.strictEqual(stats.rejectedCount, 1, 'Rejected should be 1');
  });

  // Test getSubmissionById
  test('1.0-SVC-067 [P1] AdminDashboardService.getSubmissionById returns submission', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const submission = dashboard.getSubmissionById('1');

    // Then
    assert(submission !== null, 'Submission should exist');
    assert.strictEqual(submission.id, '1', 'ID should match');
  });

  test('1.0-SVC-068 [P1] AdminDashboardService.getSubmissionById returns null for missing', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const submission = dashboard.getSubmissionById('non-existent');

    // Then
    assert(submission === null, 'Should return null');
  });

  // Test getApprovedSubmissions
  test('1.0-SVC-069 [P1] AdminDashboardService.getApprovedSubmissions returns approved sorted', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'approved', approvedAt: '2024-01-01' },
      { id: '2', status: 'approved', approvedAt: '2024-01-03' },
      { id: '3', status: 'approved', approvedAt: '2024-01-02' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const approved = dashboard.getApprovedSubmissions();

    // Then
    assert.strictEqual(approved[0].id, '2', 'Newest should be first');
    assert.strictEqual(approved[1].id, '3', 'Second newest should be second');
    assert.strictEqual(approved[2].id, '1', 'Oldest should be last');
  });

  // Test getRejectedSubmissions
  test('1.0-SVC-070 [P1] AdminDashboardService.getRejectedSubmissions returns rejected sorted', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'rejected', reviewedAt: '2024-01-01' },
      { id: '2', status: 'rejected', reviewedAt: '2024-01-03' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const rejected = dashboard.getRejectedSubmissions();

    // Then
    assert.strictEqual(rejected[0].id, '2', 'Newest should be first');
    assert.strictEqual(rejected[1].id, '1', 'Oldest should be second');
  });

  // Test getRejectionReason
  test('1.0-SVC-071 [P1] AdminDashboardService.getRejectionReason returns reason', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'rejected', rejectionReason: 'Incomplete submission' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const reason = dashboard.getRejectionReason('1');

    // Then
    assert.strictEqual(reason, 'Incomplete submission', 'Reason should match');
  });

  test('1.0-SVC-072 [P1] AdminDashboardService.getRejectionReason returns null when none', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'approved' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const reason = dashboard.getRejectionReason('1');

    // Then
    assert.strictEqual(reason, null, 'Should return null');
  });

  // Test approveSubmission
  test('1.0-SVC-073 [P1] AdminDashboardService.approveSubmission approves submission', async () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = await dashboard.approveSubmission('1', 'admin@example.com');

    // Then
    assert(result !== null, 'Result should exist');
    assert.strictEqual(result.status, 'approved', 'Status should be approved');
    assert.strictEqual(result.reviewedBy, 'admin@example.com', 'Reviewer should match');
  });

  test('1.0-SVC-074 [P1] AdminDashboardService.approveSubmission returns null for missing', async () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = await dashboard.approveSubmission('non-existent', 'admin@example.com');

    // Then
    assert(result === null, 'Should return null');
  });

  // Test rejectSubmission
  test('1.0-SVC-075 [P1] AdminDashboardService.rejectSubmission rejects submission', async () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = await dashboard.rejectSubmission('1', 'Incomplete submission', 'admin@example.com');

    // Then
    assert(result !== null, 'Result should exist');
    assert.strictEqual(result.status, 'rejected', 'Status should be rejected');
    assert.strictEqual(result.rejectionReason, 'Incomplete submission', 'Reason should match');
    assert.strictEqual(result.reviewedBy, 'admin@example.com', 'Reviewer should match');
  });

  // Test deleteSubmission
  test('1.0-SVC-076 [P1] AdminDashboardService.deleteSubmission deletes successfully', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' },
      { id: '2', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = dashboard.deleteSubmission('1');

    // Then
    assert(result === true, 'Should succeed');
    assert.strictEqual(submissionService.getAllSubmissions().length, 1, 'Should have 1 remaining');
  });

  test('1.0-SVC-077 [P1] AdminDashboardService.deleteSubmission returns false for missing', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'pending' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = dashboard.deleteSubmission('non-existent');

    // Then
    assert(result === false, 'Should fail');
  });

  // Test archiveSubmission
  test('1.0-SVC-078 [P1] AdminDashboardService.archiveSubmission archives submission', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', status: 'rejected' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const result = dashboard.archiveSubmission('1');

    // Then
    assert(result === true, 'Should succeed');
    assert.strictEqual(submissionService.getAllSubmissions()[0].archived, true, 'Should be archived');
  });

  // Test getAllGames
  test('1.0-SVC-079 [P1] AdminDashboardService.getAllGames returns games', () => {
    // Given
    const gameLoader = createMockGameLoader([
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } }
    ]);

    const dashboard = new AdminDashboardService(null, gameLoader, null, null);

    // When
    const games = dashboard.getAllGames();

    // Then
    assert.strictEqual(games.length, 2, 'Should have 2 games');
    assert.strictEqual(games[0].basic_info.title, 'Game 1', 'First game title should match');
  });

  // Test getGame
  test('1.0-SVC-080 [P1] AdminDashboardService.getGame returns game by slug', () => {
    // Given
    const gameLoader = createMockGameLoader([
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } }
    ]);

    const dashboard = new AdminDashboardService(null, gameLoader, null, null);

    // When
    const game = dashboard.getGame('game-1');

    // Then
    assert(game !== null, 'Game should exist');
    assert.strictEqual(game.basic_info.title, 'Game 1', 'Title should match');
  });

  test('1.0-SVC-081 [P1] AdminDashboardService.getGame returns null for missing slug', () => {
    // Given
    const gameLoader = createMockGameLoader([
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } }
    ]);

    const dashboard = new AdminDashboardService(null, gameLoader, null, null);

    // When
    const game = dashboard.getGame('non-existent');

    // Then
    assert(game === null, 'Should return null');
  });

  // Test updateGame
  test('1.0-SVC-082 [P1] AdminDashboardService.updateGame updates game', () => {
    // Given
    const gameStorage = createMockGameStorage();
    const dashboard = new AdminDashboardService(null, null, gameStorage, null);

    // When
    const result = dashboard.updateGame({
      basic_info: { url_slug: 'game-1' },
      metadata: { updated: true }
    });

    // Then
    assert(result === true, 'Should succeed');
  });

  test('1.0-SVC-083 [P1] AdminDashboardService.updateGame returns null when no slug', () => {
    // Given
    const gameStorage = createMockGameStorage();
    const dashboard = new AdminDashboardService(null, null, gameStorage, null);

    // When
    const result = dashboard.updateGame({
      basic_info: { title: 'Game' } // No url_slug
    });

    // Then
    assert(result === null, 'Should return null');
  });

  // Test deleteGame
  test('1.0-SVC-084 [P1] AdminDashboardService.deleteGame deletes successfully', () => {
    // Given
    const gameStorage = createMockGameStorage();
    const dashboard = new AdminDashboardService(null, null, gameStorage, null);

    // First add a game
    gameStorage.updateGame('game-1', { basic_info: { url_slug: 'game-1' } });

    // When
    const result = dashboard.deleteGame('game-1');

    // Then
    assert(result === true, 'Should succeed');
  });

  test('1.0-SVC-085 [P1] AdminDashboardService.deleteGame returns false for missing', () => {
    // Given
    const gameStorage = createMockGameStorage();
    const dashboard = new AdminDashboardService(null, null, gameStorage, null);

    // When
    const result = dashboard.deleteGame('non-existent');

    // Then
    assert(result === false, 'Should fail');
  });

  // Test getGameSubmissionHistory
  test('1.0-SVC-086 [P1] AdminDashboardService.getGameSubmissionHistory returns matching submissions', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', title: 'Pokemon Game', alternativeNames: ['Pokemon Red'], submittedAt: '2024-01-01' },
      { id: '2', title: 'Another Game', submittedAt: '2024-01-02' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const history = dashboard.getGameSubmissionHistory('pokemon-game');

    // Then
    assert.strictEqual(history.length, 1, 'Should have 1 match');
    assert.strictEqual(history[0].id, '1', 'ID should match');
  });

  test('1.0-SVC-087 [P1] AdminDashboardService.getGameSubmissionHistory sorts by newest first', () => {
    // Given
    const submissionService = createMockSubmissionService([
      { id: '1', title: 'Pokemon Game', submittedAt: '2024-01-01' },
      { id: '2', title: 'Pokemon Game', submittedAt: '2024-01-03' },
      { id: '3', title: 'Pokemon Game', submittedAt: '2024-01-02' }
    ]);

    const dashboard = new AdminDashboardService(submissionService, null, null, null);

    // When
    const history = dashboard.getGameSubmissionHistory('pokemon-game');

    // Then
    assert.strictEqual(history[0].id, '2', 'Newest should be first');
    assert.strictEqual(history[1].id, '3', 'Second newest should be second');
    assert.strictEqual(history[2].id, '1', 'Oldest should be last');
  });

});
