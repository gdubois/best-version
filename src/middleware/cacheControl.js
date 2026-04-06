// Cache control middleware for static assets
// Story 6.6: Performance Optimization

/**
 * Configure cache control headers based on content type
 * @param {string} contentType - Content type of the resource
 * @returns {object} - Cache control configuration
 */
function getCacheConfig(contentType) {
  const cacheConfig = {
    // Static assets - long cache (1 week)
    'image/': {
      maxAge: 604800, // 7 days
      mustRevalidate: false,
      proxyRevalidate: false
    },
    'text/css': {
      maxAge: 604800, // 7 days
      mustRevalidate: false,
      proxyRevalidate: false
    },
    'text/javascript': {
      maxAge: 604800, // 7 days
      mustRevalidate: false,
      proxyRevalidate: false
    },
    'application/javascript': {
      maxAge: 604800, // 7 days
      mustRevalidate: false,
      proxyRevalidate: false
    },
    'font/': {
      maxAge: 604800, // 7 days
      mustRevalidate: false,
      proxyRevalidate: false
    },

    // API responses - short cache (5 minutes)
    'application/json': {
      maxAge: 300, // 5 minutes
      mustRevalidate: true,
      proxyRevalidate: true
    },

    // HTML - no cache (always validate)
    'text/html': {
      maxAge: 0,
      mustRevalidate: true,
      proxyRevalidate: true,
      noCache: true
    },

    // Default for other content types
    'default': {
      maxAge: 300, // 5 minutes
      mustRevalidate: true,
      proxyRevalidate: true
    }
  };

  // Find matching config
  for (const pattern in cacheConfig) {
    if (contentType.includes(pattern)) {
      return cacheConfig[pattern];
    }
  }

  return cacheConfig['default'];
}

/**
 * Middleware to set cache control headers for static assets
 * Uses Content-Type header to determine cache duration
 */
function cacheControlMiddleware(req, res, next) {
  // Only apply to static asset requests
  const staticAssetPatterns = [
    '/static/',
    '/images/',
    '/css/',
    '/js/',
    '/fonts/'
  ];

  const isStaticAsset = staticAssetPatterns.some(pattern =>
    req.path.startsWith(pattern)
  );

  if (!isStaticAsset) {
    return next();
  }

  // Get content type from Content-Type header or infer from file extension
  const contentType = res.get('Content-Type') || '';

  // Handle case where Content-Type might not be set yet
  const contentTypeMap = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };

  const ext = req.path.split('.').pop();
  const extension = ext ? `.${ext}` : '';

  const finalContentType = contentType || contentTypeMap[extension] || 'application/octet-stream';

  const config = getCacheConfig(finalContentType);

  // Set cache control headers
  let cacheControl = `max-age=${config.maxAge}`;

  if (config.mustRevalidate) {
    cacheControl += ', must-revalidate';
  }

  if (config.proxyRevalidate) {
    cacheControl += ', proxy-revalidate';
  }

  if (config.noCache) {
    cacheControl += ', no-cache';
  }

  res.set('Cache-Control', cacheControl);

  // Set ETag for conditional requests
  if (!res.get('ETag')) {
    const etag = generateETag(req.path, Date.now());
    res.set('ETag', etag);
  }

  // Set Last-Modified header
  if (!res.get('Last-Modified')) {
    const lastModified = new Date().toUTCString();
    res.set('Last-Modified', lastModified);
  }

  next();
}

/**
 * Generate ETag for a resource
 * @param {string} path - Resource path
 * @param {number} timestamp - Timestamp
 * @returns {string} - ETag value
 */
function generateETag(path, timestamp) {
  const hash = `${path}${timestamp}`;
  const hashValue = require('crypto').createHash('md5').update(hash).digest('hex');
  return `"${hashValue}"`;
}

/**
 * Middleware to handle 304 Not Modified responses
 * Uses ETag and Last-Modified headers for conditional requests
 */
function conditionalRequestMiddleware(req, res, next) {
  const etag = res.get('ETag');
  const lastModified = res.get('Last-Modified');

  // Check If-None-Match header (ETag based)
  if (etag && req.headers['if-none-match'] === etag) {
    return res.status(304).send();
  }

  // Check If-Modified-Since header (Last-Modified based)
  if (lastModified && req.headers['if-modified-since']) {
    const ifModifiedSince = new Date(req.headers['if-modified-since']);
    const lastModifiedDate = new Date(lastModified);

    if (lastModifiedDate <= ifModifiedSince) {
      return res.status(304).send();
    }
  }

  next();
}

/**
 * Middleware to add CDN-related headers
 * @param {object} config - CDN configuration
 */
function cdnHeadersMiddleware(config = {}) {
  return function(req, res, next) {
    // Vary header for CDNs that handle caching based on Accept-Encoding
    res.set('Vary', 'Accept-Encoding');

    // X-CDN-Edge header for debugging
    if (config.cdnProvider) {
      res.set('X-CDN-Edge', config.cdnProvider);
    }

    // X-Cache-Hit header (set by CDN, but we can add for local debugging)
    const cacheHit = req.headers['x-cache-hit'];
    if (cacheHit) {
      res.set('X-Cache-Hit', cacheHit);
    }

    next();
  };
}

module.exports = {
  cacheControlMiddleware,
  conditionalRequestMiddleware,
  cdnHeadersMiddleware,
  getCacheConfig
};
