// Game data API service

class GameAPI {
  constructor(gameLoader) {
    this.gameLoader = gameLoader;
  }

  // Escape special regex characters to prevent regex injection
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async init() {
    await this.gameLoader.loadAll();
  }

  // Get all games
  getAllGames() {
    return this.gameLoader.getAllGames();
  }

  // Get single game by URL slug
  getGameBySlug(slug) {
    return this.gameLoader.getGameBySlug(slug);
  }

  // Search games by title with partial word matching and Roman numeral preservation
  searchByTitle(query) {
    const allGames = this.gameLoader.getAllGames();
    const results = [];
    const seenSlugs = new Set();

    const normalizedQuery = query.toLowerCase().trim();

    for (const game of allGames) {
      const title = game.basic_info.title.toLowerCase();

      // Generate all variations for each part of the query
      const parts = normalizedQuery.split(/\s+/);
      const partVariations = parts.map(part => this.getSearchVariations(part));

      // Check if ALL parts match the title (each part can be Roman or Arabic)
      let allPartsMatch = true;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const variations = partVariations[i];

        let partMatched = false;
        for (const variation of variations) {
          const isRoman = this.isExactRomanNumeral(variation);
          const regex = isRoman
            ? new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'i')
            : new RegExp(this.escapeRegex(variation), 'i');
          if (regex.test(title)) {
            partMatched = true;
            break;
          }
        }

        if (!partMatched) {
          allPartsMatch = false;
          break;
        }
      }

      if (allPartsMatch && !seenSlugs.has(game.basic_info.url_slug)) {
        results.push(game);
        seenSlugs.add(game.basic_info.url_slug);
      }
    }

    return results;
  }

  // Generate search variations for a single part to handle Roman ↔ Arabic numeral conversion
  getSearchVariations(part) {
    const variations = [part];

    // If part is a single digit, also generate Roman numeral version
    if (/^\d$/.test(part)) {
      const num = parseInt(part, 10);
      const roman = this.arabicToRoman(num);
      if (roman) {
        variations.push(roman.toLowerCase());
      }
    }

    // If part is a Roman numeral, also generate Arabic version
    if (this.isExactRomanNumeral(part)) {
      const arabic = this.romanToArabic(part);
      if (arabic !== null) {
        variations.push(arabic.toString());
      }
    }

    return variations;
  }

  // Convert Roman numeral to Arabic
  romanToArabic(roman) {
    const romanMap = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
      'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
      'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18,
      'XIX': 19, 'XX': 20, 'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24,
      'XXV': 25, 'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30
    };
    return romanMap.hasOwnProperty(roman.toUpperCase()) ? romanMap[roman.toUpperCase()] : null;
  }

  // Convert Arabic to Roman numeral
  arabicToRoman(num) {
    const romanMap = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
      7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
      13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII', 18: 'XVIII',
      19: 'XIX', 20: 'XX', 21: 'XXI', 22: 'XXII', 23: 'XXIII', 24: 'XXIV',
      25: 'XXV', 26: 'XXVI', 27: 'XXVII', 28: 'XXVIII', 29: 'XXIX', 30: 'XXX'
    };
    return romanMap[num] || null;
  }

  // Check if query is an exact Roman numeral (single, not part of longer string)
  isExactRomanNumeral(query) {
    if (!query) return false;

    const romanMap = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
      'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12,
      'XIII': 13, 'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18,
      'XIX': 19, 'XX': 20, 'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24,
      'XXV': 25, 'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30
    };

    // Check if query (case-insensitive) is exactly a Roman numeral
    const upper = query.toUpperCase();
    return /^[IVXLCDM]+$/.test(upper) && romanMap.hasOwnProperty(upper);
  }

  // Get games by genre
  getGamesByGenre(genre) {
    return this.gameLoader.getGamesByGenre(genre);
  }

  // Get games by platform
  getGamesByPlatform(platform) {
    return this.gameLoader.getGamesByPlatform(platform);
  }

  // Get games by theme
  getGamesByTheme(theme) {
    const normalizedTheme = theme.toLowerCase();
    return this.gameLoader.getAllGames().filter(game =>
      game.basic_info.themes &&
      game.basic_info.themes.some(t => t.toLowerCase() === normalizedTheme)
    );
  }

  // Get similar games based on genres and themes
  getSimilarGames(slug, limit = 5) {
    const game = this.gameLoader.getGameBySlug(slug);
    if (!game) return [];

    const allGames = this.gameLoader.getAllGames();
    const gameGenres = new Set(game.basic_info.genres.map(g => g.toLowerCase()));
    const gameThemes = new Set((game.basic_info.themes || []).map(t => t.toLowerCase()));

    const scoredGames = allGames
      .filter(g => g.basic_info.url_slug !== slug)
      .map(g => {
        let score = 0;
        const gGenres = new Set(g.basic_info.genres.map(genre => genre.toLowerCase()));
        const gThemes = new Set((g.basic_info.themes || []).map(theme => theme.toLowerCase()));

        // Score by genre matches
        for (const genre of gGenres) {
          if (gameGenres.has(genre)) score += 2;
        }

        // Score by theme matches
        for (const theme of gThemes) {
          if (gameThemes.has(theme)) score += 1;
        }

        return { game: g, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.game);

    return scoredGames;
  }

  // Get games with difficulty rating
  getGamesByDifficulty(minRating, maxRating) {
    return this.gameLoader.getAllGames().filter(game => {
      const rating = game.basic_info.difficulty_rating || 0;
      return rating >= minRating && rating <= maxRating;
    });
  }

  // Get games by reception score
  getGamesByReceptionScore(minScore, maxScore) {
    return this.gameLoader.getAllGames().filter(game => {
      const score = game.basic_info.reception_score || 0;
      return score >= minScore && score <= maxScore;
    });
  }

  // Get all unique genres
  getUniqueGenres() {
    const genres = new Set();
    this.gameLoader.getAllGames().forEach(game => {
      if (game.basic_info.genres) {
        game.basic_info.genres.forEach(g => genres.add(g));
      }
    });
    return Array.from(genres).sort();
  }

  // Get all unique themes
  getUniqueThemes() {
    const themes = new Set();
    this.gameLoader.getAllGames().forEach(game => {
      if (game.basic_info.themes) {
        game.basic_info.themes.forEach(t => themes.add(t));
      }
    });
    return Array.from(themes).sort();
  }

  // Get all unique platforms
  getUniquePlatforms() {
    const platforms = new Set();
    this.gameLoader.getAllGames().forEach(game => {
      if (game.release && game.release.platforms) {
        game.release.platforms.forEach(p => platforms.add(p.name));
      }
    });
    return Array.from(platforms).sort();
  }
}

module.exports = { GameAPI };
