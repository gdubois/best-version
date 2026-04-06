// Test suite for Game Metadata Application

const assert = require('assert');
const path = require('path');

// Import modules
const { GameLoader } = require('../src/services/gameLoader');
const { GameAPI } = require('../src/services/gameAPI');
const { JsonSchemaValidator } = require('../src/utils/validators');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n=== Game Metadata Application Tests ===\n');

  // Test 1: GameLoader initialization
  test('GameLoader can be initialized', () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    assert(loader !== null);
    assert(loader.games instanceof Map);
  });

  // Test 2: GameLoader loads games
  test('GameLoader loads all game files', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    await loader.loadAll();
    assert(loader.getGameCount() > 0, 'Should load at least one game');
  });

  // Test 3: Get all games
  test('GameLoader can retrieve all games', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    await loader.loadAll();
    const games = loader.getAllGames();
    assert(Array.isArray(games));
    assert(games.length > 0);
  });

  // Test 4: Get game by slug
  test('GameLoader can get game by slug', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    await loader.loadAll();
    const game = loader.getGameBySlug('/games/pokemon-emerald');
    assert(game !== null, 'Should find pokemon-emerald game');
    assert(game.basic_info.title.includes('Emerald'));
  });

  // Test 5: Search by title
  test('GameAPI can search games by title', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    const api = new GameAPI(loader);
    await api.init();
    const results = api.searchByTitle('Final Fantasy');
    assert(results.length > 0, 'Should find Final Fantasy games');
  });

  // Test 6: Get games by genre
  test('GameAPI can get games by genre', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    const api = new GameAPI(loader);
    await api.init();
    const rpgGames = api.getGamesByGenre('RPG');
    assert(rpgGames.length > 0, 'Should find RPG games');
  });

  // Test 7: Get similar games
  test('GameAPI can find similar games', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    const api = new GameAPI(loader);
    await api.init();
    const similar = api.getSimilarGames('/games/pokemon-emerald', 3);
    assert(Array.isArray(similar));
    assert(similar.length <= 3, 'Should return at most 3 similar games');
  });

  // Test 8: Get unique filters
  test('GameAPI can get unique genres', async () => {
    const loader = new GameLoader(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../game_metadata_schema.json')
    );
    const api = new GameAPI(loader);
    await api.init();
    const genres = api.getUniqueGenres();
    assert(Array.isArray(genres));
    assert(genres.length > 0, 'Should have at least one genre');
  });

  // Test 9: Validator loads schema
  test('JsonSchemaValidator can load schema', () => {
    const validator = new JsonSchemaValidator(
      path.join(__dirname, '../game_metadata_schema.json')
    );
    const result = validator.loadSchema();
    assert(result === true, 'Should load schema successfully');
  });

  // Test 10: Validator validates valid data
  test('JsonSchemaValidator validates valid game data', () => {
    const validator = new JsonSchemaValidator(
      path.join(__dirname, '../game_metadata_schema.json')
    );
    validator.loadSchema();

    const validData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: ['RPG'],
        themes: ['Adventure']
      },
      release: {
        platforms: []
      },
      serie: {
        is_part_of_serie: false
      },
      similar_games: []
    };

    const result = validator.validate(validData);
    assert(result === true, 'Should validate valid data');
  });

  // Test 11: Validator rejects invalid data
  test('JsonSchemaValidator rejects invalid data', () => {
    const validator = new JsonSchemaValidator(
      path.join(__dirname, '../game_metadata_schema.json')
    );
    validator.loadSchema();

    const invalidData = {
      basic_info: {}, // Missing required fields
      release: {},
      serie: {},
      similar_games: {}
    };

    const result = validator.validate(invalidData);
    assert(result === false, 'Should reject invalid data');
  });

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log('\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
