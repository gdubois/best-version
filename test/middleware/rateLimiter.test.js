// Test suite for rate limiter service
// Test IDs: 1.0-MW-012 to 1.0-MW-026
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { RateLimiter, rateLimitMiddleware } = require('../../src/middleware/rateLimiter');

describe('Rate Limiter Tests', () => {

  const testDir = path.join(__dirname, 'temp_ratelimiter_test');

  // Setup test directory
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  // Cleanup test directory after all tests
  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.readdirSync(testDir).forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });

  // Test RateLimiter class
  test('1.0-MW-012 [P1] RateLimiter initializes with directory', () => {
    // Given rate limiter with directory
    // When
    const limiter = new RateLimiter(testDir);

    // Then properties are set correctly
    assert(limiter !== null, 'Limiter should be instantiated');
    assert.strictEqual(limiter.limitsDir, testDir, 'limitsDir should match');
  });

  test('1.0-MW-013 [P1] RateLimiter creates limits file if not exists', () => {
    // Given limiter instance
    // When
    const limiter = new RateLimiter(testDir);
    limiter.saveLimits({});

    // Then file is created
    assert(fs.existsSync(limiter.limitsFile), 'Limits file should be created');
  });

  test('1.0-MW-014 [P1] RateLimiter gets limits from file', () => {
    // Given limiter with saved limits
    const limiter = new RateLimiter(testDir);
    limiter.saveLimits({ 'test:login': { count: 5, resetTime: Date.now() } });

    // When getting limits
    const limits = limiter.getLimits();

    // Then returns saved data
    assert(limits['test:login'] !== undefined, 'Limits should be returned');
  });

  test('1.0-MW-015 [P1] RateLimiter generates unique keys', () => {
    // Given limiter instance
    // When generating keys
    const limiter = new RateLimiter(testDir);
    const key1 = limiter.generateKey('user1', 'login');
    const key2 = limiter.generateKey('user2', 'login');

    // Then keys are unique and formatted correctly
    assert.strictEqual(key1, 'user1:login', 'Key1 should match format');
    assert.strictEqual(key2, 'user2:login', 'Key2 should match format');
    assert(key1 !== key2, 'Keys should be unique');
  });

  test('1.0-MW-016 [P1] RateLimiter checkRateLimit allows requests under limit', () => {
    // Given limiter with 100 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 100, windowMs: 60000 });

    // When checking rate limit
    const result = limiter.checkRateLimit('test-user', 'login');

    // Then allows request
    assert.strictEqual(result.exceeded, false, 'Should not exceed');
    assert.strictEqual(result.remaining, 99, 'Remaining should be 99');
  });

  test('1.0-MW-017 [P1] RateLimiter checkRateLimit tracks request count', () => {
    // Given limiter with 5 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 5, windowMs: 60000 });

    // When making 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.checkRateLimit('counter-test', 'api');
    }

    // Then 6th request exceeds limit
    const result = limiter.checkRateLimit('counter-test', 'api');
    assert.strictEqual(result.exceeded, true, 'Should exceed');
    assert.strictEqual(result.remaining, 0, 'Remaining should be 0');
  });

  test('1.0-MW-018 [P2] RateLimiter checkRateLimit returns reset time', () => {
    // Given limiter with 10 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 10, windowMs: 60000 });

    // When checking rate limit
    const result = limiter.checkRateLimit('time-test', 'login');

    // Then returns reset time
    assert(result.resetTime !== undefined, 'Reset time should be defined');
    assert.strictEqual(result.retryAfter, null, 'Retry after should be null');
  });

  test('1.0-MW-019 [P2] RateLimiter checkRateLimit calculates retryAfter when exceeded', () => {
    // Given limiter with 2 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 2, windowMs: 60000 });

    // When exceeding limit
    limiter.checkRateLimit('retry-test', 'api');
    limiter.checkRateLimit('retry-test', 'api');
    const result = limiter.checkRateLimit('retry-test', 'api');

    // Then retryAfter is set
    assert.strictEqual(result.exceeded, true, 'Should exceed');
    assert(result.retryAfter !== null, 'Retry after should not be null');
  });

  test('1.0-MW-020 [P1] RateLimiter uses default limits when not provided', () => {
    // Given limiter with defaults
    const limiter = new RateLimiter(testDir);

    // When checking rate limit
    const result = limiter.checkRateLimit('default-test', 'login');

    // Then uses default of 100
    assert.strictEqual(result.exceeded, false, 'Should not exceed default');
  });

  test('1.0-MW-021 [P2] RateLimiter respects custom config overrides', () => {
    // Given limiter with 100 default limit
    const limiter = new RateLimiter(testDir, { maxRequests: 100, windowMs: 60000 });

    // When overriding to 2 requests
    const result = limiter.checkRateLimit('custom-test', 'login', { maxRequests: 2 });

    // Then uses override
    assert.strictEqual(result.exceeded, false, 'Should not exceed');
    assert.strictEqual(result.remaining, 1, 'Remaining should be 1');
  });

  // Test rateLimitMiddleware
  function createMockReq(path, method = 'GET', headers = {}) {
    return {
      path,
      method,
      ip: '127.0.0.1',
      headers
    };
  }

  function createMockRes() {
    const res = {
      statusCode: 200,
      data: null,
      headers: {},
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
      },
      set: function(key, value) {
        this.headers[key] = value;
      }
    };
    return res;
  }

  test('1.0-MW-022 [P1] rateLimitMiddleware allows requests under limit', () => {
    // Given middleware with 100 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 100, windowMs: 60000 });
    const middleware = rateLimitMiddleware(limiter);
    const req = createMockReq('/api/test');
    const res = createMockRes();
    let nextCalled = false;

    // When calling middleware
    middleware(req, res, () => { nextCalled = true; });

    // Then allows request
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  test('1.0-MW-023 [P1] rateLimitMiddleware skips health check requests', () => {
    // Given middleware with 1 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 1, windowMs: 60000 });
    const middleware = rateLimitMiddleware(limiter);
    const req = createMockReq('/health');
    const res = createMockRes();
    let nextCalled = false;

    // When calling middleware
    middleware(req, res, () => { nextCalled = true; });

    // Then skips health check
    assert.strictEqual(nextCalled, true, 'Next should be called for health check');
  });

  test('1.0-MW-024 [P1] rateLimitMiddleware skips static file requests', () => {
    // Given middleware with 1 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 1, windowMs: 60000 });
    const middleware = rateLimitMiddleware(limiter);
    const req = createMockReq('/_next/static/app.js');
    const res = createMockRes();
    let nextCalled = false;

    // When calling middleware
    middleware(req, res, () => { nextCalled = true; });

    // Then skips static files
    assert.strictEqual(nextCalled, true, 'Next should be called for static files');
  });

  test('1.0-MW-025 [P1] rateLimitMiddleware skips admin routes', () => {
    // Given middleware with 1 request limit
    const limiter = new RateLimiter(testDir, { maxRequests: 1, windowMs: 60000 });
    const middleware = rateLimitMiddleware(limiter);
    const req = createMockReq('/api/admin/dashboard');
    const res = createMockRes();
    let nextCalled = false;

    // When calling middleware
    middleware(req, res, () => { nextCalled = true; });

    // Then skips admin routes
    assert.strictEqual(nextCalled, true, 'Next should be called for admin routes');
  });

});
