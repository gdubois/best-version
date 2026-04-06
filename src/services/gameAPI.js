// Game data API service

const { generateQueryVariations } = require('../utils/romanNumeral');

class GameAPI {
  constructor(gameLoader) {
    this.gameLoader = gameLoader;
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

  // Search games by title with Roman numeral normalization
  searchByTitle(query) {
    // Generate all variations of the query (Roman numeral to Arabic conversions)
    const variations = generateQueryVariations(query);

    const allGames = this.gameLoader.getAllGames();
    const results = [];

    // Track which games we've already added to avoid duplicates
    const seenSlugs = new Set();

    for (const variation of variations) {
      const normalizedQuery = variation.toLowerCase();
      const matches = allGames.filter(game =>
        game.basic_info.title.toLowerCase().includes(normalizedQuery)
      );

      matches.forEach(game => {
        if (!seenSlugs.has(game.basic_info.url_slug)) {
          results.push(game);
          seenSlugs.add(game.basic_info.url_slug);
        }
      });
    }

    return results;
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
