// hCaptcha validation middleware with device fingerprinting fallback for bot protection

const https = require('https');
const crypto = require('crypto');

/**
 * Generate device fingerprint for bot detection
 */
function generateDeviceFingerprint(req) {
  const parts = [];

  // User agent
  parts.push(req.get('user-agent') || '');

  // Accept language
  parts.push(req.get('accept-language') || '');

  // Accept encoding
  parts.push(req.get('accept-encoding') || '');

  // Connection type (if available)
  parts.push(req.get('sec-ch-ua-mobile') || '');

  // Viewport width (if available)
  parts.push(req.get('sec-ch-ua') || '');

  // IP address
  parts.push(req.ip || req.connection?.remoteAddress || '');

  // Combine and hash
  const fingerprint = crypto
    .createHash('sha256')
    .update(parts.join('|'))
    .digest('hex')
    .substring(0, 16);

  return fingerprint;
}

/**
 * Track request timing for bot detection
 */
class RequestTracker {
  constructor() {
    this.requests = new Map();
  }

  recordRequest(ip, fingerprint) {
    const key = `${ip}:${fingerprint}`;

    if (!this.requests.has(key)) {
      this.requests.set(key, { firstRequest: Date.now(), requests: [] });
    }

    const data = this.requests.get(key);
    data.requests.push(Date.now());

    // Keep only last 100 requests
    if (data.requests.length > 100) {
      data.requests.shift();
    }

    return data;
  }

  isBot(ip, fingerprint) {
    const key = `${ip}:${fingerprint}`;
    const data = this.requests.get(key);

    if (!data || data.requests.length < 5) {
      return false;
    }

    // Check for suspicious patterns
    const requests = data.requests;
    const windowMs = 60 * 1000; // 1 minute window

    // Count requests in last minute
    const now = Date.now();
    const recentRequests = requests.filter(t => now - t < windowMs);

    // If more than 50 requests per minute, likely a bot
    if (recentRequests.length > 50) {
      return true;
    }

    // Check for constant intervals (automated requests)
    if (recentRequests.length > 10) {
      const intervals = [];
      for (let i = 1; i < recentRequests.length; i++) {
        intervals.push(recentRequests[i] - recentRequests[i - 1]);
      }

      // If all intervals are very similar (within 10% variance), likely automated
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const variance = intervals.reduce((sum, interval) => sum + Math.abs(interval - avgInterval), 0) / intervals.length;
        if (variance < avgInterval * 0.1 && avgInterval < 1000) {
          return true;
        }
      }
    }

    return false;
  }
}

const requestTracker = new RequestTracker();

class hCaptchaService {
  constructor(siteKey, secretKey) {
    this.siteKey = siteKey || process.env.HCAPTCHA_SITE_KEY || '';
    this.secretKey = secretKey || process.env.HCAPTCHA_SECRET_KEY || '';
    this.verifyUrl = 'https://hcaptcha.com/siteverify';
  }

  // Validate hCaptcha token server-side
  async verifyToken(token, remoteIp = null) {
    if (!this.secretKey) {
      // Fail closed: hCaptcha must be configured in production
      console.error('[hCaptcha] Secret key required - hCaptcha must be configured');
      return {
        success: false,
        error: 'Bot verification service not configured',
        code: 'HCAPTCHA_NOT_CONFIGURED'
      };
    }

    if (!token) {
      return {
        success: false,
        error: 'hCaptcha token required'
      };
    }

    return new Promise((resolve) => {
      const data = new URLSearchParams({
        secret: this.secretKey,
        response: token,
        remoteip: remoteIp || ''
      });

      const options = {
        hostname: this.verifyUrl,
        port: 443,
        path: '/siteverify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve({
              success: result.success === true,
              error: result['error-codes'] ? result['error-codes'].join(', ') : null,
              data: result
            });
          } catch (error) {
            console.error('[hCaptcha] Failed to parse response:', error);
            resolve({
              success: false,
              error: 'Failed to parse hCaptcha response'
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error('[hCaptcha] Request error:', error);
        resolve({
          success: false,
          error: 'Failed to connect to hCaptcha service'
        });
      });

      req.write(data);
      req.end();
    });
  }

  // Validate using device fingerprint as fallback
  async verifyFallback(req) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const fingerprint = generateDeviceFingerprint(req);

    // Track request
    const requestData = requestTracker.recordRequest(ip, fingerprint);

    // Check for bot behavior
    if (requestTracker.isBot(ip, fingerprint)) {
      return {
        success: false,
        error: 'Suspicious activity detected',
        code: 'BOT_DETECTED'
      };
    }

    return {
      success: true,
      fingerprint,
      hCaptchaConfigured: false
    };
  }
}

// Create a single shared instance (config via environment or defaults)
let hCaptchaServiceInstance = null;

function gethCaptchaService() {
  if (!hCaptchaServiceInstance) {
    hCaptchaServiceInstance = new hCaptchaService();
  }
  return hCaptchaServiceInstance;
}

// Middleware to require hCaptcha token in form submissions
function requirehCaptcha(field = 'h_captcha') {
  return (req, res, next) => {
    const token = req.body[field] || req.query[field];

    if (!token || token.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'hCaptcha verification required'
      });
    }

    // Pass token to next handler for validation
    req.hCaptchaToken = token;
    next();
  };
}

// Middleware to validate hCaptcha token and mark request as validated
async function validatehCaptcha(req, res, next) {
  const token = req.hCaptchaToken || req.body.h_captcha || req.query.h_captcha;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'hCaptcha verification required'
    });
  }

  const service = gethCaptchaService();
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const result = await service.verifyToken(token, ip);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || 'hCaptcha verification failed'
    });
  }

  req.hCaptchaValid = true;
  next();
}

// Middleware combo: require token + validate in one step
// Falls back to device fingerprinting if hCaptcha not configured
async function hCaptchaMiddleware(req, res, next) {
  const token = req.body.h_captcha || req.query.h_captcha;

  const service = gethCaptchaService();
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  let result;

  if (!token || token.trim() === '') {
    // No token provided - try fallback
    // Only use fallback if hCaptcha is not configured
    if (!service.secretKey) {
      // hCaptcha not configured - allow request through without captcha
      req.hCaptchaValid = true;
      return next();
    }
    // hCaptcha configured but no token - validate using fallback
    result = await service.verifyFallback(req);
  } else {
    // Token provided - validate with hCaptcha
    result = await service.verifyToken(token, ip);
  }

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || 'Bot verification failed'
    });
  }

  req.hCaptchaValid = true;

  // Store fingerprint if using fallback
  if (result.fingerprint) {
    req.deviceFingerprint = result.fingerprint;
  }

  next();
}

module.exports = {
  hCaptchaService,
  gethCaptchaService,
  requirehCaptcha,
  validatehCaptcha,
  hCaptchaMiddleware,
  generateDeviceFingerprint,
  requestTracker
};
