// Game Metadata Application Entry Point

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { StorageManager } = require('./services/storageService');
const { GameAPI } = require('./services/gameAPI');
const { GamesRoutes } = require('./routes/games');
const { SubmissionService } = require('./services/submissionService');
const { NewsletterService } = require('./services/newsletterService');
const { DeletionRequestService } = require('./services/deletionRequestService');
const { DMCAService } = require('./services/dmcaService');
const { EmailService } = require('./services/emailService');
const { sanitizeBody, suspiciousInputLogger } = require('./middleware/sanitize');
const { searchRateLimit, submissionRateLimit } = require('./middleware/rateLimiter');
const { hCaptchaMiddleware } = require('./middleware/hCaptcha');
const { blockScrapers } = require('./middleware/userAgentBlocker');
const { enforceHttps, addHstsHeader } = require('./middleware/httpsEnforcer');

// Story 6.6: Performance Optimization - Import middleware
const { cacheControlMiddleware, conditionalRequestMiddleware, cdnHeadersMiddleware } = require('./middleware/cacheControl');
const { performanceMiddleware, getMetrics, getCacheHitRate } = require('./middleware/performance');
const { concurrencyMiddleware, rateLimitMiddleware } = require('./middleware/concurrency');
const { CacheService } = require('./services/cacheService');
const { RedisCacheService } = require('./services/redisCacheService');
const { DataCache } = require('./services/dataCaching');
const { ImageService } = require('./services/imageService');

// Security middleware
const {
  securityHeaders,
  attachNonceToResponse,
  apiRateLimiter,
  authRateLimiter,
  submissionRateLimiter,
  createSessionMiddleware,
  csrfMiddleware,
  csrfTokenGetter,
  errorHandler,
  requestIdMiddleware,
  ipValidationMiddleware
} = require('./middleware/security');
console.log('[Main] Security middleware loaded');
const { adminAuth } = require('./middleware/adminAuth');
console.log('[Main] Admin auth loaded');

