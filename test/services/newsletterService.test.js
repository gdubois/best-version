// Test suite for newsletter service
// Test IDs: 1.0-SVC-098 to 1.0-SVC-128
// Priorities: P1 = core functionality, P2 = important features

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { NewsletterService } = require('../../src/services/newsletterService');
const { EmailService } = require('../../src/services/emailService');

// Helper to create temp directories
function createTempDirs() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'newsletter-'));
  return {
    subscribersFile: path.join(tempDir, 'subscribers.json'),
    contentFile: path.join(tempDir, 'content.json'),
    tempDir
  };
}

// Helper to cleanup temp directories
function cleanupTempDirs(dirs) {
  try {
    if (dirs.tempDir && fs.existsSync(dirs.tempDir)) {
      fs.rmSync(dirs.tempDir, { recursive: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

describe('Newsletter Service Tests', () => {

  // Test constructor
  test('1.0-SVC-098 [P1] NewsletterService initializes with default files', () => {
    // Given
    const dirs = createTempDirs();

    // When
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // Then
    assert(newsletter !== null, 'NewsletterService should be instantiated');
    assert.strictEqual(newsletter.rateLimit, 5, 'Rate limit should be 5');
    assert(fs.existsSync(dirs.subscribersFile), 'Subscribers file should be created');
    assert(fs.existsSync(dirs.contentFile), 'Content file should be created');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-099 [P1] NewsletterService uses provided email service', () => {
    // Given
    const dirs = createTempDirs();
    const mockEmailService = { sendEmail: async () => ({ success: true }) };

    // When
    const newsletter = new NewsletterService(dirs.subscribersFile, mockEmailService, dirs.contentFile);

    // Then
    assert(newsletter.emailService === mockEmailService, 'Email service should match');

    cleanupTempDirs(dirs);
  });

  // Test getAllSubscribers
  test('1.0-SVC-100 [P1] NewsletterService.getAllSubscribers returns empty array initially', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const subscribers = newsletter.getAllSubscribers();

    // Then
    assert(Array.isArray(subscribers), 'Should return array');
    assert.strictEqual(subscribers.length, 0, 'Should be empty');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-101 [P1] NewsletterService.getAllSubscribers returns saved subscribers', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    newsletter.saveSubscribers([
      { id: '1', email: 'user1@example.com', subscribedAt: new Date().toISOString() },
      { id: '2', email: 'user2@example.com', subscribedAt: new Date().toISOString() }
    ]);

    // When
    const subscribers = newsletter.getAllSubscribers();

    // Then
    assert.strictEqual(subscribers.length, 2, 'Should have 2 subscribers');
    assert.strictEqual(subscribers[0].email, 'user1@example.com', 'Email should match');

    cleanupTempDirs(dirs);
  });

  // Test isSubscribed
  test('1.0-SVC-102 [P1] NewsletterService.isSubscribed returns true for existing subscriber', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    newsletter.saveSubscribers([
      { id: '1', email: 'user@example.com', subscribedAt: new Date().toISOString() }
    ]);

    // Then
    assert(newsletter.isSubscribed('user@example.com') === true, 'Should be subscribed');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-103 [P1] NewsletterService.isSubscribed is case insensitive', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    newsletter.saveSubscribers([
      { id: '1', email: 'User@example.com', subscribedAt: new Date().toISOString() }
    ]);

    // Then
    assert(newsletter.isSubscribed('USER@EXAMPLE.COM') === true, 'Should be subscribed (uppercase)');
    assert(newsletter.isSubscribed('user@example.com') === true, 'Should be subscribed (lowercase)');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-104 [P1] NewsletterService.isSubscribed returns false for non-subscriber', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // Then
    assert(newsletter.isSubscribed('nonexistent@example.com') === false, 'Should not be subscribed');

    cleanupTempDirs(dirs);
  });

  // Test subscribe
  test('1.0-SVC-105 [P1] NewsletterService.subscribe adds new subscriber', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const result = await newsletter.subscribe('newuser@example.com', '192.168.1.1');

    // Then
    assert(result.success === true, 'Should succeed');
    assert(result.data !== null, 'Data should exist');
    assert.strictEqual(result.data.email, 'newuser@example.com', 'Email should match');

    const subscribers = newsletter.getAllSubscribers();
    assert.strictEqual(subscribers.length, 1, 'Should have 1 subscriber');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-106 [P1] NewsletterService.subscribe normalizes email to lowercase', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const result = await newsletter.subscribe('UPPERCASE@EXAMPLE.COM', '192.168.1.1');

    // Then
    assert.strictEqual(result.data.email, 'uppercase@example.com', 'Email should be lowercase');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-107 [P1] NewsletterService.subscribe rejects already subscribed email', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    await newsletter.subscribe('user@example.com', '192.168.1.1');

    // When
    const result = await newsletter.subscribe('user@example.com', '192.168.1.2');

    // Then
    assert(result.success === false, 'Should fail');
    assert.strictEqual(result.error, 'Already subscribed', 'Error should match');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-108 [P2] NewsletterService.subscribe enforces rate limit by IP', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // Subscribe 5 times (rate limit is 5)
    for (let i = 0; i < 5; i++) {
      await newsletter.subscribe(`user${i}@example.com`, '192.168.1.100');
    }

    // When - 6th attempt should be rate limited
    const result = await newsletter.subscribe('user6@example.com', '192.168.1.100');

    // Then
    assert(result.success === false, 'Should fail');
    assert(result.error.includes('Rate limit'), 'Error should mention rate limit');

    cleanupTempDirs(dirs);
  });

  // Test unsubscribe
  test('1.0-SVC-109 [P1] NewsletterService.unsubscribe succeeds for valid token', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    const subResult = await newsletter.subscribe('user@example.com', '192.168.1.1');

    // When
    const result = await newsletter.unsubscribe(subResult.data.id);

    // Then
    assert(result.success === true, 'Should succeed');
    assert(result.data !== null, 'Data should exist');
    assert(result.data.unsubscribedAt !== null, 'Should have unsubscribe timestamp');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-110 [P1] NewsletterService.unsubscribe returns error for invalid token', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const result = await newsletter.unsubscribe('invalid-token');

    // Then
    assert(result.success === false, 'Should fail');
    assert.strictEqual(result.error, 'Invalid subscription token', 'Error should match');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-111 [P1] NewsletterService.unsubscribe handles already unsubscribed', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    const subResult = await newsletter.subscribe('user@example.com', '192.168.1.1');
    await newsletter.unsubscribe(subResult.data.id);

    // When
    const result = await newsletter.unsubscribe(subResult.data.id);

    // Then
    assert(result.success === false, 'Should fail');
    assert.strictEqual(result.error, 'Already unsubscribed', 'Error should match');

    cleanupTempDirs(dirs);
  });

  // Test getActiveSubscribers
  test('1.0-SVC-112 [P1] NewsletterService.getActiveSubscribers returns only active subscribers', async () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    const sub1 = await newsletter.subscribe('user1@example.com', '192.168.1.1');
    const sub2 = await newsletter.subscribe('user2@example.com', '192.168.1.1');

    await newsletter.unsubscribe(sub2.data.id);

    // When
    const active = newsletter.getActiveSubscribers();

    // Then
    assert.strictEqual(active.length, 1, 'Should have 1 active subscriber');
    assert.strictEqual(active[0].email, 'user1@example.com', 'Email should match');

    cleanupTempDirs(dirs);
  });

  // Test getNewsletterContent
  test('1.0-SVC-113 [P1] NewsletterService.getNewsletterContent returns default content', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const content = newsletter.getNewsletterContent();

    // Then
    assert(content !== null, 'Content should not be null');
    assert(Array.isArray(content.featuredGames), 'Featured games should be array');
    assert(Array.isArray(content.newAdditions), 'New additions should be array');
    assert(Array.isArray(content.updatedEntries), 'Updated entries should be array');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-114 [P1] NewsletterService.saveNewsletterContent saves content', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const result = newsletter.saveNewsletterContent({
      featuredGames: [{ title: 'Test Game', description: 'Test Desc' }],
      newAdditions: [],
      updatedEntries: []
    });

    // Then
    assert(result === true, 'Should succeed');

    const content = newsletter.getNewsletterContent();
    assert.strictEqual(content.featuredGames.length, 1, 'Should have 1 featured game');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-115 [P1] NewsletterService.updateNewsletterContent updates existing content', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // Add initial content
    newsletter.saveNewsletterContent({
      featuredGames: [],
      newAdditions: [],
      updatedEntries: []
    });

    // When
    const result = newsletter.updateNewsletterContent({
      featuredGames: [{ title: 'New Featured' }],
      newAdditions: [{ title: 'New Game', platform: 'SNES' }],
      updatedEntries: []
    });

    // Then
    assert(result === true, 'Should succeed');

    const content = newsletter.getNewsletterContent();
    assert.strictEqual(content.featuredGames.length, 1, 'Should have 1 featured game');

    cleanupTempDirs(dirs);
  });

  // Test getDeliveryLogs
  test('1.0-SVC-116 [P2] NewsletterService.getDeliveryLogs returns empty array initially', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const logs = newsletter.getDeliveryLogs();

    // Then
    assert(Array.isArray(logs), 'Should return array');
    assert.strictEqual(logs.length, 0, 'Should be empty');

    cleanupTempDirs(dirs);
  });

  // Test deleteByEmail
  test('1.0-SVC-117 [P1] NewsletterService.deleteByEmail removes subscriber', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    newsletter.saveSubscribers([
      { id: '1', email: 'user@example.com', subscribedAt: new Date().toISOString() },
      { id: '2', email: 'other@example.com', subscribedAt: new Date().toISOString() }
    ]);

    // When
    const result = newsletter.deleteByEmail('user@example.com');

    // Then
    assert(result === true, 'Should succeed');

    const subscribers = newsletter.getAllSubscribers();
    assert.strictEqual(subscribers.length, 1, 'Should have 1 subscriber');
    assert.strictEqual(subscribers[0].email, 'other@example.com', 'Other subscriber should remain');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-118 [P1] NewsletterService.deleteByEmail returns false for non-existent email', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const result = newsletter.deleteByEmail('nonexistent@example.com');

    // Then
    assert(result === false, 'Should fail');

    cleanupTempDirs(dirs);
  });

  // Test getStatistics
  test('1.0-SVC-119 [P1] NewsletterService.getStatistics returns correct stats', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    newsletter.saveSubscribers([
      { id: '1', email: 'active@example.com', subscribedAt: new Date().toISOString(), unsubscribedAt: null },
      { id: '2', email: 'unsubscribed@example.com', subscribedAt: new Date().toISOString(), unsubscribedAt: new Date().toISOString() }
    ]);

    // When
    const stats = newsletter.getStatistics();

    // Then
    assert.strictEqual(stats.total, 2, 'Total should be 2');
    assert.strictEqual(stats.active, 1, 'Active should be 1');
    assert.strictEqual(stats.unsubscribed, 1, 'Unsubscribed should be 1');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-120 [P1] NewsletterService.getStatistics with empty list', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const stats = newsletter.getStatistics();

    // Then
    assert.strictEqual(stats.total, 0, 'Total should be 0');
    assert.strictEqual(stats.active, 0, 'Active should be 0');
    assert.strictEqual(stats.unsubscribed, 0, 'Unsubscribed should be 0');

    cleanupTempDirs(dirs);
  });

  // Test getUnsubscribeUrl
  test('1.0-SVC-121 [P1] NewsletterService.getUnsubscribeUrl returns correct URL', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const url = newsletter.getUnsubscribeUrl('test-token-123');

    // Then
    assert.strictEqual(url, 'http://localhost:3000/newsletter/unsubscribe?token=test-token-123', 'URL should match');

    cleanupTempDirs(dirs);
  });

  test('1.0-SVC-122 [P2] NewsletterService.getUnsubscribeUrl uses custom SITE_URL', () => {
    // Given
    const originalSite = process.env.SITE_URL;
    process.env.SITE_URL = 'https://example.com';

    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const url = newsletter.getUnsubscribeUrl('test-token');

    // Then
    assert.strictEqual(url, 'https://example.com/newsletter/unsubscribe?token=test-token', 'URL should match');

    process.env.SITE_URL = originalSite;
    cleanupTempDirs(dirs);
  });

  // Test generateId
  test('1.0-SVC-123 [P1] NewsletterService.generateId returns unique IDs', () => {
    // Given
    const dirs = createTempDirs();
    const newsletter = new NewsletterService(dirs.subscribersFile, null, dirs.contentFile);

    // When
    const id1 = newsletter.generateId();
    const id2 = newsletter.generateId();

    // Then
    assert(id1 !== id2, 'IDs should be unique');
    assert(typeof id1 === 'string', 'ID should be string');
    assert(id1.length > 0, 'ID should not be empty');

    cleanupTempDirs(dirs);
  });

  // Test with custom email service
  test('1.0-SVC-124 [P1] NewsletterService uses custom email service', async () => {
    // Given
    const dirs = createTempDirs();

    let emailServiceCalled = false;
    const mockEmailService = {
      sendEmail: async (to, subject, html) => {
        emailServiceCalled = true;
        return { success: true };
      }
    };

    const newsletter = new NewsletterService(
      dirs.subscribersFile,
      mockEmailService,
      dirs.contentFile
    );

    await newsletter.subscribe('test@example.com', '192.168.1.1');

    // When
    const result = await newsletter.sendNewsletter('Test Subject', {
      featuredGames: [],
      newAdditions: [],
      updatedEntries: []
    });

    // Then
    assert(emailServiceCalled === true, 'Email service should be called');
    assert(result.sent === 1, 'Should send to 1 subscriber');

    cleanupTempDirs(dirs);
  });

});
