// Redis cache service for distributed caching
// Story 6.6: Performance Optimization

const Redis = require('ioredis');

class RedisCacheService {
  constructor(options = {}) {
    this.options = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD || null,
      db: options.db || process.env.REDIS_DB || 0,
      prefix: options.prefix || 'rgc:', // Key prefix
      ttl: options.ttl || 300, // 5 minutes default TTL
      ...options
    };

    this.enabled = false;
    this.client = null;
    this.connected = false;

    // Initialize Redis connection
    this.init();
  }

  /**
   * Initialize Redis client
   */
  init() {
    try {
      this.client = new Redis({
        host: this.options.host,
        port: this.options.port,
        password: this.options.password,
        db: this.options.db,
        retryStrategy: (times) => {
          if (times > 10) {
            console.error('Redis connection failed after max retries');
            this.connected = false;
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          console.log(`Redis reconnecting... attempt ${times}`);
          return delay;
        },
        onRetry: () => {
          console.log('Redis retrying connection...');
        },
        onError: (error) => {
          console.error('Redis error:', error.message);
          this.connected = false;
        },
        onConnect: () => {
          console.log('Redis connected successfully');
          this.connected = true;
          this.enabled = true;
        },
        onEnd: () => {
          console.log('Redis connection ended');
          this.connected = false;
          this.enabled = false;
        }
      });

      // Test connection
      this.client.ping().catch(() => {
        console.warn('Redis connection test failed - Redis may not be available');
        this.connected = false;
        this.enabled = false;
      });
    } catch (error) {
      console.error('Redis initialization error:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Get a value from Redis cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} - Cached value or null
   */
  async get(key) {
    if (!this.enabled) {
      return null;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  /**
   * Set a value in Redis cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Optional TTL in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl) {
    if (!this.enabled) {
      return false;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      const effectiveTtl = ttl || this.options.ttl;
      await this.client.setex(fullKey, effectiveTtl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  /**
   * Delete a value from Redis cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    if (!this.enabled) {
      return false;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache entries with prefix
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    if (!this.enabled) {
      return false;
    }

    try {
      // Scan for all keys with prefix and delete them
      const keys = [];
      let cursor = 0;

      do {
        const result = await this.client.scan(cursor, 'MATCH', `${this.options.prefix}*`, 'COUNT', 100);
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await this.client.del(...keys);
      }

      return true;
    } catch (error) {
      console.error('Redis clear error:', error.message);
      return false;
    }
  }

  /**
   * Increment a counter
   * @param {string} key - Cache key
   * @param {number} increment - Amount to increment (default 1)
   * @returns {Promise<number>} - New value
   */
  async increment(key, increment = 1) {
    if (!this.enabled) {
      return increment;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      const newValue = await this.client.incrby(fullKey, increment);
      return parseInt(newValue, 10);
    } catch (error) {
      console.error('Redis increment error:', error.message);
      return increment;
    }
  }

  /**
   * Decrement a counter
   * @param {string} key - Cache key
   * @param {number} decrement - Amount to decrement (default 1)
   * @returns {Promise<number>} - New value
   */
  async decrement(key, decrement = 1) {
    return this.increment(key, -decrement);
  }

  /**
   * Check if key exists in Redis cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if exists
   */
  async has(key) {
    if (!this.enabled) {
      return false;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      const exists = await this.client.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error('Redis has error:', error.message);
      return false;
    }
  }

  /**
   * Set expiry time on a key
   * @param {string} key - Cache key
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async expire(key, ttl) {
    if (!this.enabled) {
      return false;
    }

    try {
      const fullKey = `${this.options.prefix}${key}`;
      await this.client.expire(fullKey, ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error.message);
      return false;
    }
  }

  /**
   * Get Redis info
   * @returns {Promise<object>} - Redis info
   */
  async getInfo() {
    if (!this.enabled) {
      return { enabled: false, connected: false };
    }

    try {
      const info = await this.client.info('server');
      return {
        enabled: true,
        connected: this.connected,
        host: this.options.host,
        port: this.options.port,
        db: this.options.db,
        info
      };
    } catch (error) {
      console.error('Redis info error:', error.message);
      return { enabled: false, connected: false, error: error.message };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      this.enabled = false;
    }
  }
}

module.exports = { RedisCacheService };
