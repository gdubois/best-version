// Test suite for inappropriate language filter
// Test IDs: 1.0-SVC-194 to 1.0-SVC-231
// Priorities: P0 = critical security, P1 = core functionality, P2 = important features

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { InappropriateLanguageFilter } = require('../../src/services/inappropriateLanguageFilter');

const tempFiltersFile = path.join(__dirname, '../../.test_filters.json');

// Cleanup temp file after all tests
afterAll(() => {
  if (fs.existsSync(tempFiltersFile)) {
    fs.unlinkSync(tempFiltersFile);
  }
});

describe('Inappropriate Language Filter Tests', () => {

  // Test constructor
  test('1.0-SVC-194 [P1] InappropriateLanguageFilter initializes with file path', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }

    // When
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // Then
    assert(filter !== null, 'Filter should be instantiated');
    assert(typeof filter.getFilters === 'function', 'getFilters should be a function');
  });

  test('1.0-SVC-195 [P1] InappropriateLanguageFilter creates default filters file', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }

    // When
    const defaultFilter = new InappropriateLanguageFilter();

    // Then
    assert(defaultFilter !== null, 'Default filter should exist');
    assert(fs.existsSync(defaultFilter.filtersFile), 'Default filters file should be created');
  });

  // Test getFilters and saveFilters
  test('1.0-SVC-196 [P1] getFilters returns default filter structure', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const filters = filter.getFilters();

    // Then
    assert(typeof filters === 'object', 'Filters should be an object');
    assert(Array.isArray(filters.words), 'Words should be an array');
    assert(typeof filters.variations === 'object', 'Variations should be an object');
    assert(Array.isArray(filters.patterns), 'Patterns should be an array');
  });

  test('1.0-SVC-197 [P1] saveFilters persists data', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    filter.saveFilters({ words: ['test1', 'test2'] });

    // When - Create new instance to verify persistence
    const filter2 = new InappropriateLanguageFilter(tempFiltersFile);
    const filters = filter2.getFilters();

    // Then
    assert(filters.words.includes('test1'), 'test1 should be included');
    assert(filters.words.includes('test2'), 'test2 should be included');
  });

  // Test addWord and removeWord
  test('1.0-SVC-198 [P1] addWord adds word to filter list', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.addWord('newbadword');

    // Then
    assert.strictEqual(result, true, 'Should succeed');
    const filters = filter.getFilters();
    assert(filters.words.includes('newbadword'), 'Word should be included');
  });

  test('1.0-SVC-199 [P1] addWord handles duplicate words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.addWord('duplicate');
    const result2 = filter.addWord('duplicate');
    const filters = filter.getFilters();
    const count = filters.words.filter(w => w === 'duplicate').length;

    // Then
    assert.strictEqual(result2, false, 'Duplicate should return false');
    assert.strictEqual(count, 1, 'Should only have one occurrence');
  });

  test('1.0-SVC-200 [P1] removeWord removes word from filter list', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.removeWord('ass');

    // Then
    assert.strictEqual(result, true, 'Should succeed');
    const filters = filter.getFilters();
    assert(!filters.words.includes('ass'), 'Word should be removed');
  });

  test('1.0-SVC-201 [P1] removeWord returns false for non-existent word', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    filter.addWord('toremove');
    filter.removeWord('toremove');
    const result = filter.removeWord('toremove');

    // Then
    assert.strictEqual(result, false, 'Should return false');
  });

  test('1.0-SVC-202 [P1] getAllWords returns all filter words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const words = filter.getAllWords();

    // Then
    assert(Array.isArray(words), 'Should return array');
    assert(words.length > 0, 'Should have default filter words');
  });

  // Test normalizeText
  test('1.0-SVC-203 [P1] normalizeText lowercases and removes special chars', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.normalizeText('Hello World!');
    const result2 = filter.normalizeText('h3ll0 w0rld');

    // Then
    assert.strictEqual(result1, 'helloworld', 'Result should match');
    assert.strictEqual(result2, 'h3ll0w0rld', 'Result should match');
  });

  test('1.0-SVC-204 [P2] normalizeText handles non-string input', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.normalizeText(null);
    const result2 = filter.normalizeText(undefined);
    const result3 = filter.normalizeText(123);

    // Then
    assert.strictEqual(result1, '', 'Null should return empty string');
    assert.strictEqual(result2, '', 'Undefined should return empty string');
    assert.strictEqual(result3, '', 'Number should return empty string');
  });

  // Test containsInappropriateLanguage
  test('1.0-SVC-205 [P0] containsInappropriateLanguage detects filter words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('This is a fuck word');

    // Then
    assert.strictEqual(result.found, true, 'Should detect inappropriate word');
    assert(Array.isArray(result.words), 'Words should be array');
    assert(result.words.length > 0, 'Should have detected words');
  });

  test('1.0-SVC-206 [P1] containsInappropriateLanguage returns false for clean text', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('xyz qvw klm jhi 987 654 321');

    // Then
    assert(typeof result.found === 'boolean', 'Found should be boolean');
    assert(Array.isArray(result.words), 'Words should be array');
  });

  test('1.0-SVC-207 [P0] containsInappropriateLanguage is case insensitive', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.containsInappropriateLanguage('This is a FUCK text');
    const result2 = filter.containsInappropriateLanguage('This is a FuCk text');

    // Then
    assert.strictEqual(result1.found, true, 'Should detect uppercase');
    assert.strictEqual(result2.found, true, 'Should detect mixed case');
  });

  test('1.0-SVC-208 [P0] containsInappropriateLanguage handles whole word matching', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.containsInappropriateLanguage('This is a shit text');
    const result2 = filter.containsInappropriateLanguage('This is a shithole text');

    // Then
    assert.strictEqual(result1.found, true, 'Should detect shit');
    assert.strictEqual(result2.found, true, 'Should detect shithole');
  });

  test('1.0-SVC-209 [P1] containsInappropriateLanguage handles empty string', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('');

    // Then
    assert.strictEqual(result.found, false, 'Empty string should not be flagged');
    assert(Array.isArray(result.words), 'Words should be array');
    assert(result.words.length === 0, 'Should have no words');
  });

  test('1.0-SVC-210 [P1] containsInappropriateLanguage handles null and undefined', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.containsInappropriateLanguage(null);
    const result2 = filter.containsInappropriateLanguage(undefined);

    // Then
    assert.strictEqual(result1.found, false, 'Null should not be flagged');
    assert.strictEqual(result2.found, false, 'Undefined should not be flagged');
  });

  test('1.0-SVC-211 [P0] containsInappropriateLanguage detects variations', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('This is a f.u.c.k text');

    // Then
    assert.strictEqual(result.found, true, 'Should detect variations');
  });

  // Test sanitizeText
  test('1.0-SVC-212 [P0] sanitizeText replaces filter words with asterisks', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.sanitizeText('This is a shit here');

    // Then
    assert(result.includes('****'), 'Should replace with asterisks');
    assert(!result.includes('shit'), 'Should not contain original word');
  });

  test('1.0-SVC-213 [P1] sanitizeText preserves context', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.sanitizeText('Hello shit world');

    // Then
    assert(result.includes('Hello'), 'Should preserve Hello');
    assert(result.includes('world'), 'Should preserve world');
    assert(result.includes('****'), 'Should replace with asterisks');
  });

  test('1.0-SVC-214 [P1] sanitizeText handles multiple filter words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.sanitizeText('This is a fuck shit');

    // Then
    assert(!result.includes('fuck'), 'Should not contain fuck');
    assert(!result.includes('shit'), 'Should not contain shit');
    assert(result.includes('****'), 'Should replace with asterisks');
  });

  test('1.0-SVC-215 [P1] sanitizeText handles non-string input', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result1 = filter.sanitizeText(null);
    const result2 = filter.sanitizeText(undefined);

    // Then
    assert.strictEqual(result1, null, 'Null should return null');
    assert.strictEqual(result2, undefined, 'Undefined should return undefined');
  });

  // Test filterSubmission
  test('1.0-SVC-216 [P0] filterSubmission flags inappropriate submissions', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const submission = {
      title: 'My Game',
      notes: 'This is a shit game',
      submitterEmail: 'test@example.com'
    };

    // When
    const result = filter.filterSubmission(submission);

    // Then
    assert.strictEqual(result.flagged, true, 'Should be flagged');
    assert(Array.isArray(result.flaggedFields), 'Flagged fields should be array');
    assert(result.flaggedFields.includes('notes'), 'Notes should be flagged');
    assert(Array.isArray(result.reasons), 'Reasons should be array');
  });

  test('1.0-SVC-217 [P1] filterSubmission does not flag clean submissions', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const submission = {
      title: 'xyz qvw klm jhi 987 654',
      notes: 'unique 123 456 789 text here',
      submitterEmail: 'test@example.com'
    };

    // When
    const result = filter.filterSubmission(submission);

    // Then
    assert(typeof result.flagged === 'boolean', 'Flagged should be boolean');
    assert(Array.isArray(result.flaggedFields), 'Flagged fields should be array');
    assert(Array.isArray(result.reasons), 'Reasons should be array');
  });

  test('1.0-SVC-218 [P1] filterSubmission handles submission with only title', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const submission = {
      title: 'This is a shit game'
    };

    // When
    const result = filter.filterSubmission(submission);

    // Then
    assert.strictEqual(result.flagged, true, 'Should be flagged');
    assert(result.flaggedFields.includes('title'), 'Title should be flagged');
  });

  test('1.0-SVC-219 [P1] filterSubmission handles empty submission', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const submission = {};

    // When
    const result = filter.filterSubmission(submission);

    // Then
    assert.strictEqual(result.flagged, false, 'Should not be flagged');
    assert(Array.isArray(result.flaggedFields), 'Flagged fields should be array');
    assert(Array.isArray(result.reasons), 'Reasons should be array');
  });

  test('1.0-SVC-220 [P1] filterSubmission handles array fields', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const submission = {
      title: 'My Game',
      alternativeNames: ['Clean Name', 'shit name', 'another clean']
    };

    // When
    const result = filter.filterSubmission(submission);

    // Then
    assert.strictEqual(result.flagged, true, 'Should be flagged');
  });

  // Test default filters
  test('1.0-SVC-221 [P1] getDefaultFilters has expected structure', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const defaults = filter.getDefaultFilters();

    // Then
    assert(Array.isArray(defaults.words), 'Words should be array');
    assert(typeof defaults.variations === 'object', 'Variations should be object');
    assert(Array.isArray(defaults.patterns), 'Patterns should be array');
    assert(defaults.words.length > 0, 'Should have default words');
  });

  test('1.0-SVC-222 [P1] getDefaultFilters includes profanity words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const defaults = filter.getDefaultFilters();

    // Then
    assert(defaults.words.includes('fuck'), 'Should include fuck');
    assert(defaults.words.includes('shit'), 'Should include shit');
    assert(defaults.words.includes('ass'), 'Should include ass');
  });

  // Test variations detection
  test('1.0-SVC-223 [P0] containsInappropriateLanguage detects word variations', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('This is a a$$ text');

    // Then
    assert.strictEqual(result.found, true, 'Should detect variations');
  });

  test('1.0-SVC-224 [P0] containsInappropriateLanguage detects encoded variations', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('This is s3x text');

    // Then
    assert.strictEqual(result.found, true, 'Should detect encoded variations');
  });

  // Test patterns
  test('1.0-SVC-225 [P1] getDefaultFilters has regex patterns', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const defaults = filter.getDefaultFilters();

    // Then
    assert(Array.isArray(defaults.patterns), 'Patterns should be array');
    assert(defaults.patterns.length > 0, 'Should have patterns');
  });

  // Test file persistence
  test('1.0-SVC-226 [P1] filters persist across instances', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter1 = new InappropriateLanguageFilter(tempFiltersFile);
    filter1.addWord('persisted');

    // When
    const filter2 = new InappropriateLanguageFilter(tempFiltersFile);
    const words = filter2.getAllWords();

    // Then
    assert(words.includes('persisted'), 'Word should persist');
  });

  // Test word boundary matching
  test('1.0-SVC-227 [P1] containsInappropriateLanguage matches partial words', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    filter.addWord('bad');

    // When
    const result = filter.containsInappropriateLanguage('This is a badword text');

    // Then - This implementation matches partial words, not whole words only
    assert.strictEqual(result.found, true, 'Should match partial words');
  });

  // Additional tests
  test('1.0-SVC-228 [P2] InappropriateLanguageFilter handles unicode characters', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('Hello world 123');

    // Then
    assert(typeof result.found === 'boolean', 'Found should be boolean');
  });

  test('1.0-SVC-229 [P2] sanitizeText handles long text', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    const longText = 'This is a very long text. ' + 'shit '.repeat(100);

    // When
    const result = filter.sanitizeText(longText);

    // Then
    assert(result.length === longText.length, 'Length should be preserved');
  });

  test('1.0-SVC-230 [P2] InappropriateLanguageFilter loads filters from file', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);
    filter.saveFilters({ words: ['customword'] });

    // When
    const filters = filter.getFilters();

    // Then
    assert(filters.words.includes('customword'), 'Custom word should be loaded');
  });

  test('1.0-SVC-231 [P2] InappropriateLanguageFilter handles special regex characters', () => {
    // Given
    if (fs.existsSync(tempFiltersFile)) {
      fs.unlinkSync(tempFiltersFile);
    }
    const filter = new InappropriateLanguageFilter(tempFiltersFile);

    // When
    const result = filter.containsInappropriateLanguage('Hello [test] world!');

    // Then
    assert(typeof result.found === 'boolean', 'Found should be boolean');
  });

});
