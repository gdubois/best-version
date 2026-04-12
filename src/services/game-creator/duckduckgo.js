/**
 * DuckDuckGo Search Service
 *
 * Provides search functionality using DuckDuckGo HTML scraping.
 * No API key required - uses web scraping approach.
 *
 * @module services/game-creator/duckduckgo
 */

const axios = require('axios');
const { createLogger } = require('./logger');
const { withRetry, PREDEFINED_STRATEGIES } = require('./retry');

/**
 * Logger instance for DuckDuckGo service
 * @private
 */
const logger = createLogger('duckduckgo', { redactApiKey: false });

/**
 * Service configuration
 */
const CONFIG = {
    enabled: process.env.DUCKDUCKGO_ENABLED !== 'false',
    searchUrl: 'https://html.duckduckgo.com/html/',
    timeout: parseInt(process.env.DUCKDUCKGO_TIMEOUT) || 15000,
    maxRetries: parseInt(process.env.DUCKDUCKGO_MAX_RETRIES) || 2,
    rateLimitDelay: parseInt(process.env.DUCKDUCKGO_RATE_LIMIT_DELAY) || 60000, // 1 minute between requests
    maxResults: parseInt(process.env.DUCKDUCKGO_MAX_RESULTS) || 10
};

/**
 * Rate limiting state
 * @private
 */
let lastRequestTime = 0;

/**
 * Logger helper (wraps structured logger)
 * @private
 */
async function log(message, level = 'info', context = {}) {
    switch (level) {
        case 'debug':
            await logger.debug(message, context);
            break;
        case 'warn':
            await logger.warn(message, context);
            break;
        case 'error':
            await logger.error(message, context);
            break;
        default:
            await logger.info(message, context);
    }
}

/**
 * Enforce rate limiting
 * @private
 */
async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < CONFIG.rateLimitDelay) {
        const delay = CONFIG.rateLimitDelay - timeSinceLastRequest;
        log(`Rate limiting: waiting ${delay}ms`, 'debug');
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    lastRequestTime = Date.now();
}

/**
 * Parse search results from DuckDuckGo HTML
 * @param {string} html - Raw HTML response
 * @returns {Array} Parsed results
 * @private
 */
function parseResults(html) {
    const results = [];

    // Parse result items from DuckDuckGo HTML format
    // DuckDuckGo returns HTML with <a class="result__a"> tags for results
    // URLs are wrapped via duckduckgo.com/l/ redirect with uddg parameter

    // Find all result blocks using the correct class name
    const resultBlocks = html.match(/<a[^>]*class="result__a"[^>]*>[\s\S]*?<\/a>/gi) || [];

    resultBlocks.forEach((block, index) => {
        // Extract href
        const hrefMatch = block.match(/href="([^"]*)"/);
        if (hrefMatch) {
            let url = hrefMatch[1];

            // If it's a DuckDuckGo redirect, extract the real URL from uddg parameter
            if (url.includes('duckduckgo.com/l/') || url.includes('uddg=')) {
                const uddgMatch = url.match(/uddg=([^&]+)/);
                if (uddgMatch) {
                    url = decodeURIComponent(uddgMatch[1]);
                }
            }

            // Extract title from the anchor text
            const titleMatch = block.match(/>([^<]+)<\/a>/);
            const title = titleMatch ? titleMatch[1].trim() : `Result ${index + 1}`;

            // Try to find snippet from following paragraph
            // Look for the .result__c class (description) that typically follows
            results.push({
                title: title,
                url: url,
                snippet: '' // DuckDuckGo HTML API doesn't easily expose snippets
            });
        }
    });

    return results.slice(0, CONFIG.maxResults);
}

/**
 * Search DuckDuckGo for a query
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
async function search(query) {
    if (!CONFIG.enabled) {
        log('DuckDuckGo search is disabled', 'warn', { query });
        return {
            query,
            results: [],
            disabled: true
        };
    }

    log(`Searching DuckDuckGo`, 'info', { query });

    // Enforce rate limiting
    await enforceRateLimit();

    return withRetry(async () => {
        const startTime = Date.now();

        // Encode query for URL
        const encodedQuery = encodeURIComponent(query);
        const url = `${CONFIG.searchUrl}?q=${encodedQuery}`;

        log(`Fetching from DuckDuckGo`, 'debug', { url });

        const response = await axios.get(url, {
            timeout: CONFIG.timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            maxRedirects: 5
        });

        const duration = Date.now() - startTime;

        if (!response.data || typeof response.data !== 'string') {
            throw new Error('Invalid HTML response from DuckDuckGo');
        }

        // Parse the HTML response
        const results = parseResults(response.data);

 
        log(`Search completed`, 'info', {
            query,
            resultCount: results.length,
            duration
        });

        return {
            query,
            results,
            count: results.length,
            duration,
            source: 'duckduckgo'
        };

    }, {
        ...PREDEFINED_STRATEGIES.network,
        maxRetries: CONFIG.maxRetries,
        logger
    });
}

/**
 * Search for game information specifically
 * @param {string} gameTitle - Game title to search for
 * @returns {Promise<Object>} Game-specific search results
 */
async function searchGame(gameTitle) {
    log(`Searching for game`, 'info', { title: gameTitle });

    // Search with primary query
    const primaryResult = await search(gameTitle);

    return {
        query: gameTitle,
        results: primaryResult.results.slice(0, CONFIG.maxResults),
        count: primaryResult.results.length,
        source: 'duckduckgo'
    };
}

/**
 * Check if service is enabled
 * @returns {boolean}
 */
function isEnabled() {
    return CONFIG.enabled;
}

/**
 * Get service configuration
 * @returns {Object}
 */
function getConfig() {
    return { ...CONFIG };
}

/**
 * Reset rate limiting (useful for testing)
 * @private
 */
function resetRateLimit() {
    lastRequestTime = 0;
}

module.exports = {
    search,
    searchGame,
    isEnabled,
    getConfig,
    parseResults,
    CONFIG,
    // Exposed for testing
    resetRateLimit
};
