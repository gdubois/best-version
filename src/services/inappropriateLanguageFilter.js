// Inappropriate language filtering service for maintaining family-friendly content

const fs = require('fs');
const path = require('path');

class InappropriateLanguageFilter {
  constructor(filtersFile) {
    this.filtersFile = filtersFile || path.join(__dirname, '../.language_filters.json');

    // Initialize filter file with default word list if it doesn't exist
    if (!fs.existsSync(this.filtersFile)) {
      this.saveFilters(this.getDefaultFilters());
    }
  }

  // Default filter list - common inappropriate terms (family-friendly focus)
  getDefaultFilters() {
    return {
      words: [
        // Profanity
        'fuck', 'fucking', 'shit', 'ass', 'bastard', 'bitch', 'damn', 'dick',
        'piss', 'crap', 'idiot', 'moron', 'stupid', 'retard', 'wanker', 'twat',
        'cunt', 'slut', 'whore', 'fag', 'gay', 'nigga', 'nigger', 'kike', 'spic',
        'honky', 'cracker', 'chink', 'gook', 'raghead', 'faggot', 'fotg',
        // Sexual explicit terms
        'sex', 'porn', 'xxx', 'penis', 'vagina', 'fuck', 'orgasm', 'cum', 'cock',
        // Drug references
        'drugs', 'weed', 'dope', 'coke', 'meth', 'heroin', 'acid', 'ludes', 'shrooms',
        // Violence enhancement
        'kill', 'murder', 'slaughter', ' massacre', 'bloodbath', 'gore'
      ],
      // Word variations to catch bypass attempts
      variations: {
        'fuck': ['f.u.c.k', 'f@@k', 'f*ck', 'f---k', 'fuck', 'fuk'],
        'shit': ['s.h.i.t', 's!t', 's.hit', 'sh1t'],
        'dick': ['d!ck', 'd1ck', 'd!ck'],
        'ass': ['a$$', '4$$', 'azs'],
        'sex': ['s.ex', 's#x', 's3x'],
        'porn': ['p0rn', 'p!rn', 'p.o.r.n']
      },
      // Regex patterns for encoded variations
      patterns: [
        /&#?\w+;/gi, // HTML entities
        /[\x00-\x1f\x7f-\x9f]/gi, // Control characters
      ]
    };
  }

  // Get current filters from file
  getFilters() {
    try {
      const data = fs.readFileSync(this.filtersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading language filters:', error);
      return this.getDefaultFilters();
    }
  }

  // Save filters to file
  saveFilters(filters) {
    try {
      fs.writeFileSync(this.filtersFile, JSON.stringify(filters, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving language filters:', error);
      return false;
    }
  }

  // Add a word to the filter list
  addWord(word) {
    const filters = this.getFilters();

    if (!filters.words.includes(word.toLowerCase())) {
      filters.words.push(word.toLowerCase());
      this.saveFilters(filters);
      return true;
    }
    return false;
  }

  // Remove a word from the filter list
  removeWord(word) {
    const filters = this.getFilters();
    const index = filters.words.indexOf(word.toLowerCase());

    if (index !== -1) {
      filters.words.splice(index, 1);
      this.saveFilters(filters);
      return true;
    }
    return false;
  }

  // Get all filtered words
  getAllWords() {
    const filters = this.getFilters();
    return filters.words;
  }

  // Normalize text to detect variations (lowercase, remove special chars)
  normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  // Check if text contains inappropriate language
  containsInappropriateLanguage(text) {
    if (typeof text !== 'string') return { found: false, words: [] };

    const normalized = this.normalizeText(text);
    const filters = this.getFilters();
    const foundWords = [];

    // Check against main word list
    for (const word of filters.words) {
      const normalizedWord = this.normalizeText(word);
      if (normalized.includes(normalizedWord)) {
        foundWords.push(word);
      }
    }

    // Check against variations
    for (const [original, variations] of Object.entries(filters.variations)) {
      for (const variation of variations) {
        const normalizedVariation = this.normalizeText(variation);
        if (normalized.includes(normalizedVariation)) {
          if (!foundWords.includes(original)) {
            foundWords.push(original);
          }
          break;
        }
      }
    }

    return {
      found: foundWords.length > 0,
      words: foundWords
    };
  }

  // Sanitize text by replacing inappropriate words
  sanitizeText(text) {
    if (typeof text !== 'string') return text;

    const filters = this.getFilters();
    let sanitized = text;

    // Replace words with asterisks
    for (const word of filters.words) {
      const regex = new RegExp(word, 'gi');
      sanitized = sanitized.replace(regex, '*'.repeat(word.length));
    }

    return sanitized;
  }

  // Filter an entire submission object
  filterSubmission(submission) {
    if (typeof submission !== 'object') return { flagged: false, flaggedFields: [], reason: null };

    const flaggedFields = [];
    let hasFlaggedContent = false;
    const reasons = [];

    // Check common submission fields
    const fieldsToCheck = ['title', 'notes', 'email', 'recommendations', 'alternativeNames'];

    for (const field of fieldsToCheck) {
      if (submission[field]) {
        if (Array.isArray(submission[field])) {
          for (const item of submission[field]) {
            if (typeof item === 'string') {
              const result = this.containsInappropriateLanguage(item);
              if (result.found) {
                hasFlaggedContent = true;
                flaggedFields.push(`${field}[${submission[field].indexOf(item)}]`);
                reasons.push(...result.words);
              }
            }
          }
        } else if (typeof submission[field] === 'string') {
          const result = this.containsInappropriateLanguage(submission[field]);
          if (result.found) {
            hasFlaggedContent = true;
            flaggedFields.push(field);
            reasons.push(...result.words);
          }
        }
      }
    }

    return {
      flagged: hasFlaggedContent,
      flaggedFields,
      reasons: [...new Set(reasons)] // Unique words
    };
  }
}

module.exports = { InappropriateLanguageFilter };
