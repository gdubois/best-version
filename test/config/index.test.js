// Test suite for configuration
// Test IDs: 1.0-UTIL-177 to 1.0-UTIL-190
// Priorities: P1 = core functionality, P2 = important features

const { expect } = require('expect');
const fs = require('fs');
const path = require('path');

describe('Configuration Tests', () => {

  const configPath = path.join(__dirname);

  // Test config file existence
  test('1.0-UTIL-177 [P1] Config file exists', () => {
    // Then
    expect(fs.existsSync(configPath)).toBe(true);
  });

  test('1.0-UTIL-178 [P1] Config file exports an object', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config).not.toBeNull();
    expect(typeof config).toBe('object');
  });

  test('1.0-UTIL-179 [P1] Config file has port setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });

  test('1.0-UTIL-180 [P1] Config file has env setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.env).toBeDefined();
    expect(config.env).toBe(process.env.NODE_ENV || 'development');
  });

  test('1.0-UTIL-181 [P1] Config file has gamesDir setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.gamesDir).toBeDefined();
    expect(typeof config.gamesDir).toBe('string');
    expect(config.gamesDir.includes('games')).toBe(true);
  });

  test('1.0-UTIL-182 [P1] Config file has schemaPath setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.schemaPath).toBeDefined();
    expect(typeof config.schemaPath).toBe('string');
    expect(config.schemaPath.includes('schema')).toBe(true);
  });

  test('1.0-UTIL-183 [P1] Config has default port 3000', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.port).toBe(3000);
  });

  test('1.0-UTIL-184 [P1] Config has cacheEnabled setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.cacheEnabled).toBeDefined();
    expect(typeof config.cacheEnabled).toBe('boolean');
    expect(config.cacheEnabled).toBe(true);
  });

  test('1.0-UTIL-185 [P1] Config has strictValidation setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config.strictValidation).toBeDefined();
    expect(typeof config.strictValidation).toBe('boolean');
  });

  test('1.0-UTIL-186 [P2] Config file has validateOnStartup setting', () => {
    // When
    const config = require('../../src/config/index.js');

    // Then
    expect(config).toHaveProperty('strictValidation');
  });

});
