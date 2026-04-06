// Test suite for cache service
// Test IDs: 1.0-SVC-158 to 1.0-SVC-173
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const { CacheService } = require('../../src/services/cacheService');

describe('Cache Service Tests', () => {

  // Test constructor
  test('1.0-SVC-158 [P1] CacheService initializes with default options', () => {
    // When
    const cache = new CacheService();

    // Then
    assert(cache !== null, 'Cache should be instantiated');
  });

  test('1.0-SVC-159 [P1] CacheService initializes with custom options', () => {
    // Given
    const options = { ttl: 600, max: 500 };

    // When
    const cache = new CacheService(options);

    // Then
    assert(cache !== null, 'Cache should be instantiated');
  });

  // Test set
  test('1.0-SVC-160 [P1] CacheService.set stores value', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.set('test-key', 'test-value');

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-161 [P1] CacheService.set handles null values', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.set('test-key', null);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-162 [P1] CacheService.set handles undefined values', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.set('test-key', undefined);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-163 [P1] CacheService.set handles complex objects', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] };

    // When
    const result = cache.set('test-key', obj);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-164 [P1] CacheService.set with explicit TTL', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.set('test-key', 'test-value', 30);

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  // Test get
  test('1.0-SVC-165 [P1] CacheService.get retrieves value', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    cache.set('test-key', 'test-value');

    // When
    const result = cache.get('test-key');

    // Then
    assert.strictEqual(result, 'test-value', 'Should return stored value');
  });

  test('1.0-SVC-166 [P1] CacheService.get returns null for missing key', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.get('non-existent-key');

    // Then
    assert.strictEqual(result, null, 'Should return null');
  });

  test('1.0-SVC-167 [P2] CacheService.get handles expired key', async () => {
    // Given
    const cache = new CacheService({ ttl: 1, max: 100 });
    cache.set('temp-key', 'temp-value');

    // When - wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    const result = cache.get('temp-key');

    // Then
    assert.strictEqual(result, null, 'Expired key should return null');
  });

  // Test delete
  test('1.0-SVC-168 [P1] CacheService.delete removes key', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    cache.set('test-key', 'test-value');

    // When
    const result = cache.delete('test-key');

    // Then
    assert.strictEqual(result, true, 'Should succeed');
  });

  test('1.0-SVC-169 [P1] CacheService.delete returns false for missing key', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.delete('non-existent-key');

    // Then
    assert.strictEqual(result, false, 'Should return false');
  });

  // Test clear
  test('1.0-SVC-170 [P1] CacheService.clear removes all keys', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // When
    const result = cache.clear();

    // Then
    assert.strictEqual(result, true, 'Should succeed');
    assert.strictEqual(cache.get('key1'), null, 'key1 should be cleared');
    assert.strictEqual(cache.get('key2'), null, 'key2 should be cleared');
    assert.strictEqual(cache.get('key3'), null, 'key3 should be cleared');
  });

  // Test has
  test('1.0-SVC-171 [P1] CacheService.has returns true for existing key', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    cache.set('test-key', 'test-value');

    // When
    const result = cache.has('test-key');

    // Then
    assert.strictEqual(result, true, 'Should return true');
  });

  test('1.0-SVC-172 [P1] CacheService.has returns false for missing key', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });

    // When
    const result = cache.has('non-existent-key');

    // Then
    assert.strictEqual(result, false, 'Should return false');
  });

  // Test increment
  test('1.0-SVC-173 [P1] CacheService.increment increases numeric value', () => {
    // Given
    const cache = new CacheService({ ttl: 60, max: 100 });
    cache.set('counter', 0);

    // When
    const result = cache.increment('counter');

    // Then
    assert.strictEqual(result, 1, 'Result should be 1');
    assert.strictEqual(cache.get('counter'), 1, 'Value should be 1');
  });

});
