/**
 * Wikipedia Image Service
 *
 * Fetches game cover images from Wikipedia.
 * Handles API rate limiting and image URL extraction.
 *
 * @module services/game-creator/wikipedia
 */

const axios = require('axios');
const { createLogger } = require('./logger');

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const RATE_LIMIT_DELAY = 6000; // 6 seconds between requests (10 req/min limit)
const USER_AGENT = 'BestVersion/1.0 (https://bestversion.dev) Game metadata scraper';

/**
 * Rate limiting state
 */
let lastRequestTime = 0;

/**
 * Logger instance for wikipedia component
 * @private
 */
const logger = createLogger('wikipedia', { redactApiKey: true });

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
 * @returns {Promise<void>}
 */
async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
        log(`Rate limiting: waiting ${delay}ms`, 'info');
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    lastRequestTime = Date.now();
}

/**
 * Search Wikipedia for a game article
 * @param {string} query - Search query (game title)
 * @returns {Promise<Array>}
 */
async function searchWikipedia(query) {
    await enforceRateLimit();

    log(`Searching Wikipedia: ${query}`, 'info');

    try {
        const params = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: 10,
            format: 'json',
            origin: '*'
        });

        const response = await axios.get(WIKIPEDIA_API_BASE, {
            params,
            timeout: 10000,
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        const results = response.data.query?.search || [];
        log(`Found ${results.length} results`, 'info');

        return results;

    } catch (error) {
        log(`Search failed: ${error.message}`, 'error');
        return [];
    }
}

/**
 * Get page images for a Wikipedia title
 * @param {string} title - Wikipedia page title
 * @param {number} maxWidth - Maximum image width (default: 600)
 * @returns {Promise<Object|null>}
 */
async function getPageImages(title, maxWidth = 600) {
    await enforceRateLimit();

    log(`Getting page images for: ${title}`, 'info');

    try {
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'pageimages',
            pithumbsize: maxWidth,
            piprop: 'thumbnail|original',
            format: 'json',
            origin: '*'
        });

        const response = await axios.get(WIKIPEDIA_API_BASE, {
            params,
            timeout: 10000,
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        const pages = response.data.query?.pages;
        if (!pages) {
            return null;
        }

        // Get first (and usually only) page
        const page = Object.values(pages)[0];

        return {
            originalUrl: page.original?.source,
            thumbnailUrl: page.thumbnail?.source,
            width: page.original?.width,
            height: page.original?.height
        };

    } catch (error) {
        log(`Get page images failed: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Check if a Wikipedia search result is relevant to the game title
 * @param {string} title - Wikipedia page title
 * @param {string} gameTitle - The game title we're searching for
 * @returns {boolean}
 */
function isRelevantResult(title, gameTitle) {
    const titleLower = title.toLowerCase();
    const gameLower = gameTitle.toLowerCase();

    // Exact match (case insensitive)
    if (titleLower === gameLower) {
        return true;
    }

    // Title starts with game title
    if (titleLower.startsWith(gameLower)) {
        return true;
    }

    // Title contains game title
    if (titleLower.includes(gameLower)) {
        return true;
    }

    // Check for disambiguation pages (e.g., "Legend of Mana (1999 game)")
    if (titleLower.includes(gameLower) && (title.includes('(') || title.includes('game'))) {
        return true;
    }

    return false;
}

/**
 * Check if an image URL is suitable (prefer photos over logos/SVG)
 * @param {string} url - Image URL
 * @returns {boolean}
 */
function isSuitableImage(url) {
    // Filter out SVG logos - prefer photographic images
    if (url.includes('.svg')) {
        return false;
    }

    // Prefer PNG and JPG images
    if (url.match(/\.(png|jpg|jpeg)(\?.*)?$/i)) {
        return true;
    }

    // If it's from Wikimedia upload, it's probably good
    if (url.includes('upload.wikimedia.org')) {
        return true;
    }

    return false;
}

/**
 * Find and extract cover image URL for a game
 * @param {string} gameTitle - Game title to search for
 * @param {number} maxWidth - Maximum desired image width
 * @returns {Promise<Object>}
 */
async function findGameCover(gameTitle, maxWidth = 600) {
    log(`Finding cover image for: ${gameTitle}`, 'info');

    try {
        // Search for the game
        const searchResults = await searchWikipedia(gameTitle);

        if (searchResults.length === 0) {
            log('No Wikipedia articles found', 'warn');
            return {
                found: false,
                imageUrl: null,
                source: null
            };
        }

        // Filter results to only include relevant game articles
        const relevantResults = searchResults.filter(result =>
            isRelevantResult(result.title, gameTitle)
        );

        log(`Found ${relevantResults.length} relevant articles out of ${searchResults.length} total`, 'info');

        if (relevantResults.length === 0) {
            log('No relevant game articles found', 'warn');
            return {
                found: false,
                imageUrl: null,
                source: null
            };
        }

        // Try each relevant search result until we find one with a suitable image
        for (const result of relevantResults) {
            const images = await getPageImages(result.title, maxWidth);

            if (images && images.originalUrl && isSuitableImage(images.originalUrl)) {
                log(`Found suitable image in: ${result.title}`, 'info');
                return {
                    found: true,
                    imageUrl: images.originalUrl,
                    thumbnailUrl: images.thumbnailUrl,
                    source: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
                    width: images.width,
                    height: images.height
                };
            } else if (images && images.originalUrl) {
                log(`Image not suitable (SVG/logo) in: ${result.title}`, 'debug');
            }
        }

        // No suitable image found in any article
        log('No suitable cover image found in any article', 'warn');
        return {
            found: false,
            imageUrl: null,
            source: null
        };

    } catch (error) {
        log(`Find cover failed: ${error.message}`, 'error');
        return {
            found: false,
            imageUrl: null,
            source: null,
            error: error.message
        };
    }
}

/**
 * Download an image from URL
 * @param {string} imageUrl - URL to download
 * @param {string} outputPath - Where to save the image
 * @returns {Promise<Object>}
 */
async function downloadImage(imageUrl, outputPath) {
    log(`Downloading image: ${imageUrl}`, 'info', { outputPath });

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5
        });

        await require('fs').promises.writeFile(outputPath, response.data);

        log(`Image downloaded successfully`, 'info', { outputPath });

        return {
            success: true,
            path: outputPath,
            size: response.data.length
        };

    } catch (error) {
        log(`Download failed: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get Wikipedia API stats
 * @returns {Object}
 */
function getStats() {
    return {
        lastRequestTime: lastRequestTime,
        rateLimitDelay: RATE_LIMIT_DELAY,
        apiBase: WIKIPEDIA_API_BASE
    };
}

module.exports = {
    searchWikipedia,
    getPageImages,
    findGameCover,
    downloadImage,
    getStats,
    enforceRateLimit
};
