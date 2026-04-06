// Security middleware tests
// Test IDs: 1.0-MW-026 to 1.0-MW-050
// Priorities: P0 = critical security, P1 = core functionality

const assert = require('assert');
const path = require('path');

// Import modules
const {
  InputValidator,
  requestIdMiddleware,
  ipValidationMiddleware,
  createSessionMiddleware,
  csrfTokenGetter,
  csrfMiddleware,
  errorHandler
} = require('../../src/middleware/security');

describe('Security Middleware Tests', () => {

  // InputValidator tests
  test('1.0-MW-026 [P0] InputValidator.isValidEmail validates valid emails', () => {
    // Given valid email addresses
    assert.strictEqual(InputValidator.isValidEmail('test@example.com'), true, 'Standard email should be valid');
    assert.strictEqual(InputValidator.isValidEmail('user.name@domain.co.uk'), true, 'Email with dot should be valid');
    assert.strictEqual(InputValidator.isValidEmail('user+tag@example.org'), true, 'Email with plus should be valid');
    // Then all are recognized as valid
  });

  test('1.0-MW-027 [P0] InputValidator.isValidEmail rejects invalid emails', () => {
    // Given invalid email formats
    assert.strictEqual(InputValidator.isValidEmail('invalid'), false, 'No @ should be invalid');
    assert.strictEqual(InputValidator.isValidEmail('invalid@'), false, 'No domain should be invalid');
    assert.strictEqual(InputValidator.isValidEmail('@example.com'), false, 'No local part should be invalid');
    assert.strictEqual(InputValidator.isValidEmail(''), false, 'Empty string should be invalid');
    assert.strictEqual(InputValidator.isValidEmail(null), false, 'Null should be invalid');
  });

  test('1.0-MW-028 [P0] InputValidator.isValidUrl validates valid URLs', () => {
    // Given valid URL strings
    assert.strictEqual(InputValidator.isValidUrl('https://example.com'), true, 'HTTPS URL should be valid');
    assert.strictEqual(InputValidator.isValidUrl('http://localhost:3000'), true, 'Localhost URL should be valid');
    assert.strictEqual(InputValidator.isValidUrl('https://example.com/path?query=value'), true, 'URL with query should be valid');
  });

  test('1.0-MW-029 [P1] InputValidator.isValidUrl rejects invalid URLs', () => {
    // Given invalid URL formats
    assert.strictEqual(InputValidator.isValidUrl('not a url'), false, 'Plain text should be invalid');
    assert.strictEqual(InputValidator.isValidUrl(''), false, 'Empty string should be invalid');
    assert.strictEqual(InputValidator.isValidUrl(null), false, 'Null should be invalid');
  });

  test('1.0-MW-030 [P1] InputValidator.sanitizeString trims whitespace', () => {
    // Given string with leading/trailing whitespace
    assert.strictEqual(InputValidator.sanitizeString('  test  '), 'test', 'Whitespace should be trimmed');
  });

  test('1.0-MW-031 [P0] InputValidator.sanitizeString removes null bytes', () => {
    // Given string with null bytes (potential injection)
    assert.strictEqual(InputValidator.sanitizeString('test\0value'), 'testvalue', 'Null bytes should be removed');
  });

  test('1.0-MW-032 [P1] InputValidator.sanitizeString respects maxLength', () => {
    // Given long string with max length constraint
    const result = InputValidator.sanitizeString('a'.repeat(1000), { maxLength: 100 });
    assert.strictEqual(result.length, 100, 'Result should be truncated to maxLength');
  });

  test('1.0-MW-033 [P0] InputValidator.isValidFilePath validates safe paths', () => {
    // Given allowed directory
    const allowedDir = '/mnt/d/Dev/best_version';
    // Test with a safe relative path in the allowed directory
    assert.strictEqual(InputValidator.isValidFilePath('package.json', allowedDir), true, 'Package.json should be valid');
  });

  test('1.0-MW-034 [P0] InputValidator.isValidFilePath rejects path traversal attempts', () => {
    // Given games directory
    const allowedDir = '/mnt/d/Dev/best_version/games';
    // When attempting path traversal
    assert.strictEqual(InputValidator.isValidFilePath('../etc/passwd', allowedDir), false, '../ should be rejected');
    assert.strictEqual(InputValidator.isValidFilePath('/etc/passwd', allowedDir), false, 'Absolute path should be rejected');
    assert.strictEqual(InputValidator.isValidFilePath('game/../../../etc/passwd', allowedDir), false, 'Nested traversal should be rejected');
  });

  test('1.0-MW-035 [P0] InputValidator.isValidFilePath rejects paths with null bytes', () => {
    // Given path with null byte
    assert.strictEqual(InputValidator.isValidFilePath('game\0.json', '/tmp'), false, 'Path with null byte should be rejected');
  });

  // requestIdMiddleware tests
  test('1.0-MW-036 [P1] requestIdMiddleware adds requestId to request', () => {
    // Given request without ID
    const req = { headers: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { headers: {} };
    res.set = (name, value) => { res.headers[name] = value; };

    // When applying middleware
    requestIdMiddleware(req, res, () => {});

    // Then requestId is set
    assert(typeof req.requestId === 'string', 'Request ID should be string');
    assert.strictEqual(req.requestId.length, 16, 'Request ID should be 16 characters');
    assert.strictEqual(res.headers['X-Request-ID'], req.requestId, 'Header should match request ID');
  });

  // ipValidationMiddleware tests
  test('1.0-MW-037 [P1] ipValidationMiddleware uses direct IP if no forwarded header', () => {
    // Given request with direct IP
    const req = { headers: {}, get: () => null, ip: '127.0.0.1', hostname: 'localhost', connection: {} };
    const res = {};

    ipValidationMiddleware(req, res, () => {});

    assert.strictEqual(req.ip, '127.0.0.1', 'Direct IP should be used');
  });

  test('1.0-MW-038 [P1] ipValidationMiddleware uses X-Forwarded-For header first IP', () => {
    // Given request with forwarded header
    const req = {
      headers: { 'x-forwarded-for': '192.168.1.100, 10.0.0.1' },
      get: (field) => field === 'x-forwarded-for' ? '192.168.1.100, 10.0.0.1' : null,
      ip: null,
      hostname: 'localhost',
      connection: {}
    };
    const res = {};

    ipValidationMiddleware(req, res, () => {});

    assert.strictEqual(req.ip, '192.168.1.100', 'First IP from X-Forwarded-For should be used');
  });

  // createSessionMiddleware tests
  test('1.0-MW-039 [P0] createSessionMiddleware initializes empty session when no cookie', () => {
    // Given request without session cookie
    const req = { headers: {}, cookies: {}, session: null, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = {
      cookie: () => {} // Mock cookie method
    };

    const middleware = createSessionMiddleware();
    middleware(req, res, () => {});

    // Then session is initialized as an object
    assert.notStrictEqual(req.session, null, 'Session should not be null');
    assert.strictEqual(typeof req.session, 'object', 'Session should be object');
  });

  test('1.0-MW-040 [P1] createSessionMiddleware sets req.session to empty object on expired session', () => {
    // Given request with expired session
    const req = {
      headers: {},
      cookies: { session_id: 'expired' },
      session: null,
      get: () => null,
      hostname: 'localhost',
      ip: '127.0.0.1'
    };
    const res = {
      clearCookie: () => {}
    };

    const middleware = createSessionMiddleware();
    middleware(req, res, () => {});

    // Then session is still initialized
    assert.strictEqual(typeof req.session, 'object', 'Session should be object');
  });

  // csrfTokenGetter tests
  test('1.0-MW-041 [P0] csrfTokenGetter generates CSRF token for session', () => {
    // Given request with empty session
    const req = { headers: {}, cookies: {}, session: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { locals: {} };

    const middleware = csrfTokenGetter;
    middleware(req, res, () => {});

    // Then CSRF token is generated
    assert.ok(req.session.csrfToken, 'CSRF token should exist');
    assert.strictEqual(typeof req.session.csrfToken, 'string', 'CSRF token should be string');
    assert.strictEqual(req.session.csrfToken.length, 64, 'CSRF token should be 64 characters'); // 32 bytes hex
  });

  test('1.0-MW-042 [P0] csrfTokenGetter sets CSRF token in res.locals', () => {
    // Given request with empty session
    const req = { headers: {}, cookies: {}, session: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { locals: {} };

    const middleware = csrfTokenGetter;
    middleware(req, res, () => {});

    // Then token is available in res.locals
    assert.strictEqual(res.locals.csrfToken, req.session.csrfToken, 'Local CSRF token should match session');
  });

  test('1.0-MW-043 [P1] csrfTokenGetter reuses existing CSRF token', () => {
    // Given request with existing token
    const existingToken = 'existingtoken12345678901234567890123456789012';
    const req = { headers: {}, cookies: {}, session: { csrfToken: existingToken }, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { locals: {} };

    const middleware = csrfTokenGetter;
    middleware(req, res, () => {});

    // Then existing token is preserved
    assert.strictEqual(req.session.csrfToken, existingToken, 'Existing token should be preserved');
  });

  // csrfMiddleware tests
  test('1.0-MW-044 [P1] csrfMiddleware allows GET requests without CSRF token', () => {
    // Given GET request without token
    const req = { headers: {}, cookies: {}, body: {}, session: {}, method: 'GET', get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { locals: {}, set: () => {} };

    const middleware = csrfMiddleware;
    middleware(req, res, () => {});

    // Then request is allowed
    assert.strictEqual(res.statusCode, undefined, 'Status should be undefined');
  });

  test('1.0-MW-045 [P0] csrfMiddleware requires CSRF token for POST requests', () => {
    // Given POST request without token
    const req = { headers: {}, cookies: {}, body: {}, session: {}, method: 'POST', get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const middleware = csrfMiddleware;
    middleware(req, res, () => {});

    // Then request is rejected
    assert.strictEqual(res.statusCode, 403, 'Should return 403');
    assert.strictEqual(res.jsonData.code, 'CSRF_TOKEN_MISSING', 'Error code should match');
  });

  test('1.0-MW-046 [P0] csrfMiddleware rejects invalid CSRF token', () => {
    // Given POST request with wrong token
    const req = {
      headers: { 'x-csrf-token': 'wrongtoken' },
      cookies: {},
      body: {},
      session: { csrfToken: 'validtoken' },
      method: 'POST',
      get: () => null,
      hostname: 'localhost',
      ip: '127.0.0.1'
    };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const middleware = csrfMiddleware;
    middleware(req, res, () => {});

    // Then request is rejected
    assert.strictEqual(res.statusCode, 403, 'Should return 403');
    assert.strictEqual(res.jsonData.code, 'CSRF_TOKEN_INVALID', 'Error code should match');
  });

  test('1.0-MW-047 [P0] csrfMiddleware accepts valid CSRF token', () => {
    // Given POST request with correct token
    const req = {
      headers: { 'x-csrf-token': 'validtoken123' },
      cookies: {},
      body: {},
      session: { csrfToken: 'validtoken123' },
      method: 'POST',
      get: () => null,
      hostname: 'localhost',
      ip: '127.0.0.1'
    };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const middleware = csrfMiddleware;
    middleware(req, res, () => {});

    // Then request is allowed
    assert.strictEqual(res.statusCode, 200, 'Should return 200');
  });

  // errorHandler tests
  test('1.0-MW-048 [P1] errorHandler returns 500 status for generic errors', () => {
    // Given error
    const req = { headers: {}, cookies: {}, body: {}, session: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const error = new Error('Test error');
    errorHandler(error, req, res, () => {});

    assert.strictEqual(res.statusCode, 500, 'Should return 500');
    assert.strictEqual(res.jsonData.success, false, 'Should report failure');
  });

  test('1.0-MW-049 [P1] errorHandler exposes error message in development', () => {
    process.env.NODE_ENV = 'development';

    const req = { headers: {}, cookies: {}, body: {}, session: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const error = new Error('Specific error message');
    errorHandler(error, req, res, () => {});

    assert.ok(res.jsonData.error.includes('Specific error message'), 'Error message should be included');

    // Reset env
    process.env.NODE_ENV = 'production';
  });

  test('1.0-MW-050 [P0] errorHandler hides error details in production', () => {
    process.env.NODE_ENV = 'production';

    const req = { headers: {}, cookies: {}, body: {}, session: {}, get: () => null, hostname: 'localhost', ip: '127.0.0.1' };
    const res = { statusCode: 200 };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.jsonData = data; };

    const error = new Error('Sensitive error details');
    errorHandler(error, req, res, () => {});

    assert.strictEqual(res.jsonData.error, 'An internal error occurred', 'Generic error message should be shown');

    // Reset env
    process.env.NODE_ENV = 'development';
  });

});
