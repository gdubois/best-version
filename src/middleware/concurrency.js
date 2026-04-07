// Concurrency handling middleware
// Story 6.6: Performance Optimization

const { v4: uuidv4 } = require('uuid');

// Connection tracking
const activeConnections = new Map();
const rateLimits = new Map();

// Configuration
const config = {
  maxConcurrentUsers: parseInt(process.env.MAX_CONCURRENT_USERS) || 100,
  rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 1000,
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT) || 300000 // 5 minutes
};

/**
 * Middleware to track active connections and enforce concurrency limits
 */
function concurrencyMiddleware(req, res, next) {
  const clientId = req.headers['x-client-id'] || uuidv4();
  const startTime = Date.now();

  // Track active connection
  activeConnections.set(clientId, {
    startTime,
    requestId: req.requestId || uuidv4(),
    path: req.path,
    method: req.method
  });

  // Check if we've exceeded max concurrent users
  if (activeConnections.size > config.maxConcurrentUsers) {
    // Clean up old connections first
    cleanupOldConnections();

    if (activeConnections.size > config.maxConcurrentUsers) {
      // Still over limit, return 503
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Too many concurrent users. Please try again later.',
        code: 'TOO_MANY_CONCURRENT_USERS',
        currentConnections: activeConnections.size,
        maxConnections: config.maxConcurrentUsers
      });
    }
  }

  // Set connection info in response
  res.set('X-Active-Connections', activeConnections.size.toString());
  res.set('X-Max-Connections', config.maxConcurrentUsers.toString());

  // Clean up on response finish
  res.on('finish', () => {
    activeConnections.delete(clientId);
  });

  next();
}

/**
 * Middleware to enforce rate limiting per IP/client
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Initialize rate limit tracking if not exists
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, {
      requests: [],
      windowStart: Date.now()
    });
  }

  const client = rateLimits.get(ip);
  const now = Date.now();

  // Reset window if expired
  if (now - client.windowStart > config.rateLimitWindow) {
    client.requests = [];
    client.windowStart = now;
  }

  // Add current request
  client.requests.push(now);

  // Check if over limit
  if (client.requests.length > config.rateLimitRequests) {
    // Calculate retry-after time
    const retryAfter = Math.ceil((config.rateLimitWindow - (now - client.windowStart)) / 1000);

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: config.rateLimitRequests,
      window: `${config.rateLimitWindow / 1000} seconds`,
      retryAfter
    });
  }

  // Set rate limit headers
  res.set('X-RateLimit-Limit', config.rateLimitRequests.toString());
  res.set('X-RateLimit-Remaining', Math.max(0, config.rateLimitRequests - client.requests.length).toString());
  res.set('X-RateLimit-Window', `${config.rateLimitWindow / 1000} seconds`);

  next();
}

/**
 * Cleanup old connections that have timed out
 */
function cleanupOldConnections() {
  const now = Date.now();
  const timeoutThreshold = now - config.connectionTimeout;

  for (const [clientId, connection] of activeConnections.entries()) {
    if (connection.startTime < timeoutThreshold) {
      activeConnections.delete(clientId);
      console.log(`Cleaned up stale connection: ${clientId}`);
    }
  }
}

let cleanupInterval = null;

/**
 * Cleanup cron task to run periodically
 */
function scheduleCleanup() {
  // Run cleanup every minute
  cleanupInterval = setInterval(cleanupOldConnections, 60000);
}

/**
 * Stop the cleanup cron task
 */
function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Get current concurrency statistics
 * @returns {object} - Statistics
 */
function getConcurrencyStats() {
  cleanupOldConnections();

  return {
    activeConnections: activeConnections.size,
    maxConnections: config.maxConcurrentUsers,
    utilization: (activeConnections.size / config.maxConcurrentUsers * 100).toFixed(2),
    uniqueClients: activeConnections.size
  };
}

/**
 * Get rate limit statistics
 * @returns {Array} - Rate limit stats per IP
 */
function getRateLimitStats() {
  const stats = [];

  for (const [ip, client] of rateLimits.entries()) {
    const now = Date.now();
    const windowRemaining = Math.max(0, config.rateLimitWindow - (now - client.windowStart));

    stats.push({
      ip,
      requestsInWindow: client.requests.length,
      remaining: Math.max(0, config.rateLimitRequests - client.requests.length),
      windowReset: windowRemaining
    });
  }

  return stats;
}

// Schedule cleanup on module load (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  scheduleCleanup();
}

module.exports = {
  concurrencyMiddleware,
  rateLimitMiddleware,
  getConcurrencyStats,
  getRateLimitStats,
  stopCleanup,
  config,
  cleanupOldConnections
};
