// Test suite for Roman Numeral utilities
// Test IDs: 1.0-UTIL-001 to 1.0-UTIL-024
// Priorities: P1 = core functionality, P2 = important features, P3 = edge cases

const assert = require('assert');
const {
  ROMAN_MAP,
  INTEGER_TO_ROMAN,
  romanToInteger,
  integerToRoman,
  isExactRomanNumeral,
  isExactSingleDigit,
  findRomanNumerals,
  findArabicNumerals,
  normalizeSearchQuery,
  generateQueryVariations
} = require('../../src/utils/romanNumeral');

describe('Roman Numeral Utility Tests', () => {

  // Test ROMAN_MAP and INTEGER_TO_ROMAN constants
  test('1.0-UTIL-001 [P1] ROMAN_MAP contains expected values', () => {
    // Given the ROMAN_MAP constant
    // When accessing known values
    assert.strictEqual(ROMAN_MAP['I'], 1, 'I should map to 1');
    assert.strictEqual(ROMAN_MAP['X'], 10, 'X should map to 10');
    assert.strictEqual(ROMAN_MAP['XXV'], 25, 'XXV should map to 25');
    assert.strictEqual(ROMAN_MAP['XXX'], 30, 'XXX should map to 30');
  });

  test('1.0-UTIL-002 [P1] INTEGER_TO_ROMAN contains expected values', () => {
    // Given the INTEGER_TO_ROMAN constant
    assert.strictEqual(INTEGER_TO_ROMAN[1], 'I', '1 should map to I');
    assert.strictEqual(INTEGER_TO_ROMAN[10], 'X', '10 should map to X');
    assert.strictEqual(INTEGER_TO_ROMAN[25], 'XXV', '25 should map to XXV');
    assert.strictEqual(INTEGER_TO_ROMAN[30], 'XXX', '30 should map to XXX');
  });

  // Test romanToInteger function
  test('1.0-UTIL-003 [P1] romanToInteger converts valid Roman numerals', () => {
    // Given valid Roman numeral strings
    // When converting them
    assert.strictEqual(romanToInteger('I'), 1, 'I should be 1');
    assert.strictEqual(romanToInteger('V'), 5, 'V should be 5');
    assert.strictEqual(romanToInteger('X'), 10, 'X should be 10');
    assert.strictEqual(romanToInteger('XII'), 12, 'XII should be 12');
    assert.strictEqual(romanToInteger('XXV'), 25, 'XXV should be 25');
  });

  test('1.0-UTIL-004 [P1] romanToInteger handles case insensitivity', () => {
    // Given mixed case Roman numerals
    assert.strictEqual(romanToInteger('vi'), 6, 'vi should be 6');
    assert.strictEqual(romanToInteger('VII'), 7, 'VII should be 7');
    assert.strictEqual(romanToInteger('xii'), 12, 'xii should be 12');
  });

  test('1.0-UTIL-005 [P2] romanToInteger returns null for invalid inputs', () => {
    // Given invalid inputs
    assert.strictEqual(romanToInteger(null), null, 'Null should return null');
    assert.strictEqual(romanToInteger(undefined), null, 'Undefined should return null');
    assert.strictEqual(romanToInteger(''), null, 'Empty string should return null');
    assert.strictEqual(romanToInteger('ABC'), null, 'Invalid should return null');
    assert.strictEqual(romanToInteger('VIIII'), null, 'Invalid Roman should return null');
  });

  // Test integerToRoman function
  test('1.0-UTIL-006 [P1] integerToRoman converts valid integers', () => {
    // Given valid integers in range 1-30
    assert.strictEqual(integerToRoman(1), 'I', '1 should be I');
    assert.strictEqual(integerToRoman(5), 'V', '5 should be V');
    assert.strictEqual(integerToRoman(10), 'X', '10 should be X');
    assert.strictEqual(integerToRoman(12), 'XII', '12 should be XII');
    assert.strictEqual(integerToRoman(25), 'XXV', '25 should be XXV');
    assert.strictEqual(integerToRoman(30), 'XXX', '30 should be XXX');
  });

  test('1.0-UTIL-007 [P2] integerToRoman returns null for invalid inputs', () => {
    // Given invalid inputs
    assert.strictEqual(integerToRoman(0), null, '0 should return null');
    assert.strictEqual(integerToRoman(-1), null, '-1 should return null');
    assert.strictEqual(integerToRoman(31), null, '31 should return null');
    assert.strictEqual(integerToRoman('5'), null, 'String 5 should return null');
    assert.strictEqual(integerToRoman(null), null, 'Null should return null');
  });

  // Test isExactRomanNumeral function
  test('1.0-UTIL-008 [P1] isExactRomanNumeral detects exact Roman numerals', () => {
    // Given valid Roman numeral strings
    assert.strictEqual(isExactRomanNumeral('I'), true, 'I should be valid');
    assert.strictEqual(isExactRomanNumeral('X'), true, 'X should be valid');
    assert.strictEqual(isExactRomanNumeral('XXV'), true, 'XXV should be valid');
    assert.strictEqual(isExactRomanNumeral('XXX'), true, 'XXX should be valid');
  });

  test('1.0-UTIL-009 [P2] isExactRomanNumeral rejects non-Roman strings', () => {
    // Given non-Roman inputs
    assert.strictEqual(isExactRomanNumeral('VIIII'), false, 'VIIII should be invalid');
    assert.strictEqual(isExactRomanNumeral('ABC'), false, 'ABC should be invalid');
    assert.strictEqual(isExactRomanNumeral('Final Fantasy'), false, 'Final Fantasy should be invalid');
    assert.strictEqual(isExactRomanNumeral(''), false, 'Empty should be invalid');
    assert.strictEqual(isExactRomanNumeral(null), false, 'Null should be invalid');
  });

  // Test isExactSingleDigit function
  test('1.0-UTIL-010 [P1] isExactSingleDigit detects single digits', () => {
    // Given single digit strings
    assert.strictEqual(isExactSingleDigit('1'), true, '1 should be single digit');
    assert.strictEqual(isExactSingleDigit('5'), true, '5 should be single digit');
    assert.strictEqual(isExactSingleDigit('9'), true, '9 should be single digit');
  });

  test('1.0-UTIL-011 [P2] isExactSingleDigit rejects multi-digit numbers', () => {
    // Given multi-digit strings
    assert.strictEqual(isExactSingleDigit('10'), false, '10 should not be single digit');
    assert.strictEqual(isExactSingleDigit('12'), false, '12 should not be single digit');
    assert.strictEqual(isExactSingleDigit('100'), false, '100 should not be single digit');
  });

  test('1.0-UTIL-012 [P2] isExactSingleDigit rejects non-digit strings', () => {
    // Given non-numeric inputs
    assert.strictEqual(isExactSingleDigit('a'), false, 'a should not be single digit');
    assert.strictEqual(isExactSingleDigit(''), false, 'Empty should not be single digit');
    assert.strictEqual(isExactSingleDigit(null), false, 'Null should not be single digit');
  });

  // Test findRomanNumerals function
  test('1.0-UTIL-013 [P1] findRomanNumerals finds standalone Roman numerals', () => {
    // Given a string with Roman numeral
    const matches = findRomanNumerals('Final Fantasy VII');
    // Then finds the Roman numeral
    assert.strictEqual(matches.length, 1, 'Should find 1 match');
    assert.strictEqual(matches[0].match, 'VII', 'Match should be VII');
    assert.strictEqual(matches[0].index, 14, 'Index should be 14');
  });

  test('1.0-UTIL-014 [P1] findRomanNumerals finds multiple Roman numerals', () => {
    // Given string with multiple Roman numerals
    const matches = findRomanNumerals('Metal Gear Solid III and IV');
    assert.strictEqual(matches.length, 2, 'Should find 2 matches');
    assert.strictEqual(matches[0].match, 'III', 'First should be III');
    assert.strictEqual(matches[1].match, 'IV', 'Second should be IV');
  });

  test('1.0-UTIL-015 [P2] findRomanNumerals ignores Roman numerals within words', () => {
    // Given a word containing Roman-like letters
    const matches = findRomanNumerals('Xenogears');
    // Should not match X as it's part of a word
    assert.strictEqual(matches.length, 0, 'Should not match');
  });

  test('1.0-UTIL-016 [P2] findRomanNumerals ignores Roman numerals within words', () => {
    // Given string with Roman numeral followed by word containing I
    const matches = findRomanNumerals('Final Fantasy VII Remake');
    const romanMatches = matches.filter(m => m.match !== 'VII');
    // Should not find I inside Remake
    assert.strictEqual(romanMatches.length, 0, 'Should not find I inside Remake');
  });

  test('1.0-UTIL-017 [P2] findRomanNumerals returns empty array for invalid input', () => {
    // Given invalid inputs
    assert.deepStrictEqual(findRomanNumerals(null), [], 'Null should return empty array');
    assert.deepStrictEqual(findRomanNumerals(undefined), [], 'Undefined should return empty array');
    assert.deepStrictEqual(findRomanNumerals(''), [], 'Empty should return empty array');
  });

  // Test findArabicNumerals function
  test('1.0-UTIL-018 [P1] findArabicNumerals finds standalone single digits', () => {
    // Given a string with single digit
    const matches = findArabicNumerals('Final Fantasy 7');
    assert.strictEqual(matches.length, 1, 'Should find 1 match');
    assert.strictEqual(matches[0].match, '7', 'Match should be 7');
  });

  test('1.0-UTIL-019 [P2] findArabicNumerals finds multiple single digits', () => {
    // Given string with multiple digits
    const matches = findArabicNumerals('Castlevania II and 3');
    assert.strictEqual(matches.length, 1, 'Should find 1 match');
    assert.strictEqual(matches[0].match, '3', 'Match should be 3');
  });

  test('1.0-UTIL-020 [P2] findArabicNumerals ignores multi-digit numbers', () => {
    // Given multi-digit number
    const matches = findArabicNumerals('Final Fantasy 1998');
    assert.strictEqual(matches.length, 0, 'Should not find 1998');
  });

  test('1.0-UTIL-021 [P3] findArabicNumerals handles edge cases', () => {
    // Given various edge cases
    const matches = findArabicNumerals('Test 5 Test');
    assert.strictEqual(matches.length, 1, 'Should find 1 match');
    assert.strictEqual(matches[0].match, '5', 'Match should be 5');
  });

  // Test generateQueryVariations function
  test('1.0-UTIL-022 [P1] generateQueryVariations returns original query', () => {
    // Given a query string
    const variations = generateQueryVariations('Final Fantasy');
    // Then lowercase variation is included
    assert(variations.includes('final fantasy'), 'Should include lowercase');
  });

  test('1.0-UTIL-023 [P1] generateQueryVariations adds Arabic numeral variant for Roman numerals', () => {
    // Given Roman numeral in query
    const variations = generateQueryVariations('Final Fantasy VII');
    // Then both Roman and Arabic variants are included
    assert(variations.includes('final fantasy vii'), 'Should include vii');
    assert(variations.includes('final fantasy 7'), 'Should include 7');
  });

  test('1.0-UTIL-024 [P2] generateQueryVariations adds Roman numeral variant for single digits', () => {
    // Given single digit in query
    const variations = generateQueryVariations('Metal Gear Solid 3');
    assert(variations.includes('metal gear solid 3'), 'Should include 3');
    assert(variations.some(v => v.includes('metal gear solid iii')), 'Should include iii variant');
  });

  test('1.0-UTIL-025 [P2] generateQueryVariations handles multiple numerals', () => {
    // Given multiple Roman numerals
    const variations = generateQueryVariations('Final Fantasy VII and VIII');
    // Should have variants with 7/8, VII/VIII, and mixed versions
    assert(variations.length >= 2, 'Should have at least 2 variations');
  });

  test('1.0-UTIL-026 [P2] generateQueryVariations returns lowercase versions', () => {
    // Given uppercase input
    const variations = generateQueryVariations('FINAL FANTASY VII');
    assert(variations.some(v => v === 'final fantasy vii'), 'Should have lowercase vii');
    assert(variations.some(v => v === 'final fantasy 7'), 'Should have lowercase 7');
  });

  test('1.0-UTIL-027 [P3] generateQueryVariations handles invalid input', () => {
    // Given invalid inputs
    const result1 = generateQueryVariations(null);
    assert(Array.isArray(result1), 'Null should return array');

    const result2 = generateQueryVariations(undefined);
    assert(Array.isArray(result2), 'Undefined should return array');
  });

  // Test normalizeSearchQuery function
  test('1.0-UTIL-028 [P1] normalizeSearchQuery generates search variations', () => {
    // Given a search query with Roman numeral
    const variations = normalizeSearchQuery('Final Fantasy VII', () => true);
    assert(variations.length > 0, 'Should have variations');
    assert(variations.includes('final fantasy vii') || variations.includes('final fantasy 7'), 'Should have variants');
  });

  test('1.0-UTIL-029 [P3] normalizeSearchQuery handles invalid input', () => {
    // Given invalid inputs
    assert.deepStrictEqual(normalizeSearchQuery(null, () => true), [], 'Null should return empty array');
    assert.deepStrictEqual(normalizeSearchQuery(undefined, () => true), [], 'Undefined should return empty array');
  });

});
