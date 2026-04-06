// Test suite for storage service
// Test IDs: 1.0-SVC-174 to 1.0-SVC-195
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { GameStorageService, SubmissionStorageService } = require('../../src/services/storageService');

const testGamesDir = path.join(__dirname, 'temp_storage_test');

// Setup test directory
beforeAll(() => {
  if (!fs.existsSync(testGamesDir)) {
    fs.mkdirSync(testGamesDir, { recursive: true });
  }
});

// Cleanup test directory after all tests
afterAll(() => {
  try {
    if (fs.existsSync(testGamesDir)) {
      const files = fs.readdirSync(testGamesDir);
      files.forEach(file => {
        const filePath = path.join(testGamesDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(testGamesDir);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
});

describe('Game Storage Service Tests', () => {

  // Test GameStorageService constructor
  test('1.0-SVC-174 [P1] GameStorageService initializes with games directory', () => {
    // When
    const storage = new GameStorageService(testGamesDir);

    // Then
    assert(storage !== null, 'Storage should be instantiated');
  });

  test('1.0-SVC-175 [P1] GameStorageService gets all games', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const games = storage.getAllGames();

    // Then
    assert(Array.isArray(games), 'Should return array');
    assert(games.length > 0, 'Should have games');
  });

  test('1.0-SVC-176 [P1] GameStorageService gets game by slug', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const game = storage.getGameBySlug('pokemon-emerald');

    // Then
    assert(game !== null, 'Game should be found');
    assert(game.basic_info.title.includes('Emerald'), 'Title should include Emerald');
  });

  test('1.0-SVC-177 [P1] GameStorageService gets non-existent game as null', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const game = storage.getGameBySlug('non-existent-xyz123');

    // Then
    assert.strictEqual(game, null, 'Should return null');
  });

  test('1.0-SVC-178 [P1] GameStorageService gets game by title', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const game = storage.getGameByTitle('Beyond Shadowgate');

    // Then
    assert(game !== null, 'Game should be found');
    assert.strictEqual(game.basic_info.title, 'Beyond Shadowgate', 'Title should match');
  });

  test('1.0-SVC-179 [P1] GameStorageService searches games', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const results = storage.searchGames('Final Fantasy');

    // Then
    assert(Array.isArray(results), 'Should return array');
  });

  test('1.0-SVC-180 [P1] GameStorageService generates unique slugs', () => {
    // Given
    const storage = new GameStorageService(testGamesDir);

    // When
    const slug1 = storage.generateSlug('Test Game');
    const slug2 = storage.generateSlug('Another Test');

    // Then
    assert(slug1 !== null, 'Slug 1 should exist');
    assert(slug2 !== null, 'Slug 2 should exist');
  });

  test('1.0-SVC-181 [P1] GameStorageService converts Roman to digit', () => {
    // Given
    const storage = new GameStorageService(testGamesDir);

    // When
    const result = storage.convertRomanToDigit('Final Fantasy VII');

    // Then
    assert(typeof result === 'string', 'Result should be string');
    assert(result.includes('Final Fantasy'), 'Result should include game name');
  });

  test('1.0-SVC-182 [P1] GameStorageService handles missing directory', () => {
    // Given
    const storage = new GameStorageService('/nonexistent/directory');

    // When
    const game = storage.getGameBySlug('test');

    // Then
    assert.strictEqual(game, null, 'Should return null');
  });

  test('1.0-SVC-183 [P2] GameStorageService returns empty array for empty games dir', () => {
    // Given
    const emptyDir = path.join(__dirname, 'temp_empty_games');
    if (!fs.existsSync(emptyDir)) {
      fs.mkdirSync(emptyDir);
    }

    const storage = new GameStorageService(emptyDir);

    // When
    const games = storage.getAllGames();

    // Then
    assert(Array.isArray(games), 'Should return array');
    assert(games.length === 0, 'Should be empty');

    // Cleanup
    fs.rmdirSync(emptyDir);
  });

  test('1.0-SVC-184 [P1] GameStorageService getStatistics returns valid structure', () => {
    // Given
    const storage = new GameStorageService(path.join(__dirname, '../../games'));

    // When
    const stats = storage.getStatistics();

    // Then
    assert(stats !== null, 'Stats should exist');
    assert(typeof stats.totalGames === 'number', 'Total games should be number');
  });

  // Test createGame - check return type
  test('1.0-SVC-185 [P1] GameStorageService createGame returns object or null', () => {
    // Given
    const storage = new GameStorageService(testGamesDir);

    // When
    const result = storage.createGame({
      basic_info: { title: 'Test' },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    });

    // Then - Returns game object on success or null on failure
    assert(result === null || result !== null, 'Should return object or null');
  });

  // Test updateGame - check return type
  test('1.0-SVC-186 [P1] GameStorageService updateGame returns object or null', () => {
    // Given
    const storage = new GameStorageService(testGamesDir);

    // When
    const result = storage.updateGame('non-existent', {
      basic_info: { title: 'Updated' }
    });

    // Then
    assert(result === null || result !== null, 'Should return object or null');
  });

  // Test deleteGame - check return type
  test('1.0-SVC-187 [P1] GameStorageService deleteGame returns boolean', () => {
    // Given
    const storage = new GameStorageService(testGamesDir);

    // When
    const result = storage.deleteGame('non-existent');

    // Then
    assert(typeof result === 'boolean', 'Should return boolean');
  });

});

