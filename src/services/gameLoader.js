// Game data loader service

const fs = require('fs');
const path = require('path');
const { JsonSchemaValidator } = require('../utils/validators');

class GameLoader {
  constructor(gamesDirOrStorage, schemaPath) {
    // Support both old and new constructor signatures
    if (typeof gamesDirOrStorage === 'string') {
      // Old signature: GameLoader(gamesDir, schemaPath)
      this.gamesDir = gamesDirOrStorage;
      this.gameStorage = null; // Will load from files directly
    } else {
      // New signature: GameLoader(gameStorage, schemaPath)
      this.gameStorage = gamesDirOrStorage;
      this.gamesDir = null;
    }
    this.validator = new JsonSchemaValidator(schemaPath);
    this.games = new Map();
    this.isLoaded = false;
  }

  async loadAll() {
    if (this.isLoaded) {
      console.log('Game data already loaded');
      return this.games;
    }

    if (!this.validator.loadSchema()) {
      console.warn('Schema validation disabled due to load error');
    }

    try {
      let gamesToLoad = [];

      if (this.gameStorage) {
        // New signature: use storage service
        gamesToLoad = this.gameStorage.getAllGames();
        console.log(`Found ${gamesToLoad.length} games in storage`);
      } else {
        // Old signature: load directly from files
        const files = fs.readdirSync(this.gamesDir);
        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');
        gamesToLoad = jsonFiles.map(f => f.replace('.json', ''));
        console.log(`Found ${gamesToLoad.length} game files in ${this.gamesDir}`);
      }

      for (const gameEntry of gamesToLoad) {
        let gameData;
        if (this.gameStorage) {
          // Get from storage service
          const slug = typeof gameEntry === 'string' ? gameEntry : gameEntry.url_slug;
          gameData = this.gameStorage.getGameBySlug(slug);
        } else {
          // Load directly from file
          const filePath = path.join(this.gamesDir, `${gameEntry}.json`);
          gameData = this._loadGameFile(filePath, gameEntry);
        }
        if (gameData) {
          this.games.set(gameData.basic_info.url_slug, gameData);
        }
      }

      this.isLoaded = true;
      console.log(`Successfully loaded ${this.games.size} games`);
      return this.games;
    } catch (error) {
      console.error('Failed to load games:', error.message);
      throw error;
    }
  }

  // Load a single game file from disk
  _loadGameFile(filePath, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Validate against schema if available
      if (this.validator.schema) {
        if (!this.validator.validate(data)) {
          console.warn(`Validation warnings for ${fileName}:`);
          for (const error of this.validator.getErrors()) {
            console.warn(`  - ${error}`);
          }
        }
      }

      return data;
    } catch (error) {
      console.error(`Failed to load ${fileName}:`, error.message);
      return null;
    }
  }

  getAllGames() {
    if (!this.isLoaded) {
      throw new Error('Game data not loaded. Call loadAll() first.');
    }
    return Array.from(this.games.values());
  }

  getGameBySlug(slug) {
    if (!this.isLoaded) {
      throw new Error('Game data not loaded. Call loadAll() first.');
    }
    return this.games.get(slug) || null;
  }

  getGamesByGenre(genre) {
    if (!this.isLoaded) {
      throw new Error('Game data not loaded. Call loadAll() first.');
    }

    const normalizedGenre = genre.toLowerCase();
    return Array.from(this.games.values()).filter(game =>
      game.basic_info.genres &&
      game.basic_info.genres.some(g => g.toLowerCase() === normalizedGenre)
    );
  }

  getGamesByPlatform(platform) {
    if (!this.isLoaded) {
      throw new Error('Game data not loaded. Call loadAll() first.');
    }

    const normalizedPlatform = platform.toLowerCase();
    return Array.from(this.games.values()).filter(game =>
      game.release &&
      game.release.platforms &&
      game.release.platforms.some(p => p.name.toLowerCase() === normalizedPlatform)
    );
  }

  getGameCount() {
    return this.games.size;
  }

  // Save game to file system (delegates to storage)
  saveGame(gameData) {
    try {
      const gameSlug = gameData.basic_info.url_slug;
      this.gameStorage.updateGame(gameSlug, gameData);
      this.games.set(gameSlug, gameData);
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  }

  // Delete game from file system (delegates to storage)
  deleteGame(slug) {
    return this.gameStorage.deleteGame(slug);
  }

  // Get all games as array for iteration
  getAllGamesArray() {
    return Array.from(this.games.values());
  }
}

module.exports = { GameLoader };
