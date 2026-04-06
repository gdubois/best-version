// Roman numeral normalization utilities for search

// Roman numeral to integer mapping (I through XXX for reasonable game titles)
const ROMAN_MAP = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
  'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
  'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18,
  'XIX': 19, 'XX': 20, 'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24,
  'XXV': 25, 'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30
};

// Integer to Roman numeral mapping
const INTEGER_TO_ROMAN = {};
Object.keys(ROMAN_MAP).forEach(roman => {
  INTEGER_TO_ROMAN[ROMAN_MAP[roman]] = roman;
});

// Sorted Roman numerals by length (longest first for proper matching)
const SORTED_ROMAN_NUMERALS = Object.keys(ROMAN_MAP)
  .sort((a, b) => b.length - a.length);

/**
 * Convert a Roman numeral string to an integer
 * @param {string} roman - Roman numeral string (e.g., 'VII')
 * @returns {number|null} - Integer value or null if not a valid Roman numeral
 */
function romanToInteger(roman) {
  if (!roman || typeof roman !== 'string') return null;

  const upper = roman.toUpperCase();
  if (ROMAN_MAP.hasOwnProperty(upper)) {
    return ROMAN_MAP[upper];
  }
  return null;
}

/**
 * Convert an integer to a Roman numeral string
 * @param {number} num - Integer value
 * @returns {string|null} - Roman numeral string or null if out of range
 */
function integerToRoman(num) {
  if (typeof num !== 'number' || isNaN(num) || num < 1 || num > 30) return null;
  return INTEGER_TO_ROMAN[num];
}

/**
 * Check if a string is exactly a Roman numeral (exact match, not substring)
 * @param {string} str - String to check
 * @returns {boolean} - True if the string is exactly a Roman numeral
 */
function isExactRomanNumeral(str) {
  if (!str || typeof str !== 'string') return false;
  return ROMAN_MAP.hasOwnProperty(str.toUpperCase());
}

/**
 * Check if a string is exactly a single digit number (not part of a longer number)
 * @param {string} str - String to check
 * @returns {boolean} - True if the string is exactly a single digit
 */
function isExactSingleDigit(str) {
  if (!str || typeof str !== 'string') return false;
  return /^\d$/.test(str);
}

/**
 * Find Roman numerals in a string with proper word boundary detection
 * Handles: standalone words, end-of-string, adjacent to non-letter chars
 * @param {string} text - Text to search
 * @returns {Array<{match: string, index: number}>} - Array of Roman numeral matches
 */
function findRomanNumerals(text) {
  if (!text || typeof text !== 'string') return [];

  const matches = [];
  const upper = text.toUpperCase();

  // Use sorted list to match longer Romans first (avoid matching I inside XII)
  for (const roman of SORTED_ROMAN_NUMERALS) {
    const upperRoman = roman.toUpperCase();
    let index = 0;

    while ((index = upper.indexOf(upperRoman, index)) !== -1) {
      const before = index > 0 ? text[index - 1] : '';
      const after = index + roman.length < text.length ? text[index + roman.length] : '';

      // Check word boundaries - Roman must be standalone, not part of a word
      const validBefore = !(/[A-Za-z0-9]/).test(before);
      const validAfter = !(/[A-Za-z0-9]/).test(after);

      if (validBefore && validAfter) {
        matches.push({ match: roman, index });
      }

      index += roman.length;
    }
  }

  return matches;
}

/**
 * Find Arabic numerals in a string with proper word boundary detection
 * @param {string} text - Text to search
 * @returns {Array<{match: string, index: number}>} - Array of digit matches
 */
function findArabicNumerals(text) {
  if (!text || typeof text !== 'string') return [];

  const matches = [];
  const singleDigitPattern = /(^|[^0-9])([0-9])([^0-9]|$)/g;
  let match;

  while ((match = singleDigitPattern.exec(text)) !== null) {
    // Only capture if it's truly standalone (not part of longer number)
    if (!match[1] || !/[0-9]/.test(match[1])) {
      if (!match[3] || !/[0-9]/.test(match[3])) {
        matches.push({ match: match[2], index: match.index + 1 });
      }
    }
  }

  return matches;
}

/**
 * Generate search variations that normalize between Roman and Arabic numerals
 * This ensures searching "Final Fantasy VII", "Final Fantasy 7", and "Metal Gear Solid III"
 * all return identical results
 * @param {string} query - The search query
 * @returns {string[]} - Array of query variations for matching
 */
function generateQueryVariations(query) {
  if (!query || typeof query !== 'string') return [query];

  const variations = [query.toLowerCase()];
  const text = query;

  // Find all Roman numerals and generate Arabic versions
  const romanMatches = findRomanNumerals(text);
  if (romanMatches.length > 0) {
    let arabicVersion = text;
    romanMatches.forEach(m => {
      const num = romanToInteger(m.match);
      if (num !== null) {
        // Replace only exact matches
        const regex = new RegExp('(^|[^A-Za-z])' + m.match + '($|[^A-Za-z])', 'g');
        arabicVersion = arabicVersion.replace(regex, `$1${num}$2`);
      }
    });
    variations.push(arabicVersion.toLowerCase());
  }

  // Find all standalone digits and generate Roman versions
  const digitMatches = findArabicNumerals(text);
  if (digitMatches.length > 0) {
    let romanVersion = text;
    digitMatches.forEach(m => {
      const roman = integerToRoman(parseInt(m.match, 10));
      if (roman) {
        const regex = new RegExp('(^|[^A-Za-z])' + m.match + '($|[^A-Za-z])', 'g');
        romanVersion = romanVersion.replace(regex, `$1${roman}$2`);
      }
    });
    variations.push(romanVersion.toLowerCase());
  }

  // Also generate lowercase versions of all variations
  variations.forEach(v => {
    if (!variations.includes(v.toLowerCase())) {
      variations.push(v.toLowerCase());
    }
  });

  // Remove duplicates and return
  return [...new Set(variations)];
}

/**
 * Search games with Roman numeral normalization
 * @param {string} query - Search query
 * @param {Function} titleMatcher - Function to check if title includes query
 * @returns {string[]} - All possible search terms to check
 */
function normalizeSearchQuery(query, titleMatcher) {
  if (!query || typeof query !== 'string') return [];

  const variations = generateQueryVariations(query);
  const results = [];
  const seenTitles = new Set();

  // Check each variation against all titles
  for (const variation of variations) {
    // Return the original variation for the frontend to use
    if (!results.includes(variation)) {
      results.push(variation);
    }
  }

  return results;
}

module.exports = {
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
};