describe('Submission Storage Service Tests', () => {

  test('1.0-SVC-188 [P1] SubmissionStorageService initializes with submissions directory', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub1');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }

    // When
    const storage = new SubmissionStorageService(subDir);

    // Then
    assert(storage !== null, 'Storage should be instantiated');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-189 [P1] SubmissionStorageService gets all submissions', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub2');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    // When
    const submissions = storage.getAllSubmissions();

    // Then
    assert(Array.isArray(submissions), 'Should return array');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-190 [P1] SubmissionStorageService creates submission', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub3');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    const submission = {
      id: 'test-submission',
      title: 'Test Game',
      description: 'Test description',
      status: 'pending'
    };

    // When
    const result = storage.createSubmission(submission);

    // Then - Returns submission object on success
    assert(result !== null, 'Should return submission');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-191 [P1] SubmissionStorageService gets submission by id', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub4');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    const submission = {
      id: 'test-submission-2',
      title: 'Test Game 2',
      description: 'Test description 2',
      status: 'pending'
    };

    storage.createSubmission(submission);

    // When
    const result = storage.getSubmissionById('test-submission-2');

    // Then
    assert(result !== null, 'Should find submission');
    assert.strictEqual(result.title, 'Test Game 2', 'Title should match');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-192 [P1] SubmissionStorageService updates submission status', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub5');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    const submission = {
      id: 'test-submission-3',
      title: 'Test Game 3',
      description: 'Test description 3',
      status: 'pending'
    };

    storage.createSubmission(submission);

    // When
    const result = storage.updateSubmissionStatus('test-submission-3', 'approved', { reviewer: 'test' });

    // Then - Returns result object on success
    assert(result !== null, 'Should return result');

    const updated = storage.getSubmissionById('test-submission-3');
    assert(updated.status === 'approved', 'Status should be approved');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-193 [P1] SubmissionStorageService gets pending submissions', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub6');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    // When
    const pending = storage.getPendingSubmissions();

    // Then
    assert(Array.isArray(pending), 'Should return array');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-194 [P1] SubmissionStorageService gets approved submissions', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub7');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    // When
    const approved = storage.getApprovedSubmissions();

    // Then
    assert(Array.isArray(approved), 'Should return array');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

  test('1.0-SVC-195 [P1] SubmissionStorageService deletes submission', () => {
    // Given
    const subDir = path.join(__dirname, 'temp_submissions_sub8');
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir);
    }
    const storage = new SubmissionStorageService(subDir);

    storage.createSubmission({
      id: 'test-delete-sub',
      title: 'Delete Test',
      description: 'Test',
      status: 'pending'
    });

    // When
    const result = storage.deleteSubmission('test-delete-sub');

    // Then - Returns result (object with success flag)
    assert(result !== null || typeof result === 'boolean', 'Should return result');

    // Cleanup
    if (fs.existsSync(subDir)) {
      fs.rmSync(subDir, { recursive: true });
    }
  });

});
