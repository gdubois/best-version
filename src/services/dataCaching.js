// Data caching service - wraps storage services with caching
// Story 6.6: Performance Optimization

const { CacheService } = require('./cacheService');
const { RedisCacheService } = require('./redisCacheService');

class DataCache {
  constructor(options = {}) {
    this.options = {
      // In-memory cache
      enableMemoryCache: options.enableMemoryCache !== false,
      memoryCacheTTL: options.memoryCacheTTL || 300, // 5 minutes
      memoryCacheMax: options.memoryCacheMax || 1000,

      // Redis cache (optional, for distributed caching)
      enableRedisCache: options.enableRedisCache || false,
      redisOptions: options.redisOptions || {},

      // Cache prefixes
      gamePrefix: options.gamePrefix || 'game:',
      searchPrefix: options.searchPrefix || 'search:',
      statsPrefix: options.statsPrefix || 'stats:'
    };

    // Initialize caches
    this.memoryCache = null;
    this.redisCache = null;

    if (this.options.enableMemoryCache) {
      this.memoryCache = new CacheService({
        ttl: this.options.memoryCacheTTL,
        max: this.options.memoryCacheMax
      });
    }

    if (this.options.enableRedisCache) {
      this.redisCache = new RedisCacheService(this.options.redisOptions);
    }

    // Enable fallback: use memory cache if Redis not available
    this.useRedis = this.options.enableRedisCache;
  }

  /**
   * Get a value from cache (try Redis first, then memory cache)
   * @param {string} key - Cache key
   * @returns {Promise<*>} - Cached value
   */
  async get(key) {
    let value = null;

    // Try Redis first if enabled
    if (this.useRedis && this.redisCache) {
      value = await this.redisCache.get(key);
      if (value !== null) {
        // Also cache in memory
        if (this.memoryCache) {
          this.memoryCache.set(key, value);
        }
        return value;
      }
    }

    // Try memory cache
    if (this.memoryCache) {
      value = this.memoryCache.get(key);
      if (value !== null) {
        return value;
      }
    }

    return null;
  }

  /**
   * Set a value in cache (both Redis and memory)
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - TTL in seconds (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl) {
    const effectiveTtl = ttl || this.options.memoryCacheTTL;

    // Set in memory cache
    let memorySuccess = false;
    if (this.memoryCache) {
      memorySuccess = this.memoryCache.set(key, value, effectiveTtl);
    }

    // Set in Redis if enabled
    let redisSuccess = false;
    if (this.redisCache) {
      redisSuccess = await this.redisCache.set(key, value, effectiveTtl);
    }

    return memorySuccess || redisSuccess;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    let result = false;

    if (this.memoryCache) {
      result = this.memoryCache.delete(key);
    }

    if (this.redisCache) {
      await this.redisCache.delete(key);
      result = true;
    }

    return result;
  }

  /**
   * Clear all cache entries
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    let result = false;

    if (this.memoryCache) {
      result = this.memoryCache.clear();
    }

    if (this.redisCache) {
      await this.redisCache.clear();
      result = true;
    }

    return result;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getStats() {
    const stats = {};

    if (this.memoryCache) {
      stats.memory = this.memoryCache.getStats();
    }

    if (this.redisCache) {
      stats.redis = this.redisCache.getInfo();
    }

    return stats;
  }

  /**
   * Invalidate game cache by slug
   * @param {string} slug - Game slug
   */
  async invalidateGame(slug) {
    await this.delete(`game:${slug}`);
    await this.delete(`game:slug:${slug}`);
  }

  /**
   * Invalidate search cache
   * @param {string} searchTerm - Search term
   */
  async invalidateSearch(searchTerm) {
    await this.delete(`search:${searchTerm}`);
    await this.delete(`search:roman:${searchTerm}`);
  }

  /**
   * Get or set game by slug with caching
   * @param {object} gameStorage - Game storage service
   * @param {string} slug - Game slug
   * @returns {Promise<object|null>} - Game data
   */
  async getGameBySlug(gameStorage, slug) {
    const cacheKey = `game:${slug}`;

    // Check cache first
    const cached = await this.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from storage
    const game = gameStorage.getGameBySlug(slug);

    // Cache result
    if (game) {
      await this.set(cacheKey, game, this.options.memoryCacheTTL);
    }

    return game;
  }

  /**
   * Get or set search results with caching
   * @param {object} gameStorage - Game storage service
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} - Search results
   */
  async searchGames(gameStorage, searchTerm) {
    const cacheKey = `search:${searchTerm}`;

    // Check cache first
    const cached = await this.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Perform search
    const results = gameStorage.searchGames(searchTerm);

    // Cache results
    await this.set(cacheKey, results, this.options.memoryCacheTTL);

    return results;
  }

  /**
   * Get all games with caching
   * @param {object} gameStorage - Game storage service
   * @returns {Promise<Array>} - All games
   */
  async getAllGames(gameStorage) {
    const cacheKey = 'games:all';

    // Check cache first
    const cached = await this.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch all games
    const games = gameStorage.getAllGames();

    // Cache results
    await this.set(cacheKey, games, this.options.memoryCacheTTL);

    return games;
  }
}

module.exports = { DataCache };
