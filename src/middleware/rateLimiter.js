// Rate limiting middleware for API protection

const fs = require('fs');
const path = require('path');

class RateLimiter {
  constructor(fileDir, defaultLimits = {}) {
    this.limitsDir = fileDir;
    this.limitsFile = path.join(fileDir, 'rate_limits.json');
    this.defaultLimits = defaultLimits;

    // Ensure limits directory exists
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Initialize limits file if it doesn't exist
    if (!fs.existsSync(this.limitsFile)) {
      this.saveLimits({});
    }
  }

  // Get stored limits
  getLimits() {
    try {
      const data = fs.readFileSync(this.limitsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading rate limits:', error);
      return {};
    }
  }

  // Save limits to file
  saveLimits(limits) {
    try {
      fs.writeFileSync(this.limitsFile, JSON.stringify(limits, null, 2));
    } catch (error) {
      console.error('Error saving rate limits:', error);
    }
  }

  // Generate unique key for rate tracking
  generateKey(identifier, action) {
    return `${identifier}:${action}`;
  }

  // Check if rate limit is exceeded
  checkRateLimit(identifier, action, config = {}) {
    const key = this.generateKey(identifier, action);
    const limit = config.maxRequests || this.defaultLimits.maxRequests || 100;
    const windowMs = config.windowMs || this.defaultLimits.windowMs || 3600000; // Default 1 hour

    const limits = this.getLimits();
    const now = Date.now();

    // Initialize or reset tracking
    if (!limits[key] || now - limits[key].resetTime > windowMs) {
      limits[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Increment counter
    limits[key].count++;
    this.saveLimits(limits);

    // Check if limit exceeded
    if (limits[key].count > limit) {
      return {
        exceeded: true,
        remaining: 0,
        resetTime: new Date(limits[key].resetTime).toISOString(),
        retryAfter: Math.ceil((limits[key].resetTime - now) / 1000)
      };
    }

    return {
      exceeded: false,
      remaining: limit - limits[key].count,
      resetTime: new Date(limits[key].resetTime).toISOString(),
      retryAfter: null
    };
  }
}

// Express middleware for rate limiting
function rateLimitMiddleware(limiter, config = {}) {
  return (req, res, next) => {
    // Skip rate limiting for health checks, admin routes, and static files
    if (req.path === '/health' || req.path.startsWith('/_') || req.path.includes('/admin')) {
      return next();
    }

    const identifier = req.ip || req.connection?.remoteAddress || 'unknown';
    const action = config.action || 'default';

    const result = limiter.checkRateLimit(identifier, action, config);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', config.maxRequests || limiter.defaultLimits.maxRequests || 100);
    res.set('X-RateLimit-Remaining', result.remaining);
    res.set('X-RateLimit-Reset', result.resetTime);

    if (result.exceeded) {
      res.set('Retry-After', result.retryAfter);

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: config.message || 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter
      });
    }

    next();
  };
}

// Search-specific rate limiter (100 requests per hour)
const searchRateLimiter = rateLimitMiddleware(new RateLimiter(path.join(__dirname, '../.ratelimits'), {
  maxRequests: 100,
  windowMs: 3600000 // 1 hour
}, {
  action: 'search',
  maxRequests: 100,
  windowMs: 3600000,
  message: 'Search rate limit exceeded. Please wait before searching again.'
}));

// Submission-specific rate limiter (5 submissions per day)
const submissionRateLimiter = rateLimitMiddleware(new RateLimiter(path.join(__dirname, '../.ratelimits'), {
  maxRequests: 5,
  windowMs: 86400000 // 24 hours
}, {
  action: 'submission',
  maxRequests: 5,
  windowMs: 86400000,
  message: 'Daily submission limit reached. Please try again tomorrow.'
}));

// Apply rate limiting to search endpoint
function searchRateLimit() {
  return (req, res, next) => {
    if (req.path.includes('/search')) {
      return searchRateLimiter(req, res, next);
    }
    next();
  };
}

// Apply rate limiting to submission endpoint
function submissionRateLimit() {
  return (req, res, next) => {
    if (req.path.includes('/submissions') && req.method === 'POST') {
      return submissionRateLimiter(req, res, next);
    }
    next();
  };
}

module.exports = {
  RateLimiter,
  rateLimitMiddleware,
  searchRateLimiter,
  submissionRateLimiter,
  searchRateLimit,
  submissionRateLimit
};
