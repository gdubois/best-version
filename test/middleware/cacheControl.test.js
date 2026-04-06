// Test suite for cache control middleware
// Test IDs: 1.0-MW-085 to 1.0-MW-098
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const { getCacheConfig, cacheControlMiddleware } = require('../../src/middleware/cacheControl');

// Helper to create mock request object
function createMockReq(path, method = 'GET') {
  return {
    path,
    method,
    url: path
  };
}

// Helper to create mock response object
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    set: function(name, value) {
      this.headers[name] = value;
    },
    get: function(name) {
      return this.headers[name];
    }
  };
  return res;
}

describe('Cache Control Middleware Tests', () => {

  // Test getCacheConfig
  test('1.0-MW-085 [P1] getCacheConfig returns long cache for images', () => {
    // When
    const config = getCacheConfig('image/png');

    // Then
    assert.strictEqual(config.maxAge, 604800, 'Max age should be 1 week');
    assert.strictEqual(config.mustRevalidate, false, 'Should not require revalidation');
  });

  test('1.0-MW-086 [P1] getCacheConfig returns long cache for CSS', () => {
    // When
    const config = getCacheConfig('text/css');

    // Then
    assert.strictEqual(config.maxAge, 604800, 'Max age should be 1 week');
  });

  test('1.0-MW-087 [P1] getCacheConfig returns long cache for JavaScript', () => {
    // When
    const config1 = getCacheConfig('text/javascript');
    const config2 = getCacheConfig('application/javascript');

    // Then
    assert.strictEqual(config1.maxAge, 604800, 'Text JS max age should be 1 week');
    assert.strictEqual(config2.maxAge, 604800, 'Application JS max age should be 1 week');
  });

  test('1.0-MW-088 [P1] getCacheConfig returns long cache for fonts', () => {
    // When
    const config = getCacheConfig('font/woff2');

    // Then
    assert.strictEqual(config.maxAge, 604800, 'Max age should be 1 week');
  });

  test('1.0-MW-089 [P1] getCacheConfig returns short cache for JSON', () => {
    // When
    const config = getCacheConfig('application/json');

    // Then
    assert.strictEqual(config.maxAge, 300, 'Max age should be 5 minutes');
    assert.strictEqual(config.mustRevalidate, true, 'Should require revalidation');
  });

  test('1.0-MW-090 [P1] getCacheConfig returns no cache for HTML', () => {
    // When
    const config = getCacheConfig('text/html');

    // Then
    assert.strictEqual(config.maxAge, 0, 'Max age should be 0');
    assert.strictEqual(config.noCache, true, 'Should have noCache flag');
  });

  test('1.0-MW-091 [P2] getCacheConfig returns default for unknown types', () => {
    // When
    const config = getCacheConfig('application/xml');

    // Then
    assert.strictEqual(config.maxAge, 300, 'Max age should be 5 minutes');
    assert.strictEqual(config.mustRevalidate, true, 'Should require revalidation');
  });

  test('1.0-MW-092 [P2] getCacheConfig handles partial content type matching', () => {
    // When
    const config1 = getCacheConfig('image/jpeg');
    const config2 = getCacheConfig('image/gif');

    // Then
    assert.strictEqual(config1.maxAge, 604800, 'JPEG max age should be 1 week');
    assert.strictEqual(config2.maxAge, 604800, 'GIF max age should be 1 week');
  });

  // Test cacheControlMiddleware
  test('1.0-MW-093 [P1] cacheControlMiddleware applies to static asset paths', () => {
    // Given
    const req = createMockReq('/static/app.js');
    const res = createMockRes();
    res.set('Content-Type', 'application/javascript');
    let nextCalled = false;

    // When
    cacheControlMiddleware(req, res, () => { nextCalled = true; });

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
    assert(res.headers['Cache-Control'] !== undefined, 'Cache-Control header should be set');
  });

  test('1.0-MW-094 [P1] cacheControlMiddleware applies to image paths', () => {
    // Given
    const req = createMockReq('/images/logo.png');
    const res = createMockRes();
    res.set('Content-Type', 'image/png');
    let nextCalled = false;

    // When
    cacheControlMiddleware(req, res, () => { nextCalled = true; });

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
    assert(res.headers['Cache-Control'] !== undefined, 'Cache-Control header should be set');
  });

  test('1.0-MW-095 [P1] cacheControlMiddleware applies to CSS paths', () => {
    // Given
    const req = createMockReq('/css/styles.css');
    const res = createMockRes();
    res.set('Content-Type', 'text/css');
    let nextCalled = false;

    // When
    cacheControlMiddleware(req, res, () => { nextCalled = true; });

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
    assert(res.headers['Cache-Control'] !== undefined, 'Cache-Control header should be set');
  });

  test('1.0-MW-096 [P1] cacheControlMiddleware skips API requests', () => {
    // Given
    const req = createMockReq('/api/games');
    const res = createMockRes();
    res.set('Content-Type', 'application/json');
    let nextCalled = false;

    // When
    cacheControlMiddleware(req, res, () => { nextCalled = true; });

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
    assert.strictEqual(res.headers['Cache-Control'], undefined, 'Cache-Control should not be set');
  });

  test('1.0-MW-097 [P1] cacheControlMiddleware skips HTML requests', () => {
    // Given
    const req = createMockReq('/');
    const res = createMockRes();
    res.set('Content-Type', 'text/html');
    let nextCalled = false;

    // When
    cacheControlMiddleware(req, res, () => { nextCalled = true; });

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
    assert.strictEqual(res.headers['Cache-Control'], undefined, 'Cache-Control should not be set');
  });

});
