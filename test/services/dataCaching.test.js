// Test suite for data caching
// Test IDs: 1.0-SVC-257 to 1.0-SVC-276
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const { DataCache } = require('../../src/services/dataCaching');

describe('Data Cache Tests', () => {

  // Test constructor
  test('1.0-SVC-257 [P1] DataCache initializes with default options', async () => {
    // When creating DataCache
    const cache = new DataCache();

    // Then defaults are set correctly
    assert(cache !== null, 'Cache should be instantiated');
    assert(cache.options.enableMemoryCache === true, 'Memory cache should be enabled');
    assert(cache.options.memoryCacheTTL === 300, 'Default TTL should be 300');
    assert(cache.options.memoryCacheMax === 1000, 'Default max should be 1000');
    assert(cache.memoryCache !== null, 'Memory cache should exist');
  });

  test('1.0-SVC-258 [P1] DataCache initializes with custom options', async () => {
    // Given custom options
    const options = {
      enableMemoryCache: true,
      memoryCacheTTL: 600,
      memoryCacheMax: 500
    };

    // When creating DataCache with custom options
    const cache = new DataCache(options);

    // Then custom options are applied
    assert(cache !== null, 'Cache should be instantiated');
    assert.strictEqual(cache.options.memoryCacheTTL, 600, 'TTL should be 600');
    assert.strictEqual(cache.options.memoryCacheMax, 500, 'Max should be 500');
  });

  // Test set (async)
  test('1.0-SVC-259 [P1] DataCache.set stores value', async () => {
    // Given DataCache instance
    const cache = new DataCache();

    // When setting a value
    const result = await cache.set('test-key', 'test-value');

    // Then value is stored
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-260 [P1] DataCache.set handles complex values', async () => {
    // Given DataCache instance
    const cache = new DataCache();
    const obj = { games: ['game1', 'game2'], count: 2 };

    // When storing complex object
    const result = await cache.set('test-key', obj);

    // Then object is stored
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-261 [P1] DataCache.set handles numbers', async () => {
    // Given DataCache instance
    const cache = new DataCache();

    // When setting numeric value
    const result = await cache.set('counter', 42);

    // Then value is stored
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-262 [P1] DataCache.set handles booleans', async () => {
    // Given DataCache instance
    const cache = new DataCache();

    // When setting boolean value
    const result = await cache.set('flag', true);

    // Then value is stored
    assert.strictEqual(result, true, 'Should succeed');
  });

  // Test get (async)
  test('1.0-SVC-263 [P1] DataCache.get retrieves value', async () => {
    // Given DataCache with stored value
    const cache = new DataCache();
    await cache.set('test-key', 'test-value');

    // When retrieving value
    const result = await cache.get('test-key');

    // Then correct value is returned
    assert.strictEqual(result, 'test-value', 'Should return stored value');
  });

  test('1.0-SVC-264 [P2] DataCache.get returns null for missing key', async () => {
    // Given DataCache instance
    const cache = new DataCache();

    // When getting non-existent key
    const result = await cache.get('non-existent-key');

    // Then returns null
    assert.strictEqual(result, null, 'Should return null');
  });

  test('1.0-SVC-265 [P2] DataCache.get handles expired key', async () => {
    // Given DataCache with short TTL
    const cache = new DataCache({ memoryCacheTTL: 1, memoryCacheMax: 100 });
    await cache.set('temp-key', 'temp-value');
    await new Promise(resolve => setTimeout(resolve, 1100));

    // When getting expired key
    const result = await cache.get('temp-key');

    // Then returns null
    assert.strictEqual(result, null, 'Expired key should return null');
  });

  // Test delete (async)
  test('1.0-SVC-266 [P1] DataCache.delete removes key', async () => {
    // Given DataCache with stored value
    const cache = new DataCache();
    await cache.set('test-key', 'test-value');

    // When deleting key
    const result = await cache.delete('test-key');

    // Then key is removed
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-267 [P2] DataCache.delete returns false for missing key', async () => {
    // Given DataCache instance
    const cache = new DataCache();

    // When deleting non-existent key
    const result = await cache.delete('non-existent-key');

    // Then returns false
    assert.strictEqual(result, false, 'Should return false');
  });

  // Test clear (async)
  test('1.0-SVC-268 [P1] DataCache.clear removes all keys', async () => {
    // Given DataCache with multiple keys
    const cache = new DataCache();
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    // When clearing cache
    const result = await cache.clear();

    // Then all keys are removed
    assert.strictEqual(result, true, 'Should succeed');
    assert.strictEqual(await cache.get('key1'), null, 'key1 should be cleared');
    assert.strictEqual(await cache.get('key2'), null, 'key2 should be cleared');
    assert.strictEqual(await cache.get('key3'), null, 'key3 should be cleared');
  });

  // Test getStats
  test('1.0-SVC-269 [P2] DataCache.getStats returns empty stats when no memory cache', async () => {
    // Given DataCache with memory cache disabled
    const cache = new DataCache({ enableMemoryCache: false });

    // When getting stats
    const stats = cache.getStats();

    // Then returns empty memory stats
    assert(stats !== null, 'Stats should exist');
    assert(typeof stats.memory === 'undefined', 'Memory should be undefined');
  });

  // Test TTL
  test('1.0-SVC-270 [P2] DataCache respects TTL', async () => {
    // Given DataCache with short TTL
    const cache = new DataCache({ memoryCacheTTL: 1, memoryCacheMax: 100 });
    await cache.set('temp-key', 'temp-value');

    // When getting value immediately
    const value1 = await cache.get('temp-key');

    // Then value exists
    assert.strictEqual(value1, 'temp-value', 'Value should exist');

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    // When getting value after expiry
    const value2 = await cache.get('temp-key');

    // Then value is expired
    assert.strictEqual(value2, null, 'Value should be expired');
  });

  test('1.0-SVC-271 [P2] DataCache.set with explicit TTL', async () => {
    // Given DataCache with long default TTL
    const cache = new DataCache({ memoryCacheTTL: 3600, memoryCacheMax: 100 });

    // When setting with custom TTL
    const result = await cache.set('custom-ttl', 'value', 60);

    // Then value is set
    assert.strictEqual(result, true, 'Should succeed');
    const value = await cache.get('custom-ttl');
    assert.strictEqual(value, 'value', 'Value should match');
  });

  // Test invalidateGame
  test('1.0-SVC-272 [P1] DataCache.invalidateGame invalidates game cache', async () => {
    // Given DataCache with cached game
    const cache = new DataCache();
    const testValue = { title: 'Pokemon Emerald' };
    await cache.set('game:pokemon-emerald', testValue);
    const cached1 = await cache.get('game:pokemon-emerald');
    assert(cached1 !== null, 'Should be cached');

    // When invalidating game cache
    await cache.invalidateGame('pokemon-emerald');

    // Then cache is cleared
    const cached2 = await cache.get('game:pokemon-emerald');
    assert.strictEqual(cached2, null, 'Cache should be cleared');
    const cached3 = await cache.get('game:slug:pokemon-emerald');
    assert.strictEqual(cached3, null, 'Slug cache should be cleared');
  });

  // Test invalidateSearch
  test('1.0-SVC-273 [P1] DataCache.invalidateSearch invalidates search cache', async () => {
    // Given DataCache with cached search
    const cache = new DataCache();
    const testValue = ['Final Fantasy'];
    await cache.set('search:final fantasy', testValue);
    const cached1 = await cache.get('search:final fantasy');
    assert(cached1 !== null, 'Should be cached');

    // When invalidating search cache
    await cache.invalidateSearch('final fantasy');

    // Then cache is cleared
    const cached2 = await cache.get('search:final fantasy');
    assert.strictEqual(cached2, null, 'Cache should be cleared');
    const cached3 = await cache.get('search:roman:final fantasy');
    assert.strictEqual(cached3, null, 'Roman cache should be cleared');
  });

  // Test getGameBySlug with caching
  test('1.0-SVC-274 [P1] DataCache.getGameBySlug caches results', async () => {
    // Given DataCache with mock storage
    const cache = new DataCache();
    const mockStorage = {
      getGameBySlug: (slug) => ({ basic_info: { title: 'Test Game', url_slug: slug } })
    };

    // When calling getGameBySlug twice
    const result1 = await cache.getGameBySlug(mockStorage, 'test-game');
    assert.strictEqual(result1.basic_info.title, 'Test Game', 'Title should match');

    // Then second call returns cached value
    const result2 = await cache.getGameBySlug(mockStorage, 'test-game');
    assert.strictEqual(result2.basic_info.title, 'Test Game', 'Title should match');
  });

  // Test searchGames with caching
  test('1.0-SVC-275 [P1] DataCache.searchGames caches results', async () => {
    // Given DataCache with mock storage
    const cache = new DataCache();
    const mockStorage = {
      searchGames: (term) => [{ title: 'Game Found' }]
    };

    // When calling searchGames twice
    const result1 = await cache.searchGames(mockStorage, 'test search');
    assert.strictEqual(result1[0].title, 'Game Found', 'Title should match');

    // Then second call returns cached value
    const result2 = await cache.searchGames(mockStorage, 'test search');
    assert.strictEqual(result2[0].title, 'Game Found', 'Title should match');
  });

  // Test getAllGames with caching
  test('1.0-SVC-276 [P1] DataCache.getAllGames caches results', async () => {
    // Given DataCache with mock storage
    const cache = new DataCache();
    const mockStorage = {
      getAllGames: () => [{ basic_info: { title: 'Game 1' } }, { basic_info: { title: 'Game 2' } }]
    };

    // When calling getAllGames twice
    const result1 = await cache.getAllGames(mockStorage);
    assert.strictEqual(result1.length, 2, 'Should have 2 games');

    // Then second call returns cached value
    const result2 = await cache.getAllGames(mockStorage);
    assert.strictEqual(result2.length, 2, 'Should have 2 games');
  });

});
