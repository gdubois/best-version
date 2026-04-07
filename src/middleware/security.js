// Comprehensive security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

/**
 * Security headers configuration
 * Uses helmet for standard security headers plus custom headers
 */
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  });
}

/**
 * Strict rate limiter for all API requests
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT) || 1000, // Limit each IP to 1000 requests per windowMs (increased for dev)
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Stricter rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Stricter rate limiter for submission endpoints
 */
const submissionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each IP to 10 submissions per day
  message: {
    success: false,
    error: 'Daily submission limit reached. Please try again tomorrow.',
    code: 'SUBMISSION_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Session store using in-memory storage (can be replaced with Redis)
 */
class SessionStore {
  constructor(redisClient = null) {
    this.redis = redisClient;
    this.sessions = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Get session by ID
   */
  get(sid) {
    return this.sessions.get(sid);
  }

  /**
   * Set session
   */
  set(sid, session) {
    // Clean up existing session if present
    const existing = this.sessions.get(sid);
    if (existing && existing.expiresAt && existing.expiresAt < Date.now()) {
      this.sessions.delete(sid);
    }

    this.sessions.set(sid, session);
  }

  /**
   * Destroy session
   */
  destroy(sid) {
    this.sessions.delete(sid);
  }

  /**
   * Start automatic cleanup
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sid, session] of this.sessions.entries()) {
        if (session.expiresAt && session.expiresAt < now) {
          this.sessions.delete(sid);
        }
      }
    }, 60 * 1000); // Run every minute
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const sessionStore = new SessionStore();

// Only start cleanup in non-test environments
if (process.env.NODE_ENV !== 'test') {
  sessionStore.startCleanup();
}

/**
 * Generate session ID
 */
function generateSessionId() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create session middleware
 */
function createSessionMiddleware() {
  return (req, res, next) => {
    // Always initialize session as an object first
    req.session = req.session || {};

    // Check for session cookie
    const sessionId = req.cookies?.session_id;

    if (sessionId) {
      const session = sessionStore.get(sessionId);
      if (session && session.expiresAt > Date.now()) {
        req.session = session;
        // Extend session on use
        session.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        sessionStore.set(sessionId, session);
      } else {
        // Session expired, clear cookie
        res.clearCookie('session_id', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });
        req.session = {};
      }
    } else {
      // No session cookie - create a new one
      const newSessionId = generateSessionId();
      req.session = {
        id: newSessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      sessionStore.set(newSessionId, req.session);
      // Set the session cookie on response
      res.cookie('session_id', newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    next();
  };
}

/**
 * CSRF token generation and validation
 */
const crypto = require('crypto');

class CSRFProtect {
  constructor() {
    this.tokenLength = 32;
  }

  /**
   * Generate CSRF token
   */
  generateToken() {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  /**
   * Create CSRF middleware
   */
  createMiddleware() {
    return (req, res, next) => {
      // Skip for GET, HEAD, OPTIONS (safe methods)
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Generate token for safe methods to include in response
        const token = this.generateToken();
        res.locals.csrfToken = token;
        res.set('X-CSRF-Token', token);
        return next();
      }

      // Skip CSRF validation for specific API endpoints that have their own protection
      // (e.g., newsletter subscribe uses hCaptcha, admin endpoints use adminAuth)
      const skipPaths = [
        '/api/newsletter/subscribe',
        '/api/submissions',  // submissions use hCaptcha
      ];
      const path = req.path.toLowerCase();
      if (skipPaths.some(skipPath => path === skipPath || path.startsWith(skipPath + '?'))) {
        return next();
      }

      // Skip CSRF validation if hCaptcha has already validated the request
      // (hCaptcha provides equivalent protection for public endpoints)
      if (req.hCaptchaValid) {
        return next();
      }

      // For unsafe methods, validate CSRF token
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

      if (!csrfToken) {
        return res.status(403).json({
          success: false,
          error: 'CSRF token required',
          code: 'CSRF_TOKEN_MISSING'
        });
      }

      // Validate token against session
      const sessionToken = req.session?.csrfToken;

      if (!sessionToken || typeof csrfToken !== 'string') {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
      }

      // Constant-time comparison to prevent timing attacks
      // Ensure both tokens are the same length before comparison
      if (sessionToken.length !== csrfToken.length) {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
      }
      if (!crypto.timingSafeEqual(
        Buffer.from(sessionToken),
        Buffer.from(csrfToken)
      )) {
        return res.status(403).json({
          success: false,
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
      }

      next();
    };
  }

  /**
   * Get CSRF token setter
   */
  getTokenGetter() {
    return (req, res, next) => {
      // Always initialize session and locals
      req.session = req.session || {};
      res.locals = res.locals || {};

      // Generate session token if not exists
      if (!req.session.csrfToken) {
        req.session.csrfToken = this.generateToken();
      }

      // Set CSRF token in response locals for frontend access
      res.locals.csrfToken = req.session.csrfToken;

      // Persist session changes back to store (important for CSRF token)
      const sessionId = req.cookies?.session_id;
      if (sessionId) {
        req.session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
        sessionStore.set(sessionId, req.session);
      }

      next();
    };
  }
}

const csrfProtect = new CSRFProtect();
const csrfMiddleware = csrfProtect.createMiddleware();
const csrfTokenGetter = csrfProtect.getTokenGetter();

/**
 * Input sanitization and validation
 */
class InputValidator {
  /**
   * Validate email address
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input, options = {}) {
    if (typeof input !== 'string') return input;

    let result = input.trim();

    // Remove null bytes
    result = result.replace(/\0/g, '');

    // Limit length
    const maxLength = options.maxLength || 1000;
    if (result.length > maxLength) {
      result = result.substring(0, maxLength);
    }

    return result;
  }

  /**
   * Validate and sanitize object
   */
  static sanitizeObject(obj, schema) {
    if (typeof obj !== 'object' || obj === null) return null;

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (!(key in schema)) continue;

      const rule = schema[key];
      let validatedValue = value;

      // Apply transformations
      if (rule.transform) {
        validatedValue = rule.transform(validatedValue);
      }

      // Validate
      if (rule.validate && !rule.validate(validatedValue)) {
        if (rule.required) {
          return null; // Validation failed for required field
        }
        continue; // Skip invalid optional field
      }

      // Type check
      if (rule.type && typeof validatedValue !== rule.type) {
        if (rule.required) {
          return null;
        }
        continue;
      }

      sanitized[key] = validatedValue;
    }

    return sanitized;
  }

  /**
   * Validate file path (prevent traversal)
   */
  static isValidFilePath(filePath, allowedDir) {
    if (!filePath || typeof filePath !== 'string') return false;

    // Check for null bytes
    if (filePath.includes('\0')) return false;

    // Resolve the path
    const resolvedPath = require('path').resolve(filePath);
    const resolvedAllowedDir = require('path').resolve(allowedDir);

    // Check if path is within allowed directory
    if (!resolvedPath.startsWith(resolvedAllowedDir)) {
      return false;
    }

    // Check filename is safe (alphanumeric, hyphen, underscore, dot)
    const filename = require('path').basename(filePath);
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
      return false;
    }

    return true;
  }

  /**
   * Get sanitized version of request body
   */
  static sanitizeBody(body, schema) {
    if (!body || typeof body !== 'object') return null;

    const sanitized = {};

    for (const [key, value] of Object.entries(body)) {
      if (!(key in schema)) continue;

      const rule = schema[key];
      let sanitizedValue;

      // Sanitize string values
      if (typeof value === 'string') {
        sanitizedValue = this.sanitizeString(value, {
          maxLength: rule.maxLength
        });
      } else if (Array.isArray(value)) {
        // Array of strings
        sanitizedValue = value
          .filter(v => typeof v === 'string')
          .map(v => this.sanitizeString(v, { maxLength: rule.maxLength }));
      } else if (typeof value === 'number') {
        // Validate number range
        if (rule.min !== undefined && value < rule.min) return null;
        if (rule.max !== undefined && value > rule.max) return null;
        sanitizedValue = value;
      } else {
        // Skip unsupported types
        continue;
      }

      if (rule.required && (!sanitizedValue || (typeof sanitizedValue === 'string' && !sanitizedValue.trim()))) {
        return null; // Required field is empty
      }

      sanitized[key] = sanitizedValue;
    }

    return sanitized;
  }
}

/**
 * Audit logging middleware
 */
class AuditLogger {
  constructor(logFile) {
    this.logFile = logFile;
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * Log audit event
   */
  log(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventId: require('crypto').randomBytes(8).toString('hex'),
      ...event
    };

    this.logs.push(logEntry);

    // Keep only last N logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    console.log(`[AUDIT] ${logEntry.eventType}: ${logEntry.userId || 'anonymous'} - ${logEntry.description}`);
  }

  /**
   * Create audit middleware
   */
  createMiddleware() {
    return (req, res, next) => {
      // Store original json method to capture parsed body
      const originalJson = res.json.bind(res);
      res.auditData = {};

      res.json = (data) => {
        res.auditData.response = data;
        return originalJson(data);
      };

      next();
    };
  }

  /**
   * Log admin action
   */
  logAdminAction(userId, action, target, details = {}) {
    this.log({
      eventType: 'ADMIN_ACTION',
      userId,
      action,
      target,
      description: `${action} on ${target}`,
      ...details
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details = {}) {
    this.log({
      eventType: 'SECURITY',
      description: eventType,
      ...details
    });
  }
}

const auditLogger = new AuditLogger(process.env.AUDIT_LOG_FILE || './.audit.log');
const auditMiddleware = auditLogger.createMiddleware();

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Log error for debugging (in production, log to file/service)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Security events to log
  if (err.message?.includes('CSRF')) {
    auditLogger.logSecurityEvent('CSRF_VIOLATION', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err.message || 'An internal error occurred'
  });
}

/**
 * Request ID middleware - adds unique ID to each request
 */
function requestIdMiddleware(req, res, next) {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.set('X-Request-ID', req.requestId);
  next();
}

/**
 * IP validation middleware
 */
function ipValidationMiddleware(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress;

  // Check for Cloudflare/CDN headers
  const forwardedFor = req.headers['x-forwarded-for'];
  if ( forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    req.ip = firstIp;
  }

  next();
}

module.exports = {
  // Helmet security headers
  securityHeaders,

  // Rate limiters
  apiRateLimiter,
  authRateLimiter,
  submissionRateLimiter,

  // Session management
  createSessionMiddleware,
  sessionStore,
  generateSessionId,

  // CSRF protection
  csrfMiddleware,
  csrfTokenGetter,

  // Input validation
  InputValidator,

  // Audit logging
  auditLogger,
  auditMiddleware,

  // Error handling
  errorHandler,

  // Request tracking
  requestIdMiddleware,

  // IP validation
  ipValidationMiddleware
};
