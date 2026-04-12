/**
 * Open WebSearch Service
 *
 * Provides web search capabilities using the Open WebSearch API.
 * This service integrates with the MCP server for agent-powered game research.
 *
 * @module services/game-creator/open-websearch
 */

const axios = require('axios');
const { createLogger } = require('./logger');

/**
 * Service configuration
 */
const CONFIG = {
    enabled: process.env.OPEN_WEBSEARCH_ENABLED !== 'false',
    apiKey: process.env.OPEN_WEBSEARCH_API_KEY,
    baseUrl: process.env.OPEN_WEBSEARCH_API_URL || 'https://api.search.brave.com',
    endpoint: '/v1/search',
    timeout: 10000,
    maxResults: 10
};

/**
 * Logger instance for Open WebSearch component
 * @private
 */
const logger = createLogger('open-websearch', { redactApiKey: true });

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
 * Check if the service is enabled and configured
 * @returns {boolean}
 */
function isEnabled() {
    if (!CONFIG.enabled) {
        return false;
    }
    if (!CONFIG.apiKey) {
        log('Open WebSearch is enabled but API_KEY is not configured', 'warn');
        return false;
    }
    return true;
}

/**
 * Search the web using Open WebSearch API
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
async function search(query, options = {}) {
    if (!isEnabled()) {
        log('Open WebSearch is not enabled', 'warn');
        return {
            query,
            results: [],
            source: 'open-websearch',
            error: 'Open WebSearch is not enabled'
        };
    }

    log('Searching Open WebSearch', 'info', { query });

    const count = options.count || CONFIG.maxResults;

    try {
        const response = await axios.get(`${CONFIG.baseUrl}${CONFIG.endpoint}`, {
            params: {
                q: query,
                count: count,
                search_lang: 'en',
                safesearch: 'moderate',
                unity_midline: true,
                extra_snippets: true
            },
            headers: {
                'X-Subscription-Token': CONFIG.apiKey,
                'Accept': 'application/json'
            },
            timeout: CONFIG.timeout
        });

        const data = response.data;

        // Extract web results
        const webResults = (data.web || {}).results || [];

        const results = webResults.map(result => ({
            title: result.title || 'Untitled',
            url: result.url || '',
            snippet: result.snippet || '',
            image: result.image || null,
            source: 'open-websearch'
        }));

        log('Open WebSearch completed', 'info', {
            query,
            resultCount: results.length
        });

        return {
            query,
            results,
            source: 'open-websearch',
            totalResults: data.web?.total_count || results.length
        };

    } catch (error) {
        log('Open WebSearch failed: ' + error.message, 'error', {
            query,
            statusCode: response?.status,
            error: error.message
        });

        return {
            query,
            results: [],
            source: 'open-websearch',
            error: error.message
        };
    }
}

/**
 * Get service configuration
 * @returns {Object}
 */
function getConfig() {
    return {
        enabled: CONFIG.enabled,
        apiKey: CONFIG.apiKey ? '<configured>' : '<not-configured>',
        baseUrl: CONFIG.baseUrl
    };
}

module.exports = {
    search,
    isEnabled,
    getConfig,
    CONFIG
};
