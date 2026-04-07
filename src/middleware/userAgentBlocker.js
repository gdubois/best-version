// User-Agent blocking middleware for scraper protection

const fs = require('fs');
const path = require('path');

class UserAgentBlocker {
  constructor(blocklistFile) {
    this.blocklistFile = blocklistFile || path.join(__dirname, '../.blocked_useragents.json');

    // Initialize blocklist file with default patterns if it doesn't exist
    if (!fs.existsSync(this.blocklistFile)) {
      this.saveBlocklist(this.getDefaultBlocklist());
    }
  }

  // Default blocked user-agent patterns (common scrapers/bots)
  getDefaultBlocklist() {
    return {
      patterns: [
        // Common scraper tools
        'python-requests',
        'python-httpx',
        'python-urllib',
        'curl',
        'wget',
        'httpclient',
        'okhttp',
        'java/',
        'apache-httpclient',
        'guava',
        'resttemplate',
        'retrofit',
        // SEO scrapers
        'ahrefsbot',
        'semrushbot',
        'blexbot',
        'contentking',
        'screaming Frog',
        // Data mining bots
        'scrapy',
        'spider',
        'crawler',
        'bot',
        'crawl',
        'scraper',
        'harvest',
        // Monitoring tools (often abused)
        'uptime robot',
        // Known bad actors
        'nutch',
        'libwww',
        'lwp-trivial',
        'urlgrabber',
        'khttp',
        'pycurl',
        // Mass downloaders
        'httrack',
        'webbandit',
        'getright',
        'hitweb',
        // Specific known bad bots (more specific patterns)
        'mj12bot',
        'AhrefsSiteAudit',
        'dotbot',
        'rogerbot'
      ],
      // User-agents that should NOT be blocked (legitimate crawlers)
      allowlist: [
        'googlebot',
        'bingbot',
        'yandexbot',
        'baiduspider',
        'duckduckbot',
        'slackbot',
        'twitterbot',
        'linkedinbot',
        'facebookexternalhit'
      ]
    };
  }

  // Get current blocklist from file
  getBlocklist() {
    try {
      const data = fs.readFileSync(this.blocklistFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading user-agent blocklist:', error);
      return this.getDefaultBlocklist();
    }
  }

  // Save blocklist to file
  saveBlocklist(blocklist) {
    try {
      fs.writeFileSync(this.blocklistFile, JSON.stringify(blocklist, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving user-agent blocklist:', error);
      return false;
    }
  }

  // Add a pattern to the blocklist
  addPattern(pattern) {
    const blocklist = this.getBlocklist();

    if (!blocklist.patterns.includes(pattern.toLowerCase())) {
      blocklist.patterns.push(pattern.toLowerCase());
      this.saveBlocklist(blocklist);
      return true;
    }
    return false;
  }

  // Remove a pattern from the blocklist
  removePattern(pattern) {
    const blocklist = this.getBlocklist();
    const index = blocklist.patterns.indexOf(pattern.toLowerCase());

    if (index !== -1) {
      blocklist.patterns.splice(index, 1);
      this.saveBlocklist(blocklist);
      return true;
    }
    return false;
  }

  // Get all blocked patterns
  getAllPatterns() {
    const blocklist = this.getBlocklist();
    return blocklist.patterns;
  }

  // Check if user-agent should be blocked
  shouldBlockUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') {
      return false;
    }

    const uaLower = userAgent.toLowerCase();
    const blocklist = this.getBlocklist();

    // First check allowlist - if any allowed pattern matches, don't block
    for (const allowed of blocklist.allowlist) {
      if (uaLower.includes(allowed.toLowerCase())) {
        return false; // Allowlisted user-agent
      }
    }

    // Then check blocklist patterns
    for (const pattern of blocklist.patterns) {
      if (uaLower.includes(pattern.toLowerCase())) {
        return true; // Blocked pattern matched
      }
    }

    return false;
  }
}

// Create a single shared instance (config via environment or defaults)
let userAgentBlockerInstance = null;

function getUserAgentBlocker() {
  if (!userAgentBlockerInstance) {
    userAgentBlockerInstance = new UserAgentBlocker();
  }
  return userAgentBlockerInstance;
}

// Middleware to block requests from known scrapers
function blockScrapers(req, res, next) {
  const userAgent = req.get('User-Agent') || req.headers['user-agent'];

  // Exempt health check endpoint from user-agent blocking
  if (req.path === '/health') {
    return next();
  }

  const blocker = getUserAgentBlocker();

  if (blocker.shouldBlockUserAgent(userAgent)) {
    // Log blocked request for monitoring
    console.log(`[UserAgentBlocker] Blocked request from: ${userAgent}`);

    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  next();
}

// Middleware to get blocked user-agents list (admin)
function blockScrapersWithLogging(req, res, next) {
  const userAgent = req.get('User-Agent') || req.headers['user-agent'];

  const blocker = getUserAgentBlocker();

  if (blocker.shouldBlockUserAgent(userAgent)) {
    console.log(`[UserAgentBlocker] BLOCKED: ${userAgent}`);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      reason: 'User-Agent blocked'
    });
  }

  // Log allowed requests from unusual user-agents
  if (userAgent && !userAgent.includes('Mozilla/5')) {
    console.log(`[UserAgentBlocker] Allowed: ${userAgent}`);
  }

  next();
}

module.exports = {
  UserAgentBlocker,
  getUserAgentBlocker,
  blockScrapers,
  blockScrapersWithLogging
};
