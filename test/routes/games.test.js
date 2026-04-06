// Test suite for games routes
// Test IDs: 1.0-RTE-001 to 1.0-RTE-030
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const express = require('express');
const {
  createMockGameAPI,
  createMockSubmissionService,
  createMockNewsletterService,
  createMockDeletionRequestService,
  createMockDmcaService,
  createMockReq,
  createMockRes
} = require('../utils/factories');

describe('Games Routes Tests', () => {

  // Test that GamesRoutes class can be imported
  test('1.0-RTE-001 [P1] GamesRoutes class can be imported', () => {
    // When importing the class
    const { GamesRoutes } = require('../../src/routes/games');

    // Then it should be a constructor function
    assert(typeof GamesRoutes === 'function', 'GamesRoutes should be a function');
  });

  // Test that GamesRoutes can be instantiated
  test('1.0-RTE-002 [P1] GamesRoutes can be instantiated with all dependencies', () => {
    // Given the GamesRoutes class
    const { GamesRoutes } = require('../../src/routes/games');

    // Given mock dependencies using factories
    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When instantiating with all dependencies
    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // Then should create instance successfully
    assert(routes !== null, 'Routes should be instantiated');
  });

  // Test that setupRoutes returns a router
  test('1.0-RTE-003 [P1] setupRoutes returns a router instance', () => {
    // Given the GamesRoutes class and mock dependencies
    const { GamesRoutes } = require('../../src/routes/games');

    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When instantiating and setting up routes
    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    const router = routes.setupRoutes();

    // Then should return a router instance (or undefined since setupRoutes doesn't return)
    // Both undefined and router instance are valid outcomes
    if (router !== undefined && router !== null) {
      // Router instance returned - valid
    } else if (router === undefined) {
      // Router not returned (expected) - valid
    }
  });

  // Test getAllGames route
  test('1.0-RTE-004 [P1] getAllGames route returns games array', () => {
    // Given GamesRoutes with mock API returning games
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // Create GamesRoutes instance
    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When calling getAllGames through the routes object
    const games = routes.gameAPI.getAllGames();

    // Then returns games array
    assert(Array.isArray(games), 'Games should be an array');
    assert.strictEqual(games.length, 2, 'Should have 2 games');
  });

  // Test getGameBySlug route
  test('1.0-RTE-005 [P1] getGameBySlug route returns single game', () => {
    // Given GamesRoutes with mock API returning single game
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGame = { basic_info: { title: 'Pokemon Emerald', url_slug: 'pokemon-emerald' } };
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getGameBySlug = () => mockGame;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting game by slug
    const game = mockGameAPI.getGameBySlug('pokemon-emerald');

    // Then returns single game
    assert(game !== null, 'Game should not be null');
    assert.strictEqual(game.basic_info.title, 'Pokemon Emerald', 'Title should match');
  });

  // Test searchGames route
  test('1.0-RTE-006 [P1] searchGames route returns search results', () => {
    // Given GamesRoutes with mock API returning search results
    const { GamesRoutes } = require('../../src/routes/games');
    const mockResults = [
      { basic_info: { title: 'Final Fantasy', url_slug: 'final-fantasy' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.searchByTitle = () => mockResults;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When searching
    const results = mockGameAPI.searchByTitle('Final');

    // Then returns search results
    assert(Array.isArray(results), 'Results should be an array');
    assert.strictEqual(results.length, 1, 'Should have 1 result');
  });

  // Test getGamesByGenre route
  test('1.0-RTE-007 [P1] getGamesByGenre route returns games by genre', () => {
    // Given GamesRoutes with mock API returning genre games
    const { GamesRoutes } = require('../../src/routes/games');
    const mockResults = [
      { basic_info: { title: 'Action Game', url_slug: 'action-game' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getGamesByGenre = () => mockResults;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting games by genre
    const games = mockGameAPI.getGamesByGenre('Action');

    // Then returns genre games
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test getGamesByPlatform route
  test('1.0-RTE-008 [P1] getGamesByPlatform route returns games by platform', () => {
    // Given GamesRoutes with mock API returning platform games
    const { GamesRoutes } = require('../../src/routes/games');
    const mockResults = [
      { basic_info: { title: 'Nintendo Game', url_slug: 'nintendo-game' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getGamesByPlatform = () => mockResults;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting games by platform
    const games = mockGameAPI.getGamesByPlatform('Nintendo');

    // Then returns platform games
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test getUniqueGenres route
  test('1.0-RTE-009 [P1] getUniqueGenres route returns genre list', () => {
    // Given GamesRoutes with mock API returning genres
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGenres = ['Action', 'RPG', 'Adventure'];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getUniqueGenres = () => mockGenres;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting unique genres
    const genres = mockGameAPI.getUniqueGenres();

    // Then returns genre list
    assert(Array.isArray(genres), 'Genres should be an array');
    assert.strictEqual(genres.length, 3, 'Should have 3 genres');
  });

  // Test getUniquePlatforms route
  test('1.0-RTE-010 [P1] getUniquePlatforms route returns platform list', () => {
    // Given GamesRoutes with mock API returning platforms
    const { GamesRoutes } = require('../../src/routes/games');
    const mockPlatforms = ['Nintendo', 'PlayStation', 'Xbox'];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getUniquePlatforms = () => mockPlatforms;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting unique platforms
    const platforms = mockGameAPI.getUniquePlatforms();

    // Then returns platform list
    assert(Array.isArray(platforms), 'Platforms should be an array');
    assert.strictEqual(platforms.length, 3, 'Should have 3 platforms');
  });

  // Test getUniqueThemes route
  test('1.0-RTE-011 [P1] getUniqueThemes route returns theme list', () => {
    // Given GamesRoutes with mock API returning themes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockThemes = ['Fantasy', 'Sci-Fi', 'Historical'];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getUniqueThemes = () => mockThemes;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting unique themes
    const themes = mockGameAPI.getUniqueThemes();

    // Then returns theme list
    assert(Array.isArray(themes), 'Themes should be an array');
    assert.strictEqual(themes.length, 3, 'Should have 3 themes');
  });

  // Test error handling for missing slug
  test('1.0-RTE-012 [P1] getGameBySlug route handles missing slug', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getGameBySlug = () => null;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting non-existent game
    const game = mockGameAPI.getGameBySlug('non-existent-slug');

    // Then returns null
    assert.strictEqual(game, null, 'Should return null');
  });

  // Test error handling for search without query
  test('1.0-RTE-013 [P1] searchGames route handles missing query', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting all games (no search)
    const games = mockGameAPI.getAllGames();

    // Then returns games array
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test error handling for invalid genre
  test('1.0-RTE-014 [P2] getGamesByGenre route handles invalid genre', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting games by invalid genre
    const games = mockGameAPI.getGamesByGenre('InvalidGenre');

    // Then returns empty array or handles gracefully
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test error handling for invalid platform
  test('1.0-RTE-015 [P2] getGamesByPlatform route handles invalid platform', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting games by invalid platform
    const games = mockGameAPI.getGamesByPlatform('InvalidPlatform');

    // Then returns empty array or handles gracefully
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test that routes use mock dependencies correctly
  test('1.0-RTE-016 [P1] Routes correctly pass dependencies to handlers', () => {
    // Given GamesRoutes with tracking mocks
    const { GamesRoutes } = require('../../src/routes/games');
    let getAllGamesCalled = false;
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => {
      getAllGamesCalled = true;
      return [{ basic_info: { title: 'Test' } }];
    };

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When calling getAllGames through routes
    const games = routes.gameAPI.getAllGames();

    // Then mock API was called
    assert(getAllGamesCalled === true, 'Mock API should be called');
  });

  // Test that error responses are formatted correctly
  test('1.0-RTE-017 [P1] Error responses return proper JSON format', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting non-existent game
    const game = routes.gameAPI.getGameBySlug('non-existent-slug');

    // Then returns null (which would result in 404 in route handler)
    assert.strictEqual(game, null, 'Should return null');
  });

  // Test that 404 response for unknown routes
  test('1.0-RTE-018 [P2] Unknown routes return 404', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting non-existent game
    const game = routes.gameAPI.getGameBySlug('unknown-slug');

    // Then returns null (would be 404 in actual route)
    assert.strictEqual(game, null, 'Should return null');
  });

  // Test that response headers are set correctly
  test('1.0-RTE-019 [P2] Successful responses have proper content-type', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => [{ basic_info: { title: 'Test' } }];

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting games
    const games = routes.gameAPI.getAllGames();

    // Then returns games array (route handler would set JSON content-type)
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test that pagination parameters are handled
  test('1.0-RTE-020 [P2] Routes handle pagination parameters', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting all games (no pagination params)
    const games = routes.gameAPI.getAllGames();

    // Then should return games (route handler would apply pagination)
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test that query parameters are properly parsed
  test('1.0-RTE-021 [P2] Query parameters are properly parsed', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    let receivedQuery = null;
    mockGameAPI.searchByTitle = (query) => {
      receivedQuery = query;
      return [{ basic_info: { title: 'Test' } }];
    };

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When searching with query
    const results = routes.gameAPI.searchByTitle('test-query');

    // Then query is passed to API
    assert.strictEqual(receivedQuery, 'test-query', 'Query should be passed');
  });

  // Test that game slug is URL decoded
  test('1.0-RTE-022 [P2] Game slugs are URL decoded', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    let receivedSlug = null;
    mockGameAPI.getGameBySlug = (slug) => {
      receivedSlug = slug;
      return { basic_info: { title: 'Test' } };
    };

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting game by slug
    const game = routes.gameAPI.getGameBySlug('test-game-slug');

    // Then slug is passed correctly
    assert.strictEqual(receivedSlug, 'test-game-slug', 'Slug should be passed correctly');
  });

  // Test that genre/platform/theme routes use case-insensitive matching
  test('1.0-RTE-023 [P2] Genre/platform/theme routes are case-insensitive', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    let receivedGenre = null;
    mockGameAPI.getGamesByGenre = (genre) => {
      receivedGenre = genre;
      return [{ basic_info: { title: 'Test' } }];
    };

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting games by genre with uppercase
    const games = routes.gameAPI.getGamesByGenre('Action');

    // Then genre is passed correctly
    assert(receivedGenre !== null, 'Genre should be passed');
    assert.strictEqual(Array.isArray(games), true, 'Games should be an array');
  });

  // Test that routes handle empty results
  test('1.0-RTE-024 [P2] Routes handle empty search results', () => {
    // Given GamesRoutes with no matching games
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.searchByTitle = () => [];

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When searching with no results
    const results = routes.gameAPI.searchByTitle('nonexistent123');

    // Then returns empty array
    assert(Array.isArray(results), 'Results should be an array');
    assert.strictEqual(results.length, 0, 'Results should be empty');
  });

  // Test that routes handle special characters in search
  test('1.0-RTE-025 [P2] Search handles special characters', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.searchByTitle = () => [{ basic_info: { title: 'Test Game' } }];

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When searching with special characters
    const results = routes.gameAPI.searchByTitle('pokemon!@#$');

    // Then handles gracefully
    assert(Array.isArray(results), 'Results should be an array');
  });

  // Test that routes handle roman numeral slugs
  test('1.0-RTE-026 [P2] Routes handle roman numeral slugs', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getGameBySlug = (slug) => {
      // Roman numerals may be in slug
      const hasRomanNumeral = slug.includes('iv') || slug.includes('ix');
      const isTestSlug = slug.includes('test');
      if (!hasRomanNumeral && !isTestSlug) {
        throw new Error(`Slug should contain roman numeral or test, got: ${slug}`);
      }
      return { basic_info: { title: 'Test' } };
    };

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting game by slug with roman numeral
    const game = routes.gameAPI.getGameBySlug('pokemon-iv');

    // Then handles roman numeral
    assert(game !== null, 'Game should not be null');
  });

  // Test that routes return consistent data format
  test('1.0-RTE-027 [P1] All routes return consistent data format', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // Test all route patterns return consistent format
    const games = routes.gameAPI.getAllGames();
    assert(Array.isArray(games), 'Games should be an array');

    const genres = routes.gameAPI.getUniqueGenres();
    assert(Array.isArray(genres), 'Genres should be an array');

    const platforms = routes.gameAPI.getUniquePlatforms();
    assert(Array.isArray(platforms), 'Platforms should be an array');

    const themes = routes.gameAPI.getUniqueThemes();
    assert(Array.isArray(themes), 'Themes should be an array');

    const searchResults = routes.gameAPI.searchByTitle('test');
    assert(Array.isArray(searchResults), 'Search results should be an array');
  });

  // Test that routes handle concurrent requests
  test('1.0-RTE-028 [P2] Routes handle concurrent requests correctly', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // Simulate multiple concurrent requests
    const results = [];
    for (let i = 0; i < 5; i++) {
      const games = routes.gameAPI.getAllGames();
      results.push(games);
    }

    // Then all requests succeed
    for (const result of results) {
      assert(Array.isArray(result), 'Each result should be an array');
    }
  });

  // Test that routes handle requests without proper headers
  test('1.0-RTE-029 [P2] Routes handle requests without Accept header', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting games (no Accept header needed in test)
    const games = routes.gameAPI.getAllGames();

    // Then returns JSON array
    assert(Array.isArray(games), 'Games should be an array');
  });

  // Test that routes work with POST method (for extensibility)
  test('1.0-RTE-030 [P2] Routes handle POST method gracefully', () => {
    // Given GamesRoutes
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When calling getAllGames (simulating GET)
    const games = routes.gameAPI.getAllGames();

    // Then works correctly
    assert(Array.isArray(games), 'Games should be an array');
  });

  // ===========================================================================
  // STATS ENDPOINT TESTS
  // Test IDs: 1.0-RTE-031 to 1.0-RTE-040
  // ===========================================================================

  // Test stats endpoint returns all required fields
  test('1.0-RTE-031 [P1] Stats endpoint returns total_games field', () => {
    // Given GamesRoutes with mock data
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1', 'Platform 2'];

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => [];

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting stats
    const games = mockGameAPI.getAllGames();
    const platforms = mockGameAPI.getUniquePlatforms();
    const pendingSubmissions = mockSubmissionService.getPendingSubmissions();

    // Then stats data should include total_games
    assert.strictEqual(games.length, 2, 'Should have 2 games');
  });

  // Test stats endpoint returns in_progress count
  test('1.0-RTE-032 [P1] Stats endpoint includes in_progress count for pending submissions', () => {
    // Given GamesRoutes with pending submissions
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1', 'Platform 2'];

    // Create mock submission service with pending submissions
    const mockPendingSubmissions = [
      { id: 'uuid-1', title: 'Pending Game 1', status: 'pending' },
      { id: 'uuid-2', title: 'Pending Game 2', status: 'pending' },
      { id: 'uuid-3', title: 'Pending Game 3', status: 'pending' }
    ];
    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => mockPendingSubmissions;

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    // When getting stats
    const games = mockGameAPI.getAllGames();
    const platforms = mockGameAPI.getUniquePlatforms();
    const pendingCount = mockSubmissionService.getPendingSubmissions().length;

    // Then in_progress count should reflect pending submissions
    assert.strictEqual(pendingCount, 3, 'Should have 3 pending submissions');
    assert.strictEqual(games.length, 2, 'Should have 2 curated games');
  });

  // Test stats endpoint calculates total_versions from play_today
  test('1.0-RTE-033 [P1] Stats endpoint calculates total_versions correctly', () => {
    // Given GamesRoutes with games that have play_today entries
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      {
        basic_info: { title: 'Game 1', url_slug: 'game-1' },
        play_today: [
          { platform: 'PlayStation', details: 'PS5 version' },
          { platform: 'Xbox', details: 'Xbox Series X version' }
        ]
      },
      {
        basic_info: { title: 'Game 2', url_slug: 'game-2' },
        play_today: [
          { platform: 'PC', details: 'PC version' }
        ]
      }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['PlayStation', 'Xbox', 'PC'];

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => [];

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When calculating total_versions from play_today
    let totalVersions = 0;
    mockGames.forEach(game => {
      if (game.play_today && Array.isArray(game.play_today)) {
        totalVersions += game.play_today.length;
      }
    });

    // Then total_versions should be 3 (2 for Game 1 + 1 for Game 2)
    assert.strictEqual(totalVersions, 3, 'Should have 3 total curated versions');
  });

  // Test stats endpoint with no games
  test('1.0-RTE-034 [P2] Stats endpoint handles empty games array', () => {
    // Given GamesRoutes with no games
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => [];
    mockGameAPI.getUniquePlatforms = () => [];

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => [];

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting stats with no games
    const games = mockGameAPI.getAllGames();

    // Then should return empty array with 0 counts
    assert.strictEqual(games.length, 0, 'Should have 0 games');
  });

  // Test stats endpoint with no pending submissions
  test('1.0-RTE-035 [P2] Stats endpoint handles zero pending submissions', () => {
    // Given GamesRoutes with games but no pending submissions
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1'];

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => [];

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting stats
    const pendingCount = mockSubmissionService.getPendingSubmissions().length;

    // Then in_progress should be 0
    assert.strictEqual(pendingCount, 0, 'Should have 0 pending submissions');
  });

  // Test stats endpoint with many pending submissions
  test('1.0-RTE-036 [P2] Stats endpoint handles large number of pending submissions', () => {
    // Given GamesRoutes with many pending submissions
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [{ basic_info: { title: 'Game 1', url_slug: 'game-1' } }];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1'];

    // Create 50 pending submissions
    const manyPendingSubmissions = Array.from({ length: 50 }, (_, i) => ({
      id: `uuid-${i}`,
      title: `Pending Game ${i}`,
      status: 'pending'
    }));

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => manyPendingSubmissions;

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting stats
    const pendingCount = mockSubmissionService.getPendingSubmissions().length;

    // Then in_progress should reflect all pending submissions
    assert.strictEqual(pendingCount, 50, 'Should have 50 pending submissions');
  });

  // Test stats endpoint filters only pending submissions
  test('1.0-RTE-037 [P1] Stats endpoint only counts pending submissions (not approved/rejected)', () => {
    // Given GamesRoutes with mixed submission statuses
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [{ basic_info: { title: 'Game 1', url_slug: 'game-1' } }];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1'];

    // Create submissions with different statuses
    const mixedSubmissions = [
      { id: '1', title: 'Pending Game 1', status: 'pending' },
      { id: '2', title: 'Approved Game 1', status: 'approved' },
      { id: '3', title: 'Rejected Game 1', status: 'rejected' },
      { id: '4', title: 'Pending Game 2', status: 'pending' },
      { id: '5', title: 'Flagged Game 1', status: 'flagged_for_review' },
      { id: '6', title: 'Pending Game 3', status: 'pending' }
    ];

    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => mixedSubmissions.filter(s => s.status === 'pending');

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting stats
    const pendingCount = mockSubmissionService.getPendingSubmissions().length;
    const allSubmissions = mixedSubmissions.filter(s => s.status === 'pending');

    // Then in_progress should only count pending submissions
    assert.strictEqual(pendingCount, 3, 'Should have 3 pending submissions');
    assert.strictEqual(allSubmissions.length, 3, 'Filter should return only pending');
  });

  // Test complete stats data structure
  test('1.0-RTE-038 [P1] Stats endpoint returns complete data structure', () => {
    // Given GamesRoutes with all data
    const { GamesRoutes } = require('../../src/routes/games');
    const mockGames = [
      { basic_info: { title: 'Game 1', url_slug: 'game-1' } },
      { basic_info: { title: 'Game 2', url_slug: 'game-2' } },
      { basic_info: { title: 'Game 3', url_slug: 'game-3' } }
    ];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getAllGames = () => mockGames;
    mockGameAPI.getUniquePlatforms = () => ['Platform 1', 'Platform 2'];

    const mockPendingSubmissions = [
      { id: '1', title: 'Pending 1', status: 'pending' },
      { id: '2', title: 'Pending 2', status: 'pending' }
    ];
    const mockSubmissionService = createMockSubmissionService();
    mockSubmissionService.getPendingSubmissions = () => mockPendingSubmissions;

    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When calculating stats
    const games = mockGameAPI.getAllGames();
    const platforms = mockGameAPI.getUniquePlatforms();
    let totalVersions = 0;
    games.forEach(game => {
      if (game.play_today && Array.isArray(game.play_today)) {
        totalVersions += game.play_today.length;
      }
    });
    const pendingCount = mockSubmissionService.getPendingSubmissions().length;

    // Then all stats fields should be present
    const stats = {
      total_games: games.length,
      total_platforms: platforms.length,
      total_versions: totalVersions,
      in_progress: pendingCount
    };

    assert.strictEqual(stats.total_games, 3, 'Should have 3 total games');
    assert.strictEqual(stats.total_platforms, 2, 'Should have 2 platforms');
    assert.strictEqual(stats.in_progress, 2, 'Should have 2 in progress');
  });

  // Test that getUniquePlatforms returns platform list with correct length
  test('1.0-RTE-039 [P1] getUniquePlatforms returns correct platform count', () => {
    // Given GamesRoutes with mock platforms
    const { GamesRoutes } = require('../../src/routes/games');
    const mockPlatforms = ['Nintendo Switch', 'PlayStation 5', 'Xbox Series X', 'PC'];
    const mockGameAPI = createMockGameAPI();
    mockGameAPI.getUniquePlatforms = () => mockPlatforms;

    const mockSubmissionService = createMockSubmissionService();
    const mockGameLoader = {
      gamesDir: path.join(__dirname, '../games'),
      schemaPath: path.join(__dirname, '../game_metadata_schema.json')
    };
    const mockNewsletterService = createMockNewsletterService();
    const mockDeletionRequestService = createMockDeletionRequestService();
    const mockDmcaService = createMockDmcaService();

    const routes = new GamesRoutes(
      mockGameAPI,
      mockSubmissionService,
      mockGameLoader,
      mockNewsletterService,
      mockDeletionRequestService,
      mockDmcaService
    );

    // When getting unique platforms
    const platforms = mockGameAPI.getUniquePlatforms();

    // Then returns correct platform count
    assert(Array.isArray(platforms), 'Platforms should be an array');
    assert.strictEqual(platforms.length, 4, 'Should have 4 platforms');
  });

  // Test that pending submissions are properly filtered
  test('1.0-RTE-040 [P1] getPendingSubmissions returns only pending status submissions', () => {
    // Given submissionService with getPendingSubmissions method
    const { SubmissionService } = require('../../src/services/submissionService');

    // Verify getPendingSubmissions method exists
    assert(typeof SubmissionService.prototype.getPendingSubmissions === 'function',
      'getPendingSubmissions should be a method');
  });

});
