// Test suite for JSON Schema Validator
// Test IDs: 1.0-UTIL-030 to 1.0-UTIL-052
// Priorities: P1 = core functionality, P2 = validation rules

const { expect } = require('expect');
const path = require('path');
const { JsonSchemaValidator } = require('../../src/utils/validators');
const { createValidGame, createInvalidGame } = require('../fixtures/game.fixture');

const schemaPath = path.join(__dirname, '../../game_metadata_schema.json');

describe('JSON Schema Validator Tests', () => {

  // Test constructor and schema loading
  test('1.0-UTIL-030 [P1] JsonSchemaValidator initializes with schema path', () => {
    // Given validator instance
    const validator = new JsonSchemaValidator(schemaPath);

    // Then properties are correctly initialized
    expect(validator).not.toBeNull();
    expect(validator.schemaPath).toBe(schemaPath);
    expect(validator.schema).toBeNull();
  });

  test('1.0-UTIL-031 [P1] JsonSchemaValidator loads schema successfully', () => {
    // Given validator with schema path
    const validator = new JsonSchemaValidator(schemaPath);

    // When loading schema
    const result = validator.loadSchema();

    // Then schema is loaded
    expect(result).toBe(true);
    expect(validator.schema).not.toBeNull();
    expect(validator.schema.type).toBe('object');
  });

  test('1.0-UTIL-032 [P2] JsonSchemaValidator handles missing schema file', () => {
    // Given validator with non-existent path
    const validator = new JsonSchemaValidator('/nonexistent/path/schema.json');

    // When loading
    const result = validator.loadSchema();

    // Then returns false and schema is null
    expect(result).toBe(false);
    expect(validator.schema).toBeNull();
  });

  // Test validate method - general validation
  test('1.0-UTIL-033 [P1] JsonSchemaValidator validates complete valid data', () => {
    // Given valid game data using fixture
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const validData = createValidGame();

    // When validating
    const result = validator.validate(validData);

    // Then passes validation
    expect(result).toBe(true);
    expect(validator.getErrors().length).toBe(0);
  });

  test('1.0-UTIL-034 [P1] JsonSchemaValidator rejects non-object data', () => {
    // Given validator
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    // When validating non-object types
    expect(validator.validate(null)).toBe(false);
    expect(validator.validate('string')).toBe(false);
    expect(validator.validate(123)).toBe(false);
    expect(validator.validate([])).toBe(false);
  });

  test('1.0-UTIL-035 [P1] JsonSchemaValidator requires top-level properties', () => {
    // Given incomplete data using fixture
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = createInvalidGame();

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    const errors = validator.getErrors();
    expect(errors.some(e => e.includes('basic_info'))).toBe(true);
    expect(errors.some(e => e.includes('release'))).toBe(true);
    expect(errors.some(e => e.includes('serie'))).toBe(true);
    expect(errors.some(e => e.includes('similar_games'))).toBe(true);
  });

  // Test validateBasicInfo
  test('1.0-UTIL-036 [P1] JsonSchemaValidator validates basic_info structure', () => {
    // Given valid basic_info
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const validData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: ['RPG', 'Action'],
        themes: ['Adventure', 'Fantasy']
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    expect(validator.validate(validData)).toBe(true);
  });

  test('1.0-UTIL-037 [P2] JsonSchemaValidator requires basic_info.url_slug', () => {
    // Given missing url_slug
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        title: 'Test Game',
        genres: [],
        themes: []
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('url_slug'))).toBe(true);
  });

  test('1.0-UTIL-038 [P2] JsonSchemaValidator requires basic_info.title', () => {
    // Given missing title
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        genres: [],
        themes: []
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('title'))).toBe(true);
  });

  test('1.0-UTIL-039 [P2] JsonSchemaValidator requires basic_info.genres', () => {
    // Given missing genres
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        themes: []
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('genres'))).toBe(true);
  });

  test('1.0-UTIL-040 [P2] JsonSchemaValidator requires basic_info.themes', () => {
    // Given missing themes
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: []
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('themes'))).toBe(true);
  });

  test('1.0-UTIL-041 [P2] JsonSchemaValidator validates genres as array', () => {
    // Given genres as string instead of array
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: 'RPG',
        themes: []
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('genres must be an array'))).toBe(true);
  });

  test('1.0-UTIL-042 [P2] JsonSchemaValidator validates themes as array', () => {
    // Given themes as string instead of array
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: 'Adventure'
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('themes must be an array'))).toBe(true);
  });

  // Test modes validation
  test('1.0-UTIL-043 [P2] JsonSchemaValidator validates modes object', () => {
    // Given valid modes
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const validData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: [],
        modes: {
          single_player: true,
          multiplayer_local: false,
          multiplayer_online: false,
          co_op: true
        }
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    expect(validator.validate(validData)).toBe(true);
  });

  test('1.0-UTIL-044 [P2] JsonSchemaValidator validates modes boolean values', () => {
    // Given invalid mode values
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: [],
        modes: {
          single_player: true,
          multiplayer_local: 'yes',
          multiplayer_online: 1,
          co_op: true
        }
      },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    const errors = validator.getErrors();
    expect(errors.some(e => e.includes('multiplayer_local'))).toBe(true);
    expect(errors.some(e => e.includes('multiplayer_online'))).toBe(true);
  });

  // Test validateRelease
  test('1.0-UTIL-045 [P1] JsonSchemaValidator validates release structure', () => {
    // Given valid release data
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const validData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: []
      },
      release: {
        platforms: [
          {
            name: 'Super Nintendo',
            region: 'Japan',
            release_date: '1996-04-26'
          }
        ]
      },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    expect(validator.validate(validData)).toBe(true);
  });

  test('1.0-UTIL-046 [P2] JsonSchemaValidator validates platforms as array', () => {
    // Given platforms as string
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: []
      },
      release: { platforms: 'Super Nintendo' },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    expect(validator.getErrors().some(e => e.includes('platforms must be an array'))).toBe(true);
  });

  test('1.0-UTIL-047 [P2] JsonSchemaValidator requires platform properties', () => {
    // Given incomplete platform data
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: []
      },
      release: {
        platforms: [{ /* Missing name, region, release_date */ }]
      },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    const errors = validator.getErrors();
    expect(errors.some(e => e.includes('platforms[0].name'))).toBe(true);
    expect(errors.some(e => e.includes('platforms[0].region'))).toBe(true);
    expect(errors.some(e => e.includes('platforms[0].release_date'))).toBe(true);
  });

  test('1.0-UTIL-048 [P2] JsonSchemaValidator validates platform with partial data', () => {
    // Given partial platform data
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    const invalidData = {
      basic_info: {
        url_slug: '/games/test',
        title: 'Test Game',
        genres: [],
        themes: []
      },
      release: {
        platforms: [
          {
            name: 'Super Nintendo',
            region: 'Japan',
            release_date: '1996-04-26'
          },
          {
            name: 'Super Nintendo'
            // Missing region and release_date
          }
        ]
      },
      serie: { is_part_of_serie: false },
      similar_games: []
    };

    const result = validator.validate(invalidData);
    expect(result).toBe(false);
    const errors = validator.getErrors();
    expect(errors.some(e => e.includes('platforms[1].region'))).toBe(true);
    expect(errors.some(e => e.includes('platforms[1].release_date'))).toBe(true);
  });

  // Test getErrors method
  test('1.0-UTIL-049 [P1] JsonSchemaValidator getErrors returns error array', () => {
    // Given validator with validation errors
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    validator.validate({ invalid: 'data' });
    const errors = validator.getErrors();
    expect(Array.isArray(errors)).toBe(true);
  });

  test('1.0-UTIL-050 [P1] JsonSchemaValidator getErrors returns empty array on valid data', () => {
    // Given valid data
    const validator = new JsonSchemaValidator(schemaPath);
    validator.loadSchema();

    validator.validate({
      basic_info: { url_slug: '/games/test', title: 'Test', genres: [], themes: [] },
      release: { platforms: [] },
      serie: { is_part_of_serie: false },
      similar_games: []
    });
    const errors = validator.getErrors();
    expect(errors.length).toBe(0);
  });

});
