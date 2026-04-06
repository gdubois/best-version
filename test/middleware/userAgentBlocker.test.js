// Test suite for user-agent blocking middleware
// Test IDs: 1.0-MW-135 to 1.0-MW-149
// Priorities: P0 = critical security, P1 = core functionality, P2 = important features

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { UserAgentBlocker } = require('../../src/middleware/userAgentBlocker');

const testDir = path.join(__dirname, 'temp_ua_test');

// Setup test directory
beforeAll(() => {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

// Cleanup test directory after all tests
afterAll(() => {
  if (fs.existsSync(testDir)) {
    try {
      const files = fs.readdirSync(testDir);
      files.forEach(file => {
        const filePath = path.join(testDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(testDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});

describe('User-Agent Blocker Tests', () => {

  // Test UserAgentBlocker class
  test('1.0-MW-135 [P1] UserAgentBlocker initializes with blocklist file', () => {
    // When
    const blocker = new UserAgentBlocker(path.join(testDir, '.blocked_useragents.json'));

    // Then
    assert(blocker !== null, 'Blocker should be instantiated');
    assert.strictEqual(blocker.blocklistFile, path.join(testDir, '.blocked_useragents.json'), 'Blocklist file should match');
  });

  test('1.0-MW-136 [P1] UserAgentBlocker creates default blocklist if not exists', () => {
    // Given
    const blocklistFile = path.join(testDir, 'custom_blocklist.json');

    // When
    const blocker = new UserAgentBlocker(blocklistFile);

    // Then
    assert(fs.existsSync(blocklistFile), 'Blocklist file should be created');
  });

  test('1.0-MW-137 [P1] UserAgentBlocker gets default blocklist patterns', () => {
    // When
    const blocker = new UserAgentBlocker(path.join(testDir, 'default.json'));
    const blocklist = blocker.getDefaultBlocklist();

    // Then
    assert(Array.isArray(blocklist.patterns), 'Patterns should be array');
    assert(Array.isArray(blocklist.allowlist), 'Allowlist should be array');
  });

  test('1.0-MW-138 [P1] UserAgentBlocker default blocklist includes common scrapers', () => {
    // When
    const blocker = new UserAgentBlocker(path.join(testDir, 'patterns.json'));
    const blocklist = blocker.getDefaultBlocklist();
    const patterns = blocklist.patterns;

    // Then
    assert(patterns.some(p => p.includes('python-requests')), 'Should block python-requests');
    assert(patterns.some(p => p.includes('curl')), 'Should block curl');
    assert(patterns.some(p => p.includes('scrapy')), 'Should block scrapy');
    assert(patterns.some(p => p.includes('bot')), 'Should block bots');
  });

  test('1.0-MW-139 [P1] UserAgentBlocker default allowlist includes legitimate crawlers', () => {
    // When
    const blocker = new UserAgentBlocker(path.join(testDir, 'allow.json'));
    const blocklist = blocker.getDefaultBlocklist();
    const allowlist = blocklist.allowlist;

    // Then
    assert(allowlist.some(a => a.includes('googlebot')), 'Should allow googlebot');
    assert(allowlist.some(a => a.includes('bingbot')), 'Should allow bingbot');
    assert(allowlist.some(a => a.includes('duckduckbot')), 'Should allow duckduckbot');
  });

  test('1.0-MW-140 [P1] UserAgentBlocker gets current blocklist from file', () => {
    // Given
    const blocklistFile = path.join(testDir, 'custom.json');
    const customBlocklist = {
      patterns: ['custom-pattern'],
      allowlist: ['custom-allow']
    };
    fs.writeFileSync(blocklistFile, JSON.stringify(customBlocklist));

    // When
    const blocker = new UserAgentBlocker(blocklistFile);
    const blocklist = blocker.getBlocklist();

    // Then
    assert(blocklist.patterns.includes('custom-pattern'), 'Custom pattern should be loaded');
  });

  test('1.0-MW-141 [P1] UserAgentBlocker saves blocklist to file', () => {
    // Given
    const blocklistFile = path.join(testDir, 'save-test.json');
    const blocker = new UserAgentBlocker(blocklistFile);
    const blocklist = { patterns: ['test'], allowlist: [] };

    // When
    const result = blocker.saveBlocklist(blocklist);

    // Then
    assert.strictEqual(result, true, 'Save should succeed');
    assert(fs.existsSync(blocklistFile), 'Blocklist file should exist');
  });

  test('1.0-MW-142 [P1] UserAgentBlocker saveBlocklist returns false on error', () => {
    // Given
    const blocker = new UserAgentBlocker('/nonexistent/path/blocklist.json');

    // When
    const result = blocker.saveBlocklist({ patterns: [], allowlist: [] });

    // Then
    assert.strictEqual(result, false, 'Save should fail');
  });

  test('1.0-MW-143 [P2] UserAgentBlocker handles invalid blocklist file gracefully', () => {
    // Given
    const blocklistFile = path.join(testDir, 'invalid.json');
    fs.writeFileSync(blocklistFile, 'not valid json');

    // When
    const blocker = new UserAgentBlocker(blocklistFile);
    const blocklist = blocker.getBlocklist();

    // Then - Should fall back to default blocklist
    assert(Array.isArray(blocklist.patterns), 'Should have default patterns');
  });

  test('1.0-MW-144 [P1] UserAgentBlocker allows whitelisted user-agents', () => {
    // Given
    const blocker = new UserAgentBlocker(path.join(testDir, 'allowlist-test.json'));

    // When
    const blocklist = blocker.getDefaultBlocklist();

    // Then
    assert(blocklist.allowlist.includes('googlebot'), 'googlebot should be in allowlist');
    assert(blocklist.allowlist.includes('bingbot'), 'bingbot should be in allowlist');
  });

  test('1.0-MW-145 [P1] UserAgentBlocker blocklist includes SEO tools', () => {
    // Given
    const blocker = new UserAgentBlocker(path.join(testDir, 'seo.json'));

    // When
    const blocklist = blocker.getDefaultBlocklist();
    const patterns = blocklist.patterns;

    // Then
    assert(patterns.some(p => p.includes('ahrefsbot')), 'Should block ahrefsbot');
    assert(patterns.some(p => p.includes('semrushbot')), 'Should block semrushbot');
  });

  test('1.0-MW-146 [P1] UserAgentBlocker blocklist includes monitoring tools', () => {
    // Given
    const blocker = new UserAgentBlocker(path.join(testDir, 'monitor.json'));

    // When
    const blocklist = blocker.getDefaultBlocklist();
    const patterns = blocklist.patterns;

    // Then
    assert(patterns.some(p => p.includes('uptime robot')), 'Should block uptime robot');
  });

  test('1.0-MW-147 [P1] UserAgentBlocker blocklist includes mass downloaders', () => {
    // Given
    const blocker = new UserAgentBlocker(path.join(testDir, 'download.json'));

    // When
    const blocklist = blocker.getDefaultBlocklist();
    const patterns = blocklist.patterns;

    // Then
    assert(patterns.some(p => p.includes('httrack')), 'Should block httrack');
    assert(patterns.some(p => p.includes('getright')), 'Should block getright');
  });

  test('1.0-MW-148 [P2] UserAgentBlocker handles missing blocklist file', () => {
    // Given
    const blocklistFile = path.join(testDir, 'nonexistent.json');

    // When
    const blocker = new UserAgentBlocker(blocklistFile);

    // Then - Should create default blocklist
    const blocklist = blocker.getBlocklist();
    assert(Array.isArray(blocklist.patterns), 'Should have default patterns');
  });

  test('1.0-MW-149 [P2] UserAgentBlocker custom blocklist overrides defaults', () => {
    // Given
    const blocklistFile = path.join(testDir, 'override.json');
    const customBlocklist = {
      patterns: ['custom-block'],
      allowlist: ['custom-allow']
    };
    fs.writeFileSync(blocklistFile, JSON.stringify(customBlocklist));
    const blocker = new UserAgentBlocker(blocklistFile);

    // When
    const blocklist = blocker.getBlocklist();

    // Then
    assert(blocklist.patterns.includes('custom-block'), 'Custom pattern should override');
    assert(blocklist.allowlist.includes('custom-allow'), 'Custom allow should override');
  });

});
