/**
 * Brave Search Service
 *
 * Provides search functionality using the official Brave Search API.
 * This service acts as a high-quality search source alongside DuckDuckGo and Open WebSearch.
 *
 * API Key required - Get yours from: https://brave.com/search/api/
 *
 * @module services/game-creator/brave
 */

const axios = require('axios');
const { createLogger } = require('./logger');
const { withRetry, PREDEFINED_STRATEGIES } = require('./retry');

/**
 * Logger instance for Brave service
 * @private
 */
const logger = createLogger('brave', { redactApiKey: true });

/**
 * Service configuration
 */
const CONFIG = {
    enabled: process.env.BRAVE_SEARCH_ENABLED !== 'false',
    apiKey: process.env.BRAVE_SEARCH_API_KEY,
    apiUrl: 'https://api.search.brave.com',
    endpoint: '/v1/search',
    timeout: parseInt(process.env.BRAVE_TIMEOUT) || 15000,
    maxRetries: parseInt(process.env.BRAVE_MAX_RETRIES) || 2,
    rateLimitDelay: parseInt(process.env.BRAVE_RATE_LIMIT_DELAY) || 30000, // 30 seconds between requests
    maxResults: parseInt(process.env.BRAVE_MAX_RESULTS) || 10
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
 * Check if the service is enabled and configured
 * @returns {boolean}
 */
function isEnabled() {
    if (!CONFIG.enabled) {
        return false;
    }
    if (!CONFIG.apiKey) {
        log('Brave Search is enabled but BRAVE_SEARCH_API_KEY is not configured', 'warn');
        return false;
    }
    return true;
}

/**
 * Parse results from Brave Search API
 * @param {Object} data - API response data
 * @returns {Array} Parsed results
 * @private
 */
function parseResults(data) {
    const results = [];

    // Brave Search API returns web results in data.web
    if (data.web && data.web.results && Array.isArray(data.web.results)) {
        data.web.results.forEach(item => {
            if (item.title && item.url) {
                results.push({
                    title: item.title,
                    url: item.url,
                    snippet: item.description || item.snippet || '',
                    image: item.image || null,
                    source: 'brave'
                });
            }
        });
    }

    return results.slice(0, CONFIG.maxResults);
}

/**
 * Search using Brave Search API
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
async function search(query) {
    if (!isEnabled()) {
        log('Brave Search is not enabled or not configured', 'warn', { query });
        return {
            query,
            results: [],
            source: 'brave',
            error: 'Brave Search is not enabled or API key not configured'
        };
    }

    log(`Searching Brave`, 'info', { query });

    // Enforce rate limiting
    await enforceRateLimit();

    return withRetry(async () => {
        const startTime = Date.now();

        const url = `${CONFIG.apiUrl}${CONFIG.endpoint}`;

        log(`Fetching from Brave Search API`, 'debug', { url });

        const response = await axios.get(url, {
            params: {
                q: query,
                count: CONFIG.maxResults,
                search_lang: 'en',
                safesearch: 'moderate'
            },
            headers: {
                'X-Subscription-Token': CONFIG.apiKey,
                'Accept': 'application/json'
            },
            timeout: CONFIG.timeout
        });

        const duration = Date.now() - startTime;

        if (!response.data) {
            throw new Error('Empty response from Brave Search API');
        }

        // Parse the JSON response
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
            source: 'brave',
            totalResults: response.data.web?.total_count || results.length
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
    const result = await search(`${gameTitle} video game`);

    return {
        query: gameTitle,
        results: result.results,
        count: result.results.length,
        source: 'brave'
    };
}

/**
 * Get service configuration
 * @returns {Object}
 */
function getConfig() {
    return {
        enabled: CONFIG.enabled,
        apiKey: CONFIG.apiKey ? '<configured>' : '<not-configured>',
        apiUrl: CONFIG.apiUrl,
        timeout: CONFIG.timeout,
        maxRetries: CONFIG.maxRetries
    };
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
