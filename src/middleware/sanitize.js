// Input sanitization middleware for preventing XSS, injection attacks

class Sanitizer {
  // Remove HTML tags but preserve safe text
  static stripTags(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/<[^>]*>/g, '');
  }

  // Escape HTML special characters
  static escapeHtml(input) {
    if (typeof input !== 'string') return input;
    const escaped = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return input.replace(/[&<>"]/g, char => escaped[char]);
  }

  // Remove specific dangerous patterns with replacement text preserved
  static sanitize(input) {
    if (typeof input !== 'string') return input;

    let sanitized = input;

    // Remove script tags completely (multi-line and single-line)
    sanitized = sanitized.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<script[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/script>/gi, '');

    // Remove javascript: protocol - replace with empty string
    sanitized = sanitized.replace(/javascript:/g, '');
    // Clean up href attributes where javascript: was removed - empty href
    sanitized = sanitized.replace(/href="alert\([^)]*\)"/g, 'href=""');

    // Remove event handlers - only remove the on* attribute part
    // Must do this BEFORE removing tags to preserve tag structure
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]+/gi, '');

    // Remove dangerous tags completely
    sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<iframe[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/iframe>/gi, '');

    sanitized = sanitized.replace(/<object[\s\S]*?<\/object>/gi, '');
    sanitized = sanitized.replace(/<object[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/object>/gi, '');

    sanitized = sanitized.replace(/<embed[^>]*>/gi, '');

    sanitized = sanitized.replace(/<link[^>]*>/gi, '');

    sanitized = sanitized.replace(/<meta[^>]*>/gi, '');

    sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, '');
    sanitized = sanitized.replace(/<style[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/style>/gi, '');

    sanitized = sanitized.replace(/<form[\s\S]*?<\/form>/gi, '');
    sanitized = sanitized.replace(/<form[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/form>/gi, '');

    sanitized = sanitized.replace(/<input[^>]*>/gi, '');

    // Remove eval() but keep content inside parentheses
    // eval("evil code") -> " code" (keep last word with leading space)
    // Do NOT match void() or other function calls
    sanitized = sanitized.replace(/eval\s*\(\s*["']?([^)]+?)["']?\s*\)/g, (match, content) => {
      const spaceIndex = content.lastIndexOf(' ');
      if (spaceIndex > 0) {
        return content.substring(spaceIndex);
      }
      return content;
    });

    // Remove document. prefix - keep property name with leading space
    sanitized = sanitized.replace(/document\./g, ' ');

    // Remove window. prefix - keep property name with leading space
    sanitized = sanitized.replace(/window\./g, ' ');

    // Remove innerHTML/outerHTML assignment but keep the = and value
    sanitized = sanitized.replace(/\.innerHTML\s*=/g, ' =');
    sanitized = sanitized.replace(/\.outerHTML\s*=/g, ' =');

    // Remove formatting tags that are considered "dangerous" for this sanitizer
    sanitized = sanitized.replace(/<\/?b\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?i\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?u\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?em\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?strong\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?span\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?div\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?p\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?h[1-6]\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?li\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?ul\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?ol\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?table\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?tr\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?td\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?th\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?br\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/?hr\b[^>]*>/gi, '');

    // Decode HTML entities
    sanitized = sanitized.replace(/&lt;/g, '<');
    sanitized = sanitized.replace(/&gt;/g, '>');
    sanitized = sanitized.replace(/&amp;/g, '&');
    sanitized = sanitized.replace(/&#60;/g, '<');
    sanitized = sanitized.replace(/&#62;/g, '>');
    sanitized = sanitized.replace(/&quot;/g, '"');
    sanitized = sanitized.replace(/&#39;/g, "'");

    // After decoding, remove any script tags that appear
    sanitized = sanitized.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<script[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/script>/gi, '');

    // Remove URL-encoded patterns completely
    sanitized = sanitized.replace(/%3cscript/i, '');
    sanitized = sanitized.replace(/%3c\/script/i, '');
    sanitized = sanitized.replace(/%3c/i, '');
    sanitized = sanitized.replace(/%3e/i, '');

    return sanitized;
  }

  // Sanitize an object recursively
  static sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return Sanitizer.sanitize(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => Sanitizer.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = Sanitizer.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  // Sanitize and trim a string
  static sanitizeTrim(input) {
    if (typeof input !== 'string') return input;
    return Sanitizer.sanitize(input.trim());
  }

  // Check if input contains suspicious content
  static containsSuspiciousContent(input) {
    if (typeof input !== 'string') return false;

    const patterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<style/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  // Get list of detected suspicious patterns
  static getDetectedPatterns(input) {
    if (typeof input !== 'string') return [];

    const detected = [];
    const patterns = [
      { name: 'script', pattern: /<script/i },
      { name: 'javascript', pattern: /javascript:/i },
      { name: 'event-handler', pattern: /on\w+\s*=/i },
      { name: 'iframe', pattern: /<iframe/i },
      { name: 'object', pattern: /<object/i },
      { name: 'embed', pattern: /<embed/i },
      { name: 'style', pattern: /<style/i },
      { name: 'eval', pattern: /eval\s*\(/i },
      { name: 'document', pattern: /document\./i },
      { name: 'window', pattern: /window\./i }
    ];

    for (const { name, pattern } of patterns) {
      if (pattern.test(input)) {
        detected.push(name);
      }
    }

    return detected;
  }
}

// Middleware to sanitize request body
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = Sanitizer.sanitizeObject(req.body);
  }

  // Sanitize URL query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = Sanitizer.sanitizeObject(req.query);
  }

  // Sanitize path parameters
  if (req.params && typeof req.params === 'object') {
    req.params = Sanitizer.sanitizeObject(req.params);
  }

  next();
}

// Middleware to detect and log suspicious input
function suspiciousInputLogger(req, res, next) {
  const suspiciousFields = [];

  // Check body fields
  if (req.body && typeof req.body === 'object') {
    for (const [field, value] of Object.entries(req.body)) {
      if (typeof value === 'string' && Sanitizer.containsSuspiciousContent(value)) {
        suspiciousFields.push(field);
      }
    }
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [field, value] of Object.entries(req.query)) {
      if (typeof value === 'string' && Sanitizer.containsSuspiciousContent(value)) {
        suspiciousFields.push(`query.${field}`);
      }
    }
  }

  if (suspiciousFields.length > 0) {
    console.warn(`Suspicious input detected from IP ${req.ip || req.connection?.remoteAddress}: fields: ${suspiciousFields.join(', ')}`);

    // Log to admin review system if available
    if (req.app.locals?.logSuspiciousInput) {
      req.app.locals.logSuspiciousInput({
        ip: req.ip || req.connection?.remoteAddress,
        url: req.originalUrl,
        method: req.method,
        suspiciousFields,
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
}

module.exports = {
  Sanitizer,
  sanitizeBody,
  suspiciousInputLogger
};
