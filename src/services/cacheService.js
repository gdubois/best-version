// In-memory cache service for performance optimization
// Story 6.6: Performance Optimization

const { LRUCache } = require('lru-cache');

class CacheService {
  constructor(options = {}) {
    // Default options
    this.options = {
      maxMemory: options.maxMemory || 100 * 1024 * 1024, // 100MB default
      maxEntrySize: options.maxEntrySize || 10 * 1024, // 10KB default
      ttl: options.ttl || 300, // 5 minutes default TTL
      max: options.max || 1000, // Max entries
      ...options
    };

    // Create LRU cache with size limits
    this.cache = new LRUCache({
      maxSize: this.options.maxMemory,
      sizeCalculation: (value) => Buffer.byteLength(JSON.stringify(value), 'utf8'),
      ttl: this.options.ttl * 1000,
      maxEntrySize: this.options.maxEntrySize,
      max: this.options.max,
      noDisposeOnSet: true,
      updateAgeOnGet: true,
      dispose: (key, value) => {
        console.log(`Cache eviction: ${key}`);
      }
    });

    // Statistics tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };

    // Cache metrics for monitoring
    this.metrics = {
      createdAt: new Date().toISOString(),
      lastCleared: null
    };
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} - Cached value or null
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Optional TTL in seconds (overrides default)
   * @returns {boolean} - Success status
   */
  set(key, value, ttl) {
    try {
      const effectiveTtl = (ttl !== undefined ? ttl * 1000 : this.options.ttl * 1000);
      this.cache.set(key, value, { ttl: effectiveTtl });
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {boolean} - Success status
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   * @returns {boolean} - Success status
   */
  clear() {
    this.cache.clear();
    this.metrics.lastCleared = new Date().toISOString();
    return true;
  }

  /**
   * Increment a counter
   * @param {string} key - Cache key
   * @param {number} increment - Amount to increment (default 1)
   * @returns {number} - New value
   */
  increment(key, increment = 1) {
    const current = this.get(key) || 0;
    const newValue = current + increment;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement a counter
   * @param {string} key - Cache key
   * @param {number} decrement - Amount to decrement (default 1)
   * @returns {number} - New value
   */
  decrement(key, decrement = 1) {
    return this.increment(key, -decrement);
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getStats() {
    const size = this.cache.getRemainingEntryBudget();
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
        : 0,
      sizeBytes: 100 * 1024 * 1024 - size, // Approximate
      maxSizeBytes: 100 * 1024 * 1024,
      entryCount: this.cache.size,
      maxEntries: this.options.max
    };
  }

  /**
   * Get cache info for monitoring
   * @returns {object} - Cache info
   */
  getInfo() {
    return {
      ...this.metrics,
      options: {
        maxMemory: this.options.maxMemory,
        ttl: this.options.ttl,
        max: this.options.max
      },
      stats: this.getStats()
    };
  }
}

module.exports = { CacheService };
