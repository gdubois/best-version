// Test suite for input sanitization middleware
// Test IDs: 1.0-MW-051 to 1.0-MW-084
// Priorities: P0 = critical security, P1 = core functionality, P2 = important features

const assert = require('assert');
const { Sanitizer } = require('../../src/middleware/sanitize');

describe('Sanitization Middleware Tests', () => {

  // Test stripTags
  test('1.0-MW-051 [P1] stripTags removes HTML tags', () => {
    // Then
    assert.strictEqual(Sanitizer.stripTags('<p>Hello</p>'), 'Hello', 'P tags should be removed');
    assert.strictEqual(Sanitizer.stripTags('<div class="test">Content</div>'), 'Content', 'Div tags should be removed');
    assert.strictEqual(Sanitizer.stripTags('No tags here'), 'No tags here', 'Plain text should pass through');
  });

  test('1.0-MW-052 [P1] stripTags handles nested tags', () => {
    // Then
    assert.strictEqual(Sanitizer.stripTags('<div><span>Hello</span> World</div>'), 'Hello World', 'Nested tags should be removed');
  });

  test('1.0-MW-053 [P1] stripTags handles self-closing tags', () => {
    // Then
    assert.strictEqual(Sanitizer.stripTags('<br/><hr/>'), '', 'Self-closing tags should be removed');
  });

  test('1.0-MW-054 [P1] stripTags handles null and non-string inputs', () => {
    // Then
    assert.strictEqual(Sanitizer.stripTags(null), null, 'Null should return null');
    assert.strictEqual(Sanitizer.stripTags(undefined), undefined, 'Undefined should return undefined');
    assert.strictEqual(Sanitizer.stripTags(123), 123, 'Numbers should pass through');
  });

  // Test escapeHtml
  test('1.0-MW-055 [P0] escapeHtml escapes special characters', () => {
    // Then
    assert.strictEqual(Sanitizer.escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'Script tags should be escaped');
    assert.strictEqual(Sanitizer.escapeHtml('5 < 10 && 10 > 5'), '5 &lt; 10 &amp;&amp; 10 &gt; 5', 'Comparison operators should be escaped');
    assert.strictEqual(Sanitizer.escapeHtml('He said "hello"'), 'He said &quot;hello&quot;', 'Quotes should be escaped');
  });

  test('1.0-MW-056 [P1] escapeHtml handles safe strings', () => {
    // Then
    assert.strictEqual(Sanitizer.escapeHtml('Hello World'), 'Hello World', 'Safe string should pass through');
    assert.strictEqual(Sanitizer.escapeHtml('12345'), '12345', 'Numbers should pass through');
  });

  test('1.0-MW-057 [P1] escapeHtml handles null and non-string inputs', () => {
    // Then
    assert.strictEqual(Sanitizer.escapeHtml(null), null, 'Null should return null');
    assert.strictEqual(Sanitizer.escapeHtml(undefined), undefined, 'Undefined should return undefined');
    assert.strictEqual(Sanitizer.escapeHtml(123), 123, 'Numbers should pass through');
  });

  // Test sanitize
  test('1.0-MW-058 [P0] sanitize removes script tags', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<script>alert("xss")</script>'), '', 'Script tags should be removed');
    assert.strictEqual(Sanitizer.sanitize('Hello <script>evil()</script> World'), 'Hello  World', 'Script should be removed from middle');
  });

  test('1.0-MW-059 [P0] sanitize removes javascript: protocol', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<a href="javascript:alert(1)">Click</a>'), '<a href="">Click</a>', 'javascript: should be removed');
    assert.strictEqual(Sanitizer.sanitize('URL: javascript:void(0)'), 'URL: void(0)', 'javascript: in URL should be removed');
  });

  test('1.0-MW-060 [P0] sanitize removes event handlers', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<img src=x onerror=alert(1)>'), '<img src=x >', 'onerror should be removed');
    assert.strictEqual(Sanitizer.sanitize('<button onclick="evil()">Click</button>'), '<button >Click</button>', 'onclick should be removed');
  });

  test('1.0-MW-061 [P0] sanitize removes iframe tags', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<iframe src="evil.com"></iframe>'), '', 'Iframe should be removed');
  });

  test('1.0-MW-062 [P0] sanitize removes object and embed tags', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<object data="evil.swf"></object>'), '', 'Object should be removed');
    assert.strictEqual(Sanitizer.sanitize('<embed src="evil.swf">'), '', 'Embed should be removed');
  });

  test('1.0-MW-063 [P0] sanitize removes link and meta tags', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<link rel="stylesheet" href="evil.css">'), '', 'Link should be removed');
    assert.strictEqual(Sanitizer.sanitize('<meta http-equiv="refresh" content="URL=evil.com">'), '', 'Meta should be removed');
  });

  test('1.0-MW-064 [P0] sanitize removes style tags', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('<style>body{background:url(evil)}</style>'), '', 'Style should be removed');
  });

  test('1.0-MW-065 [P0] sanitize removes eval and document access', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('eval("evil code")'), ' code', 'eval should be removed');
    assert.strictEqual(Sanitizer.sanitize('document.cookie'), ' cookie', 'document.cookie should be removed');
    assert.strictEqual(Sanitizer.sanitize('window.location'), ' location', 'window.location should be removed');
  });

  test('1.0-MW-066 [P0] sanitize removes innerHTML and outerHTML', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('element.innerHTML = data'), 'element = data', 'innerHTML should be removed');
    assert.strictEqual(Sanitizer.sanitize('element.outerHTML = data'), 'element = data', 'outerHTML should be removed');
  });

  test('1.0-MW-067 [P0] sanitize removes encoded attack vectors', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('&lt;script&gt;alert(1)&lt;/script&gt;'), '', 'Encoded script should be removed');
    assert.strictEqual(Sanitizer.sanitize('%3cscript%3e'), '', 'URL-encoded script should be removed');
  });

  test('1.0-MW-068 [P1] sanitize preserves safe content', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize('Hello World'), 'Hello World', 'Safe text should pass through');
    assert.strictEqual(Sanitizer.sanitize('Normal text with numbers 123'), 'Normal text with numbers 123', 'Numbers should pass through');
    assert.strictEqual(Sanitizer.sanitize('Email: test@example.com'), 'Email: test@example.com', 'Email should pass through');
    assert.strictEqual(Sanitizer.sanitize('Price: $100'), 'Price: $100', 'Currency should pass through');
  });

  test('1.0-MW-069 [P1] sanitize handles null and non-string inputs', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitize(null), null, 'Null should return null');
    assert.strictEqual(Sanitizer.sanitize(undefined), undefined, 'Undefined should return undefined');
    assert.strictEqual(Sanitizer.sanitize(123), 123, 'Numbers should pass through');
    assert.strictEqual(Sanitizer.sanitize(true), true, 'Booleans should pass through');
  });

  // Test sanitizeObject
  test('1.0-MW-070 [P1] sanitizeObject sanitizes strings in object', () => {
    // Given
    const input = {
      name: 'John',
      description: '<script>evil()</script>',
      value: 123
    };

    // When
    const output = Sanitizer.sanitizeObject(input);

    // Then
    assert.strictEqual(output.name, 'John', 'Safe string should pass through');
    assert.strictEqual(output.description, '', 'Malicious script should be removed');
    assert.strictEqual(output.value, 123, 'Numbers should pass through');
  });

  test('1.0-MW-071 [P1] sanitizeObject handles nested objects', () => {
    // Given
    const input = {
      user: {
        name: 'John',
        bio: '<script>alert(1)</script>'
      },
      posts: [
        { title: 'Safe Post' },
        { title: '<script>bad()</script>' }
      ]
    };

    // When
    const output = Sanitizer.sanitizeObject(input);

    // Then
    assert.strictEqual(output.user.bio, '', 'Nested script should be removed');
    assert.strictEqual(output.posts[1].title, '', 'Array nested script should be removed');
  });

  test('1.0-MW-072 [P1] sanitizeObject handles arrays', () => {
    // Given
    const input = {
      tags: ['<script>evil()</script>', 'safe', '<b>bold</b>']
    };

    // When
    const output = Sanitizer.sanitizeObject(input);

    // Then
    assert.strictEqual(output.tags[0], '', 'First tag script should be removed');
    assert.strictEqual(output.tags[1], 'safe', 'Safe tag should pass through');
    assert.strictEqual(output.tags[2], 'bold', 'B tags should be removed');
  });

  test('1.0-MW-073 [P1] sanitizeObject handles null and undefined', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitizeObject(null), null, 'Null should return null');
    assert.strictEqual(Sanitizer.sanitizeObject(undefined), undefined, 'Undefined should return undefined');
  });

  test('1.0-MW-074 [P1] sanitizeObject preserves numbers and booleans', () => {
    // Given
    const input = {
      count: 42,
      active: true,
      disabled: false,
      nullable: null
    };

    // When
    const output = Sanitizer.sanitizeObject(input);

    // Then
    assert.strictEqual(output.count, 42, 'Count should pass through');
    assert.strictEqual(output.active, true, 'Active should pass through');
    assert.strictEqual(output.disabled, false, 'Disabled should pass through');
    assert.strictEqual(output.nullable, null, 'Nullable should be null');
  });

  // Test sanitizeTrim
  test('1.0-MW-075 [P1] sanitizeTrim sanitizes and trims', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitizeTrim('  <script>evil()</script>  '), '', 'Script with whitespace should be removed and trimmed');
    assert.strictEqual(Sanitizer.sanitizeTrim('  Safe Content  '), 'Safe Content', 'Content with whitespace should be trimmed');
  });

  test('1.0-MW-076 [P1] sanitizeTrim handles null and non-string inputs', () => {
    // Then
    assert.strictEqual(Sanitizer.sanitizeTrim(null), null, 'Null should return null');
    assert.strictEqual(Sanitizer.sanitizeTrim(undefined), undefined, 'Undefined should return undefined');
    assert.strictEqual(Sanitizer.sanitizeTrim(123), 123, 'Numbers should pass through');
  });

  // Test containsSuspiciousContent
  test('1.0-MW-077 [P0] containsSuspiciousContent detects script tags', () => {
    // Then
    assert.strictEqual(Sanitizer.containsSuspiciousContent('<script>alert(1)</script>'), true, 'Script tags should be detected');
    assert.strictEqual(Sanitizer.containsSuspiciousContent('<div>Safe</div>'), false, 'Safe div should not be detected');
  });

  test('1.0-MW-078 [P0] containsSuspiciousContent detects javascript protocol', () => {
    // Then
    assert.strictEqual(Sanitizer.containsSuspiciousContent('javascript:void(0)'), true, 'Javascript protocol should be detected');
    assert.strictEqual(Sanitizer.containsSuspiciousContent('https://example.com'), false, 'HTTPS URL should not be detected');
  });

  // Additional tests
  test('1.0-MW-079 [P0] containsSuspiciousContent detects event handlers', () => {
    // Then
    assert.strictEqual(Sanitizer.containsSuspiciousContent('onclick="evil()"'), true, 'onshould be detected');
    assert.strictEqual(Sanitizer.containsSuspiciousContent('onerror="alert(1)"'), true, 'onerror should be detected');
  });

  test('1.0-MW-080 [P2] containsSuspiciousContent returns false for empty string', () => {
    // Then
    assert.strictEqual(Sanitizer.containsSuspiciousContent(''), false, 'Empty string should not be detected');
  });

  test('1.0-MW-081 [P1] containsSuspiciousContent handles null and non-string inputs', () => {
    // Then
    assert.strictEqual(Sanitizer.containsSuspiciousContent(null), false, 'Null should return false');
    assert.strictEqual(Sanitizer.containsSuspiciousContent(undefined), false, 'Undefined should return false');
    assert.strictEqual(Sanitizer.containsSuspiciousContent(123), false, 'Numbers should return false');
  });

  // Test getDetectedPatterns
  test('1.0-MW-082 [P1] getDetectedPatterns returns detected patterns', () => {
    // When
    const patterns = Sanitizer.getDetectedPatterns('<script>alert(1)</script>');

    // Then
    assert(Array.isArray(patterns), 'Patterns should be array');
    assert(patterns.length > 0, 'Should have at least one pattern');
  });

  test('1.0-MW-083 [P2] getDetectedPatterns returns empty array for safe content', () => {
    // When
    const patterns = Sanitizer.getDetectedPatterns('Safe content');

    // Then
    assert(Array.isArray(patterns), 'Patterns should be array');
    assert(patterns.length === 0, 'Should have no patterns');
  });

  test('1.0-MW-084 [P2] getDetectedPatterns handles null input', () => {
    // Then
    assert.deepStrictEqual(Sanitizer.getDetectedPatterns(null), [], 'Null should return empty array');
  });

});
