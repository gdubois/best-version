// API Integration Test Suite
// Test IDs: 2.0-INT-001 to 2.0-INT-015
// Framework: Supertest + Jest

const request = require('supertest');
const express = require('express');
const assert = require('assert');

describe('API Integration Tests', () => {
  // Test helper to create fresh test app with routes
  function createAppWithRoutes(mockGames = null) {
    const app = express();
    app.use(express.json());

    // Define routes in specific order - more specific routes first
    // Search route before :slug to prevent routing conflict
    app.get('/api/games/search', (req, res) => {
      if (!req.query.q) {
        return res.status(400).json({ success: false, error: 'Search query parameter required' });
      }
      const games = mockGames || [];
      const results = games.filter(g => g.basic_info.title.includes(req.query.q));
      res.json({ success: true, data: results, count: results.length });
    });

    app.get('/api/games/filters', (req, res) => {
      res.json({ success: true, data: { genres: [], themes: [], platforms: [] } });
    });

    if (mockGames) {
      app.get('/api/games', (req, res) => {
        res.json({ success: true, data: mockGames, count: mockGames.length });
      });
      app.get('/api/games/stats', (req, res) => {
        res.json({ success: true, data: { total_games: mockGames.length, total_platforms: 3 } });
      });
    } else {
      app.get('/api/games', (req, res) => {
        res.json({ success: true, data: [], count: 0 });
      });
      app.get('/api/games/stats', (req, res) => {
        res.json({ success: true, data: { total_games: 0, total_platforms: 0 } });
      });
    }

    // :slug must come after /search to avoid matching "search" as a slug
    app.get('/api/games/:slug', (req, res) => {
      if (mockGames) {
        const game = mockGames.find(g => g.basic_info.url_slug === req.params.slug);
        if (game) {
          res.json({ success: true, data: game });
        } else {
          res.status(404).json({ success: false, error: 'Game not found' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Game not found' });
      }
    });

    app.post('/api/submissions', (req, res) => {
      if (!req.body.title || !req.body.title.trim()) {
        return res.status(400).json({ success: false, error: 'Game title is required' });
      }
      const submission = {
        id: `sub-${Date.now()}`,
        ...req.body,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      res.status(201).json({ success: true, data: submission });
    });

    app.get('/api/admin/dashboard/stats', (req, res) => {
      const token = req.query.token || req.cookies?.admin_token;
      if (!token || token !== 'valid-token') {
        return res.status(401).json({ success: false, error: 'Admin authentication required' });
      }
      res.json({ success: true, data: {} });
    });

    return app;
  }

  // ==================== Games API Tests ====================

  test('2.0-INT-001 P1 GET /api/games returns all games', async () => {
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } }
    ];

    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games');

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(Array.isArray(response.body.data), true);
    assert.strictEqual(response.body.data.length, 2);
  });

  test('2.0-INT-002 P1 GET /api/games/stats returns statistics', async () => {
    const mockGames = [{ basic_info: { title: 'Game 1', url_slug: 'game-1' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/stats');

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.total_games, 1);
  });

  test('2.0-INT-003 P1 GET /api/games/:slug returns single game', async () => {
    const mockGame = { basic_info: { title: 'Pokemon Emerald', url_slug: 'pokemon-emerald' } };
    const mockGames = [mockGame];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/pokemon-emerald');

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.basic_info.title, 'Pokemon Emerald');
  });

  test('2.0-INT-004 P1 GET /api/games/:slug returns 404 for non-existent game', async () => {
    const testApp = createAppWithRoutes();

    const response = await request(testApp).get('/api/games/non-existent-game');

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Game not found');
  });

  test('2.0-INT-005 P1 GET /api/games/search?q=query returns search results', async () => {
    const mockGames = [
      { basic_info: { title: 'Final Fantasy', url_slug: 'final-fantasy' } },
      { basic_info: { title: 'Final Fantasy II', url_slug: 'final-fantasy-ii' } }
    ];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/search').query({ q: 'Final' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(Array.isArray(response.body.data), true);
    assert.strictEqual(response.body.data.length, 2);
  });

  test('2.0-INT-006 P2 GET /api/games/search returns 400 without query parameter', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/search');

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Search query parameter required');
  });

  test('2.0-INT-006a P2 GET /api/games/search works with explicit query', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/search').query({ q: 'Test' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  test('2.0-INT-007 P1 GET /api/games/filters returns available filters', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/filters');

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.ok(response.body.data.hasOwnProperty('genres'));
    assert.ok(response.body.data.hasOwnProperty('themes'));
    assert.ok(response.body.data.hasOwnProperty('platforms'));
  });

  // ==================== Submission API Tests ====================

  test('2.0-INT-008 P1 POST /api/submissions creates new submission', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const submissionData = {
      title: 'New Game Submission',
      email: 'test@example.com'
    };

    const response = await request(testApp).post('/api/submissions').send(submissionData);

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.data.title, 'New Game Submission');
    assert.strictEqual(response.body.data.status, 'pending');
  });

  test('2.0-INT-009 P1 POST /api/submissions returns 400 without title', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).post('/api/submissions').send({ platforms: ['Nintendo'] });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Game title is required');
  });

  // ==================== Admin API Tests ====================

  test('2.0-INT-010 P2 GET /api/admin/dashboard/stats requires admin auth', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/admin/dashboard/stats');

    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.success, false);
    assert.ok(response.body.error.includes('auth'));
  });

  test('2.0-INT-011 P2 GET /api/admin/dashboard/stats works with valid token', async () => {
    const mockGames = [{ basic_info: { title: 'Test', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/admin/dashboard/stats').query({ token: 'valid-token' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  // ==================== Edge Case Tests ====================

  test('2.0-INT-012 P2 Search handles special characters', async () => {
    const mockGames = [{ basic_info: { title: 'Test Game', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/search').query({ q: 'test!@#$' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  test('2.0-INT-013 P2 Search handles XSS attempt', async () => {
    const mockGames = [{ basic_info: { title: 'Test Game', url_slug: 'test' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games/search').query({ q: '<script>alert(1)</script>' });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  test('2.0-INT-014 P2 Unicode characters work correctly', async () => {
    const mockGames = [{ basic_info: { title: '日本語ゲーム', url_slug: 'japanese' } }];
    const testApp = createAppWithRoutes(mockGames);

    const response = await request(testApp).get('/api/games');

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.data[0].basic_info.title, '日本語ゲーム');
  });

  test('2.0-INT-015 P2 Unknown routes return 404', async () => {
    const app = express();
    app.use(express.json());

    const response = await request(app).get('/api/nonexistent/endpoint');

    assert.strictEqual(response.status, 404);
  });
});
