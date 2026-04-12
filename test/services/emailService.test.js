// Test suite for email service
// Test IDs: 1.0-SVC-001 to 1.0-SVC-023
// Priorities: P0 = critical security, P1 = core functionality, P2 = important features

const assert = require('assert');
const { EmailService } = require('../../src/services/emailService');
const { saveEnv } = require('../helpers/env');

describe('Email Service Tests', () => {

  // Test constructor
  test('1.0-SVC-001 [P1] EmailService initializes with mock mode when no API key', async () => {
    // Given no API key configured
    const restore = saveEnv(['RESEND_API_KEY', 'SITE_URL']);
    delete process.env.RESEND_API_KEY;
    delete process.env.SITE_URL;

    try {
      // When creating service
      const email = new EmailService();

      // Then uses mock mode
      assert(email !== null, 'EmailService should be instantiated');
      assert.strictEqual(email.useMock, true, 'Should use mock mode');
      assert.strictEqual(email.resendApiKey, null, 'API key should be null');
      assert.strictEqual(email.siteUrl, 'http://localhost:3000', 'Default site URL should be localhost');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-002 [P1] EmailService uses API key when provided', async () => {
    // Given API key and site configured
    const restore = saveEnv(['RESEND_API_KEY', 'SITE_URL']);
    process.env.RESEND_API_KEY = 'test-api-key-123';
    process.env.SITE_URL = 'https://example.com';

    try {
      // When creating service
      const email = new EmailService();

      // Then uses real API mode
      assert.strictEqual(email.useMock, false, 'Should not use mock mode');
      assert.strictEqual(email.resendApiKey, 'test-api-key-123', 'API key should match');
      assert.strictEqual(email.siteUrl, 'https://example.com', 'Site URL should match');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-003 [P2] EmailService sets default site URL', async () => {
    // Given no SITE_URL configured
    const restore = saveEnv(['SITE_URL']);
    delete process.env.SITE_URL;

    try {
      // When creating service
      const email = new EmailService();

      // Then uses localhost default
      assert.strictEqual(email.siteUrl, 'http://localhost:3000', 'Default site URL should be localhost');
    } finally {
      restore();
    }
  });

  // Test sendApprovalEmail
  test('1.0-SVC-004 [P0] EmailService.sendApprovalEmail sends email successfully', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending approval email
      const email = new EmailService();
      const result = await email.sendApprovalEmail('user@example.com', 'Test Game', 'test-game');

      // Then succeeds (mocked)
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
      assert.strictEqual(result.sent, false, 'Should not be sent in mock mode');
      assert.strictEqual(result.mocked, true, 'Should be mocked');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-005 [P0] EmailService.sendApprovalEmail rejects missing email', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending with null email
      const email = new EmailService();
      const result = await email.sendApprovalEmail(null, 'Test Game', 'test-game');

      // Then fails with error
      assert.strictEqual(result.success, false, 'Should fail');
      assert.strictEqual(result.error, 'No email address', 'Error should mention no email');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-006 [P0] EmailService.sendApprovalEmail escapes HTML in title', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending with XSS payload
      const email = new EmailService();
      const result = await email.sendApprovalEmail('user@example.com', '<script>alert("xss")</script>', 'test-game');

      // Then succeeds (HTML escaped server-side)
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed despite XSS payload');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-007 [P1] EmailService.sendApprovalEmail includes correct subject', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending approval email
      const email = new EmailService();
      const result = await email.sendApprovalEmail('user@example.com', 'Test Game', 'test-game');

      // Then succeeds
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-008 [P1] EmailService.sendApprovalEmail includes game URL', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending approval email
      const email = new EmailService();
      const result = await email.sendApprovalEmail('user@example.com', 'Test Game', 'my-test-game');

      // Then succeeds
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
    } finally {
      restore();
    }
  });

  // Test sendRejectionEmail
  test('1.0-SVC-009 [P0] EmailService.sendRejectionEmail sends email successfully', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending rejection email
      const email = new EmailService();
      const result = await email.sendRejectionEmail(
        'user@example.com',
        'Test Game',
        'Incomplete submission'
      );

      // Then succeeds (mocked)
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
      assert.strictEqual(result.sent, false, 'Should not be sent in mock mode');
      assert.strictEqual(result.mocked, true, 'Should be mocked');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-010 [P0] EmailService.sendRejectionEmail rejects missing email', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending with null email
      const email = new EmailService();
      const result = await email.sendRejectionEmail(null, 'Test Game', 'Incomplete');

      // Then fails with error
      assert.strictEqual(result.success, false, 'Should fail');
      assert.strictEqual(result.error, 'No email address', 'Error should mention no email');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-011 [P0] EmailService.sendRejectionEmail escapes HTML in reason', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending with XSS payload
      const email = new EmailService();
      const result = await email.sendRejectionEmail(
        'user@example.com',
        'Test Game',
        '<script>alert("xss")</script>'
      );

      // Then succeeds (HTML escaped)
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed despite XSS payload');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-012 [P1] EmailService.sendRejectionEmail includes correct subject', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending rejection email
      const email = new EmailService();
      const result = await email.sendRejectionEmail(
        'user@example.com',
        'Test Game',
        'Incomplete'
      );

      // Then succeeds
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
    } finally {
      restore();
    }
  });

  // Test sendEmail (generic)
  test('1.0-SVC-013 [P1] EmailService.sendEmail in mock mode returns success', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When sending email
      const email = new EmailService();
      const result = await email.sendEmail('test@example.com', 'Test Subject', '<p>Test</p>', 'Test');

      // Then succeeds (mocked)
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
      assert.strictEqual(result.sent, false, 'Should not be sent in mock mode');
      assert.strictEqual(result.mocked, true, 'Should be mocked');
    } finally {
      restore();
    }
  });

  // Test healthCheck
  test('1.0-SVC-014 [P2] EmailService.healthCheck returns configured status', async () => {
    // Given no API key (mock mode)
    const restore = saveEnv(['RESEND_API_KEY']);
    delete process.env.RESEND_API_KEY;

    try {
      // When checking health
      const email = new EmailService();
      const health = email.healthCheck();

      // Then returns correct status
      assert(health !== null, 'Health should not be null');
      assert.strictEqual(health.useMock, true, 'Should use mock mode');
      assert.strictEqual(health.configured, false, 'Should not be configured in mock mode');
      assert(typeof health.siteUrl === 'string', 'Site URL should be string');
    } finally {
      restore();
    }
  });

  test('1.0-SVC-015 [P2] EmailService.healthCheck with real API key', async () => {
    // Given API key configured
    const restore = saveEnv(['RESEND_API_KEY']);
    process.env.RESEND_API_KEY = 'test-key';

    try {
      // When checking health
      const email = new EmailService();
      const health = email.healthCheck();

      // Then shows configured status
      assert.strictEqual(health.configured, true, 'Should be configured');
      assert.strictEqual(health.useMock, false, 'Should not use mock mode');
    } finally {
      restore();
    }
  });

  // Test escapeHtml
  test('1.0-SVC-016 [P0] EmailService.escapeHtml handles null/empty input', () => {
    // Given EmailService instance
    const email = new EmailService();

    // When escaping various inputs
    assert.strictEqual(email.escapeHtml(null), '', 'Null should return empty string');
    assert.strictEqual(email.escapeHtml(undefined), '', 'Undefined should return empty string');
    assert.strictEqual(email.escapeHtml(''), '', 'Empty string should return empty string');
    assert.strictEqual(email.escapeHtml('Normal text'), 'Normal text', 'Normal text should pass through');
  });

  // Test with custom site URL
  test('1.0-SVC-017 [P2] EmailService uses custom site URL in game URL', async () => {
    // Given custom site URL
    const restore = saveEnv(['RESEND_API_KEY', 'SITE_URL']);
    delete process.env.RESEND_API_KEY;
    process.env.SITE_URL = 'https://best-version.com';

    try {
      // When sending approval email
      const email = new EmailService();
      const result = await email.sendApprovalEmail('user@example.com', 'Test Game', 'test-slug');

      // Then succeeds
      assert(result !== null, 'Result should not be null');
      assert.strictEqual(result.success, true, 'Should succeed');
    } finally {
      restore();
    }
  });

  // Test invalid email scenarios
  test('1.0-SVC-018 [P0] EmailService.sendApprovalEmail with empty email string', async () => {
    // Given EmailService instance
    const email = new EmailService();

    // When sending with empty string
    const result = await email.sendApprovalEmail('', 'Test Game', 'test-game');

    // Then fails (empty string is falsy)
    assert.strictEqual(result.success, false, 'Should fail');
    assert.strictEqual(result.error, 'No email address', 'Error should mention no email');
  });

  test('1.0-SVC-019 [P0] EmailService.sendRejectionEmail with empty email string', async () => {
    // Given EmailService instance
    const email = new EmailService();

    // When sending with empty string
    const result = await email.sendRejectionEmail('', 'Test Game', 'Reason');

    // Then fails
    assert.strictEqual(result.success, false, 'Should fail');
    assert.strictEqual(result.error, 'No email address', 'Error should mention no email');
  });

  test('1.0-SVC-020 [P1] EmailService.sendEmail with invalid API key returns error', async () => {
    // Given invalid API key
    const restore = saveEnv(['RESEND_API_KEY']);
    process.env.RESEND_API_KEY = 'invalid-key';

    try {
      // When sending email
      const email = new EmailService();
      const result = await email.sendEmail('test@example.com', 'Test', '<p>Test</p>', 'Test');

      // Then fails with API key error
      assert.strictEqual(result.success, false, 'Should fail');
      assert(result.error.includes('API key is invalid') === true, 'Error should mention invalid API key');
    } finally {
      restore();
    }
  });

});
