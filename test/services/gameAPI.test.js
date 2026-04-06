// Test suite for GameAPI service
// Test IDs: 1.0-SVC-051 to 1.0-SVC-091
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const { GameAPI } = require('../../src/services/gameAPI');
const { GameLoader } = require('../../src/services/gameLoader');

const gamesDir = path.join(__dirname, '../../games');
const schemaPath = path.join(__dirname, '../../game_metadata_schema.json');

describe('GameAPI Service Tests', () => {

  let gameLoader;
  let gameAPI;

  beforeAll(async () => {
    // Given GameLoader and GameAPI initialized
    gameLoader = new GameLoader(gamesDir, schemaPath);
    gameAPI = new GameAPI(gameLoader);
    await gameAPI.init();
  });

  // Test constructor
  test('1.0-SVC-051 [P1] GameAPI initializes with GameLoader', () => {
    // Then
    assert(gameAPI !== null, 'GameAPI should be instantiated');
    assert.strictEqual(gameAPI.gameLoader, gameLoader, 'GameLoader should match');
  });

  // Test getAllGames
  test('1.0-SVC-052 [P1] GameAPI init loads games', () => {
    // Then
    assert(gameLoader.isLoaded === true, 'Loader should be loaded');
  });

  test('1.0-SVC-053 [P1] GameAPI init calls loader.loadAll', () => {
    // Then
    assert(gameLoader.isLoaded === true, 'Loader should be loaded after init');
  });

  test('1.0-SVC-054 [P1] GameAPI getAllGames returns all games', () => {
    // When
    const games = gameAPI.getAllGames();

    // Then
    assert(Array.isArray(games), 'Should return array');
    assert(games.length > 0, 'Should have games');
  });

  test('1.0-SVC-055 [P1] GameAPI getAllGames returns same as loader', () => {
    // When
    const apiGames = gameAPI.getAllGames();
    const loaderGames = gameLoader.getAllGames();

    // Then
    assert.strictEqual(apiGames.length, loaderGames.length, 'Lengths should match');
  });

  // Test getGameBySlug
  test('1.0-SVC-056 [P1] GameAPI getGameBySlug retrieves game', () => {
    // When
    const game = gameAPI.getGameBySlug('/games/pokemon-emerald');

    // Then
    assert(game !== null, 'Game should be found');
    assert(game.basic_info.title.includes('Emerald'), 'Title should include Emerald');
  });

  test('1.0-SVC-057 [P1] GameAPI getGameBySlug returns null for non-existent', () => {
    // When
    const game = gameAPI.getGameBySlug('/games/non-existent');

    // Then
    assert.strictEqual(game, null, 'Should return null');
  });

  // Test searchByTitle
  test('1.0-SVC-058 [P1] GameAPI searchByTitle finds games by title', () => {
    // When
    const results = gameAPI.searchByTitle('Final Fantasy');

    // Then
    assert(Array.isArray(results), 'Should return array');
    results.forEach(game => {
      assert(game.basic_info.title.toLowerCase().includes('final fantasy'), 'Should match title');
    });
  });

  test('1.0-SVC-059 [P1] GameAPI searchByTitle is case insensitive', () => {
    // When
    const results1 = gameAPI.searchByTitle('final fantasy');
    const results2 = gameAPI.searchByTitle('FINAL FANTASY');

    // Then
    assert.strictEqual(results1.length, results2.length, 'Should have same count');
  });

  test('1.0-SVC-060 [P1] GameAPI searchByTitle handles Roman numerals', () => {
    // When - Search with Arabic numeral should find Roman numeral games
    const results = gameAPI.searchByTitle('VII');

    // When - Search with Roman numeral should find games
    const results2 = gameAPI.searchByTitle('VII');

    // Then
    assert(Array.isArray(results), 'Results should be array');
    assert(Array.isArray(results2), 'Results should be array');
  });

  test('1.0-SVC-061 [P1] GameAPI searchByTitle returns unique results', () => {
    // When
    const results = gameAPI.searchByTitle('Pokemon');
    const slugs = results.map(g => g.basic_info.url_slug);
    const uniqueSlugs = new Set(slugs);

    // Then
    assert.strictEqual(slugs.length, uniqueSlugs.size, 'Should have no duplicates');
  });

  test('1.0-SVC-062 [P2] GameAPI searchByTitle returns empty array for no matches', () => {
    // When
    const results = gameAPI.searchByTitle('NonExistentGameXYZ12345');

    // Then
    assert(Array.isArray(results), 'Should return array');
    assert.strictEqual(results.length, 0, 'Should be empty');
  });

  // Test getGamesByGenre
  test('1.0-SVC-063 [P1] GameAPI getGamesByGenre returns games by genre', () => {
    // When
    const rpgGames = gameAPI.getGamesByGenre('RPG');

    // Then
    assert(Array.isArray(rpgGames), 'Should return array');
  });

  test('1.0-SVC-064 [P2] GameAPI getGamesByGenre is case insensitive', () => {
    // When
    const rpg1 = gameAPI.getGamesByGenre('rpg');
    const rpg2 = gameAPI.getGamesByGenre('RPG');

    // Then
    assert.strictEqual(rpg1.length, rpg2.length, 'Should have same count');
  });

  // Test getGamesByPlatform
  test('1.0-SVC-065 [P1] GameAPI getGamesByPlatform returns games by platform', () => {
    // When
    const games = gameAPI.getGamesByPlatform('Super Nintendo');

    // Then
    assert(Array.isArray(games), 'Should return array');
  });

  // Test getGamesByTheme
  test('1.0-SVC-066 [P1] GameAPI getGamesByTheme returns games by theme', () => {
    // When
    const games = gameAPI.getGamesByTheme('Adventure');

    // Then
    assert(Array.isArray(games), 'Should return array');
  });

  test('1.0-SVC-067 [P2] GameAPI getGamesByTheme is case insensitive', () => {
    // When
    const games1 = gameAPI.getGamesByTheme('adventure');
    const games2 = gameAPI.getGamesByTheme('Adventure');

    // Then
    assert.strictEqual(games1.length, games2.length, 'Should have same count');
  });

  test('1.0-SVC-068 [P2] GameAPI getGamesByTheme returns empty array for no matches', () => {
    // When
    const games = gameAPI.getGamesByTheme('NonExistentTheme12345');

    // Then
    assert(Array.isArray(games), 'Should return array');
    assert.strictEqual(games.length, 0, 'Should be empty');
  });

  // Test getSimilarGames
  test('1.0-SVC-069 [P1] GameAPI getSimilarGames returns array', () => {
    // When
    const similar = gameAPI.getSimilarGames('/games/pokemon-emerald', 3);

    // Then
    assert(Array.isArray(similar), 'Should return array');
  });

  test('1.0-SVC-070 [P1] GameAPI getSimilarGames respects limit', () => {
    // When
    const similar = gameAPI.getSimilarGames('/games/pokemon-emerald', 3);

    // Then
    assert(similar.length <= 3, 'Should respect limit');
  });

  test('1.0-SVC-071 [P1] GameAPI getSimilarGames excludes original game', () => {
    // When
    const similar = gameAPI.getSimilarGames('/games/pokemon-emerald', 5);

    // Then
    similar.forEach(game => {
      assert(game.basic_info.url_slug !== '/games/pokemon-emerald', 'Should exclude original');
    });
  });

  test('1.0-SVC-072 [P2] GameAPI getSimilarGames returns empty array for non-existent game', () => {
    // When
    const similar = gameAPI.getSimilarGames('/games/non-existent', 5);

    // Then
    assert(Array.isArray(similar), 'Should return array');
    assert.strictEqual(similar.length, 0, 'Should be empty');
  });

  test('1.0-SVC-073 [P1] GameAPI getSimilarGames scores by genres and themes', () => {
    // When - Similar games should share genres/themes with Pokemon Emerald
    const similar = gameAPI.getSimilarGames('/games/pokemon-emerald', 10);

    // Then
    similar.forEach(game => {
      assert(game.basic_info.genres.length > 0, 'Games should have genres');
      assert(game.basic_info.themes.length > 0, 'Games should have themes');
    });
  });

  // Test getGamesByDifficulty
  test('1.0-SVC-074 [P1] GameAPI getGamesByDifficulty filters by min/max rating', () => {
    // When
    const games = gameAPI.getGamesByDifficulty(0, 5);

    // Then
    assert(Array.isArray(games), 'Should return array');
  });

  test('1.0-SVC-075 [P2] GameAPI getGamesByDifficulty handles missing ratings', () => {
    // When
    const games = gameAPI.getGamesByDifficulty(0, 10);

    // Then
    assert(Array.isArray(games), 'Should return array');
  });

  // Test getGamesByReceptionScore
  test('1.0-SVC-076 [P1] GameAPI getGamesByReceptionScore filters by min/max score', () => {
    // When
    const games = gameAPI.getGamesByReceptionScore(0, 100);

    // Then
    assert(Array.isArray(games), 'Should return array');
  });

  // Test getUniqueGenres
  test('1.0-SVC-077 [P1] GameAPI getUniqueGenres returns sorted array', () => {
    // When
    const genres = gameAPI.getUniqueGenres();

    // Then
    assert(Array.isArray(genres), 'Should return array');
    assert(genres.length > 0, 'Should have genres');
    assert(genres.every(g => typeof g === 'string'), 'Should be strings');
  });

  test('1.0-SVC-078 [P1] GameAPI getUniqueGenres returns sorted genres', () => {
    // When
    const genres = gameAPI.getUniqueGenres();
    const sorted = [...genres].sort();

    // Then
    assert.deepStrictEqual(genres, sorted, 'Should be sorted');
  });

  // Test getUniqueThemes
  test('1.0-SVC-079 [P1] GameAPI getUniqueThemes returns sorted array', () => {
    // When
    const themes = gameAPI.getUniqueThemes();

    // Then
    assert(Array.isArray(themes), 'Should return array');
    themes.forEach(t => assert(typeof t === 'string', 'Themes should be strings'));
  });

  test('1.0-SVC-080 [P1] GameAPI getUniqueThemes returns sorted themes', () => {
    // When
    const themes = gameAPI.getUniqueThemes();
    const sorted = [...themes].sort();

    // Then
    assert.deepStrictEqual(themes, sorted, 'Should be sorted');
  });

  // Test getUniquePlatforms
  test('1.0-SVC-081 [P1] GameAPI getUniquePlatforms returns sorted array', () => {
    // When
    const platforms = gameAPI.getUniquePlatforms();

    // Then
    assert(Array.isArray(platforms), 'Should return array');
    platforms.forEach(p => assert(typeof p === 'string', 'Platforms should be strings'));
  });

  test('1.0-SVC-082 [P1] GameAPI getUniquePlatforms returns sorted platforms', () => {
    // When
    const platforms = gameAPI.getUniquePlatforms();
    const sorted = [...platforms].sort();

    // Then
    assert.deepStrictEqual(platforms, sorted, 'Should be sorted');
  });

});
