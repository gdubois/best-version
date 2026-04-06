// HTTPS enforcement middleware

function enforceHttps(req, res, next) {
  const protocol = req.get('X-Forwarded-Proto');
  const ssl = req.get('X-Forwarded-Ssl');
  const isHttps = protocol === 'https' || ssl === 'on';
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

  // If not HTTPS and not localhost/dev, redirect to HTTPS
  if (!isHttps && !isLocalhost && process.env.NODE_ENV !== 'development') {
    const host = req.get('Host');
    const url = `https://${host}${req.originalUrl}`;
    return res.redirect(301, url);
  }

  next();
}

// HSTS header to enforce HTTPS in browsers
function addHstsHeader(req, res, next) {
  // HSTS: Max-age=31536000 (1 year), includeSubDomains, preload
  // Only apply in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
}

module.exports = {
  enforceHttps,
  addHstsHeader
};
