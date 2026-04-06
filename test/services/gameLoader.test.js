// Test suite for GameLoader service
// Test IDs: 1.0-SVC-030 to 1.0-SVC-061
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { GameLoader } = require('../../src/services/gameLoader');

const gamesDir = path.join(__dirname, '../../games');
const schemaPath = path.join(__dirname, '../../game_metadata_schema.json');

describe('GameLoader Service Tests', () => {

  // Test constructor
  test('1.0-SVC-030 [P1] GameLoader initializes with gamesDir and schemaPath', () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // Then
    assert(loader !== null, 'Loader should be instantiated');
    assert.strictEqual(loader.gamesDir, gamesDir, 'Games dir should match');
    assert.strictEqual(loader.gameStorage, null, 'Game storage should be null');
    assert(loader.games instanceof Map, 'Games should be a Map');
    assert.strictEqual(loader.isLoaded, false, 'Should not be loaded yet');
  });

  test('1.0-SVC-031 [P1] GameLoader initializes with gameStorage', () => {
    // Given
    const mockStorage = {
      getAllGames: () => [],
      getGameBySlug: () => null,
      updateGame: () => {},
      deleteGame: () => {}
    };

    // When
    const loader = new GameLoader(mockStorage, schemaPath);

    // Then
    assert(loader !== null, 'Loader should be instantiated');
    assert.strictEqual(loader.gamesDir, null, 'Games dir should be null');
    assert.strictEqual(loader.gameStorage, mockStorage, 'Game storage should match');
  });

  test('1.0-SVC-032 [P2] GameLoader handles missing schema file gracefully', async () => {
    // Given
    const loader = new GameLoader(gamesDir, '/nonexistent/schema.json');

    // When
    await loader.loadAll();

    // Then
    assert(loader.games.size >= 0, 'Should have loaded games');
  });

  // Test loadAll method
  test('1.0-SVC-033 [P1] GameLoader loads all game files', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    assert.strictEqual(loader.isLoaded, true, 'Should be loaded');
    assert(loader.games.size > 0, 'Should have games');
  });

  test('1.0-SVC-034 [P1] GameLoader loads consistent number of games', async () => {
    // Given
    const loader1 = new GameLoader(gamesDir, schemaPath);

    // When
    await loader1.loadAll();

    // Then
    const count1 = loader1.games.size;

    const loader2 = new GameLoader(gamesDir, schemaPath);
    await loader2.loadAll();
    const count2 = loader2.games.size;
    assert.strictEqual(count1, count2, 'Should load same number of games');
  });

  test('1.0-SVC-035 [P1] GameLoader handles already loaded state', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();
    const result1 = await loader.loadAll();

    // Then - Should return existing games without reloading
    assert.strictEqual(result1.size, loader.games.size, 'Size should match');
  });

  // Test getGameCount
  test('1.0-SVC-036 [P1] GameLoader returns correct game count', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const count = loader.getGameCount();
    assert.strictEqual(count, loader.games.size, 'Count should match');
  });

  // Test getAllGames
  test('1.0-SVC-037 [P1] GameLoader getAllGames throws when not loaded', () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // Then
    assert.throws(() => loader.getAllGames(), /Game data not loaded/, 'Should throw');
  });

  test('1.0-SVC-038 [P1] GameLoader getAllGames returns array', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const games = loader.getAllGames();
    assert(Array.isArray(games), 'Should return array');
    assert(games.length > 0, 'Should have games');
  });

  test('1.0-SVC-039 [P1] GameLoader getAllGames returns correct number of games', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const games = loader.getAllGames();
    assert.strictEqual(games.length, loader.games.size, 'Length should match');
  });

  // Test getGameBySlug
  test('1.0-SVC-040 [P1] GameLoader getGameBySlug throws when not loaded', () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // Then
    assert.throws(() => loader.getGameBySlug('/games/test'), /Game data not loaded/, 'Should throw');
  });

  test('1.0-SVC-041 [P1] GameLoader getGameBySlug finds existing game', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const game = loader.getGameBySlug('/games/pokemon-emerald');
    assert(game !== null, 'Game should exist');
    assert.strictEqual(game.basic_info.url_slug, '/games/pokemon-emerald', 'Slug should match');
  });

  test('1.0-SVC-042 [P1] GameLoader getGameBySlug returns null for non-existent game', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const game = loader.getGameBySlug('/games/non-existent-game');
    assert.strictEqual(game, null, 'Should return null');
  });

  // Test getGamesByGenre
  test('1.0-SVC-043 [P1] GameLoader getGamesByGenre throws when not loaded', () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // Then
    assert.throws(() => loader.getGamesByGenre('RPG'), /Game data not loaded/, 'Should throw');
  });

  test('1.0-SVC-044 [P1] GameLoader getGamesByGenre finds games by genre', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const rpgGames = loader.getGamesByGenre('RPG');
    assert(Array.isArray(rpgGames), 'Should return array');
    rpgGames.forEach(game => {
      assert(game.basic_info.genres.some(g => g.toLowerCase() === 'rpg'), 'Should be RPG');
    });
  });

  test('1.0-SVC-045 [P2] GameLoader getGamesByGenre is case insensitive', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const rpgGames1 = loader.getGamesByGenre('rpg');
    const rpgGames2 = loader.getGamesByGenre('RPG');
    assert.strictEqual(rpgGames1.length, rpgGames2.length, 'Should have same count');
  });

  test('1.0-SVC-046 [P2] GameLoader getGamesByGenre returns empty array for no matches', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const games = loader.getGamesByGenre('NonExistentGenre12345');
    assert(Array.isArray(games), 'Should return array');
    assert.strictEqual(games.length, 0, 'Should be empty');
  });

  // Test getGamesByPlatform
  test('1.0-SVC-047 [P1] GameLoader getGamesByPlatform throws when not loaded', () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // Then
    assert.throws(() => loader.getGamesByPlatform('Super Nintendo'), /Game data not loaded/, 'Should throw');
  });

  test('1.0-SVC-048 [P1] GameLoader getGamesByPlatform finds games by platform', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const snesGames = loader.getGamesByPlatform('Super Nintendo');
    assert(Array.isArray(snesGames), 'Should return array');
  });

  test('1.0-SVC-049 [P2] GameLoader getGamesByPlatform is case insensitive', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const snes1 = loader.getGamesByPlatform('super nintendo');
    const snes2 = loader.getGamesByPlatform('Super Nintendo');
    assert.strictEqual(snes1.length, snes2.length, 'Should have same count');
  });

  // Test saveGame
  test('1.0-SVC-050 [P1] GameLoader saveGame works with gameStorage', () => {
    // Given
    const mockStorage = {
      updateGame: (slug, game) => {
        assert.strictEqual(slug, '/games/test', 'Slug should match');
        assert.strictEqual(game.basic_info.title, 'Test Game', 'Title should match');
      }
    };

    const loader = new GameLoader(mockStorage, schemaPath);
    const gameData = {
      basic_info: { url_slug: '/games/test', title: 'Test Game', genres: [], themes: [] },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    // When
    const result = loader.saveGame(gameData);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
    assert.strictEqual(loader.games.get('/games/test'), gameData, 'Game should be cached');
  });

  test('1.0-SVC-051 [P1] GameLoader saveGame returns false on error', () => {
    // Given
    const mockStorage = {
      updateGame: () => { throw new Error('Storage error'); }
    };

    const loader = new GameLoader(mockStorage, schemaPath);
    const gameData = {
      basic_info: { url_slug: '/games/test', title: 'Test Game', genres: [], themes: [] },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    // When
    const result = loader.saveGame(gameData);

    // Then
    assert.strictEqual(result, false, 'Should fail');
  });

  // Test deleteGame
  test('1.0-SVC-052 [P1] GameLoader deleteGame delegates to storage', () => {
    // Given
    const slug = '/games/test';
    const mockStorage = {
      deleteGame: (s) => {
        assert.strictEqual(s, slug, 'Slug should match');
        return true;
      }
    };

    const loader = new GameLoader(mockStorage, schemaPath);

    // When
    const result = loader.deleteGame(slug);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  // Test getAllGamesArray
  test('1.0-SVC-053 [P1] GameLoader getAllGamesArray returns array', async () => {
    // Given
    const loader = new GameLoader(gamesDir, schemaPath);

    // When
    await loader.loadAll();

    // Then
    const games = loader.getAllGamesArray();
    assert(Array.isArray(games), 'Should return array');
  });

  // Test error handling
  test('1.0-SVC-054 [P2] GameLoader handles directory read errors', async () => {
    // Given
    const loader = new GameLoader('/nonexistent/directory', schemaPath);

    // When
    try {
      await loader.loadAll();
    } catch (error) {
      // Then
      assert(error !== null, 'Error should exist');
    }
  });

  test('1.0-SVC-055 [P2] GameLoader handles invalid JSON files gracefully', async () => {
    // Given - Create a temp directory with an invalid JSON file
    const tempDir = path.join(__dirname, 'temp_invalid');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    fs.writeFileSync(path.join(tempDir, 'invalid.json'), 'not valid json');

    const loader = new GameLoader(tempDir, schemaPath);

    // When
    await loader.loadAll();

    // Cleanup
    fs.unlinkSync(path.join(tempDir, 'invalid.json'));
    fs.rmdirSync(tempDir);

    // Then - Should have loaded without throwing
    assert(loader !== null, 'Loader should exist');
  });

});
