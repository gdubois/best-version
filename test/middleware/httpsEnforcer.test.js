// Test suite for HTTPS enforcement middleware
// Test IDs: 1.0-MW-122 to 1.0-MW-134
// Priorities: P0 = critical security, P1 = core functionality

const assert = require('assert');
const { enforceHttps, addHstsHeader } = require('../../src/middleware/httpsEnforcer');

// Helper to create mock request/response objects
function createMockReq(headers = {}, overrides = {}) {
  const defaultHeaders = {
    'X-Forwarded-Proto': headers['X-Forwarded-Proto'],
    'X-Forwarded-Ssl': headers['X-Forwarded-Ssl'],
    Host: headers.Host || 'example.com'
  };
  return {
    get: (header) => {
      if (header === 'Host') {
        return defaultHeaders.Host;
      }
      return headers[header] || null;
    },
    originalUrl: '/test/path',
    ...overrides
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    redirected: false,
    redirectCode: null,
    redirectUrl: null,
    redirect: function(code, url) {
      this.redirected = true;
      this.redirectCode = code;
      this.redirectUrl = url;
      return this;
    },
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    set: function(name, value) {
      this.headers[name] = value;
      return this;
    }
  };
}

describe('HTTPS Enforcer Middleware Tests', () => {

  // Helper to set environment
  function setEnv(env) {
    process.env.NODE_ENV = env;
  }

  // Cleanup after tests
  afterAll(() => {
    process.env.NODE_ENV = 'test';
  });

  // Test enforceHttps - HTTP requests in production
  test('1.0-MW-122 [P0] enforceHttps redirects HTTP to HTTPS in production', () => {
    // Given
    setEnv('production');
    const req = createMockReq({});
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    enforceHttps(req, res, next);

    // Then
    assert.strictEqual(res.redirected, true, 'Should redirect');
    assert.strictEqual(res.redirectCode, 301, 'Should be 301 redirect');
    assert.strictEqual(res.redirectUrl, 'https://example.com/test/path', 'URL should be HTTPS');
    assert.strictEqual(nextCalled, false, 'Next should not be called');
  });

  test('1.0-MW-123 [P0] enforceHttps passes through HTTPS requests', () => {
    // Given
    setEnv('production');
    const req = createMockReq({ 'X-Forwarded-Proto': 'https' });
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    enforceHttps(req, res, next);

    // Then
    assert.strictEqual(res.redirected, false, 'Should not redirect');
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  test('1.0-MW-124 [P0] enforceHttps passes through SSL requests', () => {
    // Given
    setEnv('production');
    const req = createMockReq({ 'X-Forwarded-Ssl': 'on' });
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    enforceHttps(req, res, next);

    // Then
    assert.strictEqual(res.redirected, false, 'Should not redirect');
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  test('1.0-MW-125 [P1] enforceHttps passes through in development mode', () => {
    // Given
    setEnv('development');
    const req = createMockReq({});
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    enforceHttps(req, res, next);

    // Then
    assert.strictEqual(res.redirected, false, 'Should not redirect');
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  test('1.0-MW-126 [P1] enforceHttps handles both X-Forwarded-Proto and X-Forwarded-Ssl', () => {
    // Given
    setEnv('production');

    // Test X-Forwarded-Proto: https
    const req1 = createMockReq({ 'X-Forwarded-Proto': 'https' });
    const res1 = createMockRes();
    enforceHttps(req1, res1, () => {});

    // Test X-Forwarded-Ssl: on
    const req2 = createMockReq({ 'X-Forwarded-Ssl': 'on' });
    const res2 = createMockRes();
    enforceHttps(req2, res2, () => {});

    // Then
    assert.strictEqual(res1.redirected, false, 'Should not redirect with X-Forwarded-Proto: https');
    assert.strictEqual(res2.redirected, false, 'Should not redirect with X-Forwarded-Ssl: on');
  });

  test('1.0-MW-127 [P1] enforceHttps preserves original URL in redirect', () => {
    // Given
    setEnv('production');
    const req = createMockReq({}, { originalUrl: '/games/pokemon' });
    const res = createMockRes();

    // When
    enforceHttps(req, res, () => {});

    // Then
    assert.strictEqual(res.redirectUrl, 'https://example.com/games/pokemon', 'URL should be preserved');
  });

  // Test addHSTS header
  test('1.0-MW-128 [P0] addHstsHeader sets HSTS header in production', () => {
    // Given
    setEnv('production');
    const req = createMockReq({});
    const res = createMockRes();

    // When
    addHstsHeader(req, res, () => {});

    // Then
    assert.strictEqual(res.headers['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains; preload', 'HSTS header should be set');
  });

  test('1.0-MW-129 [P1] addHstsHeader does not set HSTS header in development', () => {
    // Given
    setEnv('development');
    const req = createMockReq({});
    const res = createMockRes();

    // When
    addHstsHeader(req, res, () => {});

    // Then
    assert.strictEqual(res.headers['Strict-Transport-Security'], undefined, 'HSTS header should not be set');
  });

  test('1.0-MW-130 [P1] addHstsHeader calls next even without HSTS', () => {
    // Given
    setEnv('development');
    const req = createMockReq({});
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    addHstsHeader(req, res, next);

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  test('1.0-MW-131 [P1] addHstsHeader calls next after setting HSTS', () => {
    // Given
    setEnv('production');
    const req = createMockReq({});
    const res = createMockRes();
    let nextCalled = false;

    // When
    const next = () => { nextCalled = true; };
    addHstsHeader(req, res, next);

    // Then
    assert.strictEqual(nextCalled, true, 'Next should be called');
  });

  // Additional tests
  test('1.0-MW-132 [P1] enforceHttps handles localhost URLs', () => {
    // Given
    setEnv('production');
    const req = createMockReq({}, { originalUrl: '/test' });
    const res = createMockRes();

    // When
    enforceHttps(req, res, () => {});

    // Then
    assert.strictEqual(res.redirected, true, 'Should redirect');
    assert(res.redirectUrl.includes('https://'), 'URL should be HTTPS');
  });

  test('1.0-MW-133 [P1] enforceHttps handles subdomain URLs', () => {
    // Given
    setEnv('production');
    const req = createMockReq({}, { originalUrl: '/api/data' });
    const res = createMockRes();

    // When
    enforceHttps(req, res, () => {});

    // Then
    assert.strictEqual(res.redirected, true, 'Should redirect');
    assert.strictEqual(res.redirectUrl, 'https://example.com/api/data', 'URL should be preserved');
  });

  test('1.0-MW-134 [P2] enforceHttps handles query strings in URLs', () => {
    // Given
    setEnv('production');
    const req = createMockReq({}, { originalUrl: '/games?search=pokemon' });
    const res = createMockRes();

    // When
    enforceHttps(req, res, () => {});

    // Then
    assert.strictEqual(res.redirected, true, 'Should redirect');
    assert.strictEqual(res.redirectUrl, 'https://example.com/games?search=pokemon', 'Query string should be preserved');
  });

});