async function main() {
  console.log('[Main] Entering main');
  console.log('[Main] Starting main function...');

  // Security: Validate required environment variables
  const requiredEnvVars = [
    'COOKIE_SECRET',
    'ADMIN_PASSWORD',
    'SITE_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => {
    const value = process.env[envVar];
    if (!value || value.length === 0) {
      console.error(`[Security] Missing required environment variable: ${envVar}`);
      return true;
    }
    return false;
  });

  if (missingEnvVars.length > 0) {
    console.error('[Security] Application cannot start without required environment variables');
    process.exit(1);
  }

  // Warn about potentially weak credentials
  if (process.env.COOKIE_SECRET.length < 32) {
    console.warn('[Security] WARNING: COOKIE_SECRET should be at least 32 characters for security');
  }

  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 16) {
    console.warn('[Security] WARNING: ADMIN_PASSWORD should be at least 16 characters');
  }

  console.log('=== Game Metadata Application ===');
  console.log(`Environment: ${config.env}`);
  console.log(`Port: ${config.port}`);
  console.log(`Games Directory: ${config.gamesDir}`);

  // Initialize file-based storage
  const submissionsDir = path.join(__dirname, '../submissions');
  const storageManager = new StorageManager(config.gamesDir, submissionsDir);

  console.log(`Storage initialized: ${config.gamesDir}, ${submissionsDir}`);

  // Initialize game loader with storage
  const { GameLoader } = require('./services/gameLoader');
  const gameLoader = new GameLoader(storageManager.games, config.schemaPath);

  // Initialize game API with game loader
  const gameAPI = new GameAPI(gameLoader);

  // Load game data
  await gameAPI.init();

  console.log(`Total games loaded: ${gameLoader.getGameCount()}`);

  // Initialize email service
  const emailService = new EmailService();
  const emailHealth = emailService.healthCheck();
  console.log(`Email service: ${emailHealth.useMock ? 'Mock mode (RESEND_API_KEY not set)' : 'Active (Resend API)'}`);

  // Initialize submission service with storage
  const submissionService = new SubmissionService(storageManager.submissions, emailService, storageManager.games);
  console.log(`Submissions directory: ${submissionsDir}`);

  // Initialize newsletter service
  const subscribersFile = path.join(__dirname, '../newsletters/subscribers.json');
  const contentFile = path.join(__dirname, '../newsletters/content.json');
  const newsletterService = new NewsletterService(subscribersFile, emailService, contentFile);
  console.log(`Newsletter subscribers file: ${subscribersFile}`);

  // Initialize deletion request service
  const deletionRequestService = new DeletionRequestService(submissionsDir, submissionService, newsletterService, config.gamesDir);
  console.log(`Deletion requests file: ${deletionRequestService.deletionsFile}`);

  // Initialize DMCA service
  const dmcaService = new DMCAService(submissionsDir, submissionService, emailService, config.gamesDir);
  console.log(`DMCA requests file: ${dmcaService.dmcaFile}`);

  // Story 6.6: Performance Optimization - Initialize caching layers
  const memoryCache = new CacheService({
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes default
    max: parseInt(process.env.CACHE_MAX) || 1000
  });

  // Redis cache (optional, for distributed caching)
  const redisCacheEnabled = process.env.ENABLE_REDIS_CACHE === 'true';
  let redisCache = null;
  let redisClient = null;

  // Initialize Redis for sessions and cache if enabled
  const redisEnabled = process.env.REDIS_ENABLED === 'true';
  if (redisEnabled || redisCacheEnabled) {
    const Redis = require('ioredis');
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
      retryStrategy: (times) => {
        if (times > 5) {
          console.warn('Redis connection failed after max retries - falling back to in-memory storage');
          return null;
        }
        const delay = Math.min(times * 500, 2000);
        return delay;
      },
      onError: (error) => {
        console.error('Redis error:', error.message);
      },
      onConnect: () => {
        console.log('Redis connected successfully');
      }
    });

    // Initialize session store with Redis
    sessionStore.initRedis(redisClient);

    // Initialize Redis cache service
    if (redisCacheEnabled) {
      redisCache = new RedisCacheService({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || null
      });
    }
  }

  // Data cache wrapper
  const dataCache = new DataCache({
    enableMemoryCache: process.env.ENABLE_MEMORY_CACHE !== 'false',
    enableRedisCache: redisCacheEnabled,
    memoryCacheTTL: parseInt(process.env.CACHE_TTL) || 300,
    redisOptions: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379
    }
  });

  // Image optimization service
  const imageService = new ImageService({
    outputFormats: ['webp', 'avif'],
    quality: parseInt(process.env.IMAGE_QUALITY) || 80,
    thumbnails: {
      small: { width: 150, height: 200 },
      medium: { width: 300, height: 400 },
      large: { width: 600, height: 800 }
    }
  });

  console.log('Performance optimizations initialized');
  console.log(`Memory cache: ${memoryCache ? 'enabled' : 'disabled'}`);
  console.log(`Redis cache: ${redisCacheEnabled ? (redisCache ? 'enabled' : 'failed') : 'disabled'}`);
  console.log(`Image optimization: ImageMagick=${imageService.hasImageMagick}, GraphicsMagick=${imageService.hasGraphicsMagick}, Sharp=${imageService.hasSharp}`);

  // Set up Express server
  const app = express();

  // Validate required security configuration
  if (!process.env.COOKIE_SECRET) {
    console.error('COOKIE_SECRET environment variable is required for production security');
    process.exit(1);
  }

  // Add cookie parser before any middleware that reads cookies
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Security middleware - MUST come early
  app.use(requestIdMiddleware);
  app.use(ipValidationMiddleware);
  app.use(attachNonceToResponse); // Attach CSP nonce before securityHeaders
  app.use(securityHeaders());

  // HTTPS enforcement (check first after security headers)
  app.use(enforceHttps);
  app.use(addHstsHeader);

  // Parse JSON body
  app.use(express.json({ limit: '10kb' }));

  // Input sanitization (after body parsing, before rate limiting)
  app.use(sanitizeBody);
  app.use(suspiciousInputLogger);

  // Rate limiting (applied to all requests)
  app.use(apiRateLimiter);

  // Session middleware
  app.use(createSessionMiddleware());

  // Authentication middleware
  app.use(csrfTokenGetter);

  // CSRF protection for state-changing requests
  app.use(csrfMiddleware);

  // Performance middleware (track response times)
  app.use(performanceMiddleware);

  // Concurrency and rate limiting
  app.use(concurrencyMiddleware);
  app.use(rateLimitMiddleware);

  // CDN headers for cache-aware requests
  app.use(cdnHeadersMiddleware({ cdnProvider: 'none' }));

  // User-Agent blocking middleware (check first, before other processing)
  app.use(blockScrapers);

  // hCaptcha middleware (applied to specific routes below)

  // Initialize admin dashboard with storage services
  const { AdminDashboardService } = require('./services/adminDashboardService');
  const adminDashboard = new AdminDashboardService(submissionService, gameLoader, storageManager.games, storageManager.submissions);

  // Setup routes with admin dashboard
  const gamesRoutes = new GamesRoutes(gameAPI, submissionService, gameLoader, newsletterService, deletionRequestService, dmcaService, adminDashboard);
  app.use('/api', gamesRoutes.setupRoutes());

  // Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    performance: getMetrics()
  });
});

