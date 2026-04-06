// Admin authentication middleware with session-based authentication
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@best-version.com';

class AdminAuth {
  constructor() {
    this.sessionsDir = path.join(__dirname, '../.admin_sessions');
    this.maxLoginAttempts = 5;
    this.loginLockoutTime = 15 * 60 * 1000; // 15 minutes
    this.tokenRateLimit = new Map(); // IP-based token generation rate limiting
    this.maxTokenRequestsPerMinute = 3;

    // Ensure sessions directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Generate a secure token for email verification link
   * Token is a one-time use verification token
   */
  generateVerificationToken(adminEmail, ip = null) {
    if (adminEmail !== ADMIN_EMAIL) {
      return null;
    }

    // Rate limit: maximum 3 token requests per minute per IP
    if (ip) {
      const now = Date.now();
      const clientKey = `token:${ip}`;
      const requests = this.tokenRateLimit.get(clientKey) || [];

      // Clean up old requests (> 1 minute)
      const recentRequests = requests.filter(t => now - t < 60 * 1000);

      if (recentRequests.length >= this.maxTokenRequestsPerMinute) {
        console.warn(`[AdminAuth] Rate limit exceeded for IP: ${ip}`);
        return null;
      }

      recentRequests.push(now);
      this.tokenRateLimit.set(clientKey, recentRequests);
    }

    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const tokenData = {
      hash: tokenHash,
      email: ADMIN_EMAIL,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      used: false,
      ip: null
    };

    // Store token hash (never store plain token)
    const tokenFile = path.join(this.sessionsDir, `${tokenHash}.json`);
    fs.writeFileSync(tokenFile, JSON.stringify(tokenData));

    return {
      token: token, // Plain token returned only once
      data: tokenData
    };
  }

  /**
   * Verify and consume verification token
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const tokenFile = path.join(this.sessionsDir, `${tokenHash}.json`);

    try {
      if (!fs.existsSync(tokenFile)) {
        return null;
      }

      const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        fs.unlinkSync(tokenFile);
        return null;
      }

      // Check if token is already used
      if (tokenData.used) {
        fs.unlinkSync(tokenFile);
        return null;
      }

      // Mark as used (one-time use)
      tokenData.used = true;
      fs.writeFileSync(tokenFile, JSON.stringify(tokenData));

      // Create session
      return this.createSession(tokenData.email);
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Create session after successful token verification
   */
  createSession(email) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      id: sessionId,
      email: email,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      lastActivity: Date.now()
    };

    // Store session in memory (can be extended to file or Redis)
    AdminAuth.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Validate session
   */
  validateSession(sessionId) {
    const session = AdminAuth.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      AdminAuth.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();

    return session;
  }

  /**
   * Destroy session
   */
  destroySession(sessionId) {
    AdminAuth.sessions.delete(sessionId);

    // Also clean up verification tokens
    try {
      const tokenFiles = fs.readdirSync(this.sessionsDir);
      for (const file of tokenFiles) {
        try {
          const tokenData = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf8'));
          if (tokenData.email === ADMIN_EMAIL && Date.now() > tokenData.expiresAt) {
            fs.unlinkSync(path.join(this.sessionsDir, file));
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    } catch (e) {
      // Ignore file read errors
    }
  }

  /**
   * Cleanup expired sessions and tokens
   */
  cleanupExpired() {
    const now = Date.now();

    // Clean up in-memory sessions
    for (const [sessionId, session] of AdminAuth.sessions.entries()) {
      if (now > session.expiresAt) {
        AdminAuth.sessions.delete(sessionId);
      }
    }

    // Clean up token files
    try {
      const tokenFiles = fs.readdirSync(this.sessionsDir);
      for (const file of tokenFiles) {
        try {
          const tokenData = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf8'));
          if (now > tokenData.expiresAt) {
            fs.unlinkSync(path.join(this.sessionsDir, file));
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Middleware to require admin authentication
   * Accepts tokens from query params (admin_token) or session cookie (admin_session)
   * Query param takes precedence over cookie
   */
  requireAdmin(req, res, next) {
    try {
      // Check for token in query params first (takes precedence)
      const tokenQueryParam = req.query?.token || req.query?.admin_token;
      const cookieToken = req.cookies?.admin_token;

      // If query param token exists, use it
      if (tokenQueryParam) {
        const session = this.verifyToken(tokenQueryParam);
        if (!session) {
          console.warn(`[AdminAuth] Invalid token query param from IP: ${req.ip || 'unknown'}`);
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired authentication token',
            code: 'TOKEN_INVALID'
          });
        }
        // Attach session to request
        req.adminUser = {
          email: session.email,
          sessionId: session.id
        };
        res.locals.csrfToken = session.csrfToken || crypto.randomBytes(32).toString('hex');
        next();
        return;
      }

      // Check for admin_token cookie
      const adminTokenCookie = req.cookies?.admin_token;
      if (adminTokenCookie) {
        const session = this.verifyToken(adminTokenCookie);
        if (!session) {
          console.warn(`[AdminAuth] Invalid admin_token cookie from IP: ${req.ip || 'unknown'}`);
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired authentication token',
            code: 'TOKEN_INVALID'
          });
        }
        req.adminUser = {
          email: session.email,
          sessionId: session.id
        };
        res.locals.csrfToken = session.csrfToken || crypto.randomBytes(32).toString('hex');
        next();
        return;
      }

      // Check for session cookie
      const sessionId = req.cookies?.admin_session;

      if (!sessionId) {
        console.warn(`[AdminAuth] Unauthenticated access attempt from IP: ${req.ip || 'unknown'}`);
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const session = this.validateSession(sessionId);

      if (!session) {
        console.warn(`[AdminAuth] Invalid session attempt from IP: ${req.ip || 'unknown'}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session',
          code: 'SESSION_INVALID'
        });
      }

      // Attach session to request
      req.adminUser = {
        email: session.email,
        sessionId: session.id
      };

      // Add CSRF token to response
      res.locals.csrfToken = session.csrfToken || crypto.randomBytes(32).toString('hex');

      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication service error',
        code: 'AUTH_ERROR'
      });
    }
  }

  /**
   * Middleware to login - verify token and set session cookie
   */
  login(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token required',
          code: 'TOKEN_REQUIRED'
        });
      }

      const session = this.verifyToken(token);

      if (!session) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired verification token',
          code: 'TOKEN_INVALID'
        });
      }

      // Generate CSRF token for new session
      session.csrfToken = crypto.randomBytes(32).toString('hex');

      // Set session cookie
      res.cookie('admin_session', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          email: session.email
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication service error',
        code: 'AUTH_ERROR'
      });
    }
  }

  /**
   * Logout middleware - destroy session
   */
  logout(req, res, next) {
    try {
      const sessionId = req.cookies?.admin_session;

      if (sessionId) {
        this.destroySession(sessionId);
      }

      // Clear cookie
      res.clearCookie('admin_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo(req) {
    const sessionId = req.cookies?.admin_session;
    if (!sessionId) return null;

    const session = this.validateSession(sessionId);
    return session;
  }
}

// In-memory session store
AdminAuth.sessions = new Map();

// Auto-cleanup every 5 minutes
setInterval(() => {
  const auth = new AdminAuth();
  auth.cleanupExpired();
}, 5 * 60 * 1000);

module.exports = { AdminAuth, adminAuth: new AdminAuth() };