// Performance monitoring endpoint
app.get('/api/performance/metrics', (req, res) => {
  res.json(getMetrics());
});

// Cache statistics endpoint
app.get('/api/performance/cache-stats', async (req, res) => {
  const stats = dataCache.getStats();
  res.json({
    memory: stats.memory || null,
    redis: stats.redis || null,
    cacheHitRate: getCacheHitRate()
  });
});

// Root endpoint - serve frontend

  app.get('/', (req, res) => {
    // Ensure session and generate CSRF token if needed
    req.session = req.session || {};
    if (!req.session.csrfToken) {
      const crypto = require('crypto');
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    // Replace CSRF token placeholder
    const token = req.session.csrfToken;
    const injectedHtml = html.replace('{{CSRF_TOKEN}}', token);
    res.send(injectedHtml);
  });

  // Search page
  app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/search.html'));
  });

  // Game detail page
  app.get('/games/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/games/detail.html'));
  });

  // Submission page - redirect to home with prefill param
  app.get('/submit', (req, res) => {
    // Preserve the ?game= parameter if present
    const query = req.url.split('?')[1];
    if (query) {
      res.redirect(`/?${query}`);
    } else {
      res.redirect('/');
    }
  });

  // Admin page
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
  });

  // Admin login (handles token from URL)
  app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
  });

  // Legal pages
  app.get('/legal/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/legal/terms.html'));
  });

  app.get('/legal/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/legal/privacy.html'));
  });

  // Configure static asset caching
  app.use(cacheControlMiddleware);
  app.use(conditionalRequestMiddleware);

  // Serve static files (frontend)
  app.use(express.static('public'));

  // Handle favicon.ico (prevent 404 errors)
  app.get('/favicon.ico', (req, res) => {
    res.status(404).send('Not found');
  });

  // Fallback handler for /images/* - serve from images directory or default if not found
  // This catches requests that didn't match express.static and tries to serve from:
  // 1. The images/ directory (where game creator saves new images)
  // 2. The default image as fallback
  app.use(/\/images\/.*/, (req, res, next) => {
    const requestedImage = req.path; // e.g., /images/some-game.jpg
    const imageFileName = requestedImage.split('/').pop(); // e.g., some-game.jpg

    // Try to find the image in the images/ directory first
    const imagesDirPath = path.join(__dirname, '../images');
    const imagesDirImage = path.join(imagesDirPath, imageFileName);

    // Also check public/images for existing images
    const publicImagePath = path.join(__dirname, '../public/images', imageFileName);

    // Default image path
    const defaultImagePath = path.join(__dirname, '../public/images/default-image.jpg');

    // Try to serve the requested image from images/ directory
    if (fs.existsSync(imagesDirImage)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(imagesDirImage);
      return;
    }

    // Try public/images directory
    if (fs.existsSync(publicImagePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(publicImagePath);
      return;
    }

    // Fall back to default image
    if (fs.existsSync(defaultImagePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(defaultImagePath);
    } else {
      // If no default image exists, return 404
      res.status(404).json({ error: 'Image not found' });
    }
  });

  // Start server
  console.log('[Main] Starting server on port', config.port);
  const server = app.listen(config.port, () => {
    console.log('[Main] Server running on http://localhost:' + config.port);
    console.log('[Main] Press Ctrl+C to stop');
    console.log('[Main] Performance endpoints:');
    console.log('[Main]   Health: http://localhost:' + config.port + '/health');
    console.log('[Main]   Metrics: http://localhost:' + config.port + '/api/performance/metrics');
    console.log('[Main]   Cache Stats: http://localhost:' + config.port + '/api/performance/cache-stats');

    // Add global error handler after server starts
    console.log('[Main] Adding error handler');
    app.use(errorHandler);
    console.log('[Main] Error handler added');
  }).on('error', (err) => {
    console.error('Server startup error:', err);
    process.exit(1);
  });
  console.log('[Main] Server listener registered');
}

// Handle errors - avoid leaking sensitive info in production
process.on('uncaughtException', (error) => {
  console.error('An unexpected error occurred');
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', error.stack || error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('An unhandled promise rejection occurred');
  if (process.env.NODE_ENV !== 'production') {
    console.error('Promise:', promise, 'Reason:', reason);
  }
  process.exit(1);
});

// Start the application
async function start() {
  try {
    await main();
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();
