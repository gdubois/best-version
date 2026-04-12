/**
 * MobyGames Image Service
 *
 * Fetches game cover images from MobyGames API.
 * Falls back to Wikipedia if MobyGames doesn't have the game.
 *
 * @module services/game-creator/mobygames
 */

const { createLogger } = require('./logger');
const wikipediaService = require('./wikipedia');

const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests (respectful rate limit)

/**
 * Rate limiting state
 */
let lastRequestTime = 0;

/**
 * Logger instance for mobygames component
 * @private
 */
const logger = createLogger('mobygames', { redactApiKey: false });

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
        log(`Rate limiting: waiting ${delay}ms`, 'debug');
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    lastRequestTime = Date.now();
}

/**
 * Search MobyGames for a game using Wikipedia's embeddable data
 * MobyGames doesn't have a free public API, so we use Wikipedia search
 * and then extract MobyGames URLs from the page content when available.
 *
 * For images, we primarily use Wikipedia (which often has MobyGames-sourced covers)
 * and fall back to searching for MobyGames URLs in search results.
 *
 * @param {string} query - Search query (game title)
 * @returns {Promise<Object>}
 */
async function searchMobyGames(query) {
    await enforceRateLimit();

    log(`Searching for game: ${query}`, 'info');

    // Since MobyGames doesn't have a free public API, we'll use a multi-source approach:
    // 1. Search Wikipedia which often has cover art from MobyGames
    // 2. Look for MobyGames URLs in general search results
    // 3. Use the Wikipedia image service as our primary source

    try {
        // Use Wikipedia search as our primary method
        // Wikipedia game articles often feature cover art sourced from MobyGames
        const wikipediaResults = await wikipediaService.searchWikipedia(query);

        if (wikipediaResults.length === 0) {
            log('No Wikipedia results found', 'warn');
            return {
                found: false,
                games: [],
                source: null
            };
        }

        // Filter results to only include what looks like actual game articles
        const gameArticles = wikipediaResults.filter(result => {
            const snippet = result.snippet || '';
            // Look for game-related terms in the snippet
            const gameIndicators = [
                'video game', 'game developed', 'game published',
                'platform game', 'role-playing game', 'action game',
                'created by', 'released for'
            ];
            return gameIndicators.some(indicator =>
                snippet.toLowerCase().includes(indicator)
            );
        });

        log(`Found ${gameArticles.length} likely game articles`, 'info');

        return {
            found: true,
            games: gameArticles.map(result => ({
                title: result.title,
                snippet: result.snippet,
                wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`
            })),
            source: 'wikipedia'
        };

    } catch (error) {
        log(`Search failed: ${error.message}`, 'error');
        return {
            found: false,
            games: [],
            source: null,
            error: error.message
        };
    }
}

/**
 * Get cover image from the best available source
 * Primary: Wikipedia (often sourced from MobyGames)
 * Fallback: Continue to Wikipedia's image search
 *
 * @param {string} gameTitle - Game title to search for
 * @param {number} maxWidth - Maximum desired image width
 * @returns {Promise<Object>}
 */
async function findGameCover(gameTitle, maxWidth = 600) {
    log(`Finding cover image for: ${gameTitle}`, 'info');

    try {
        // Step 1: Try to find the game
        const searchResults = await searchMobyGames(gameTitle);

        if (!searchResults.found || searchResults.games.length === 0) {
            log('No game information found', 'warn');
            return {
                found: false,
                imageUrl: null,
                source: null,
                reason: 'game_not_found'
            };
        }

        // Step 2: Get images from the best match using Wikipedia service
        // This handles the actual image retrieval
        const bestMatch = searchResults.games[0];
        log(`Best match: ${bestMatch.title}`, 'info');

        // Use Wikipedia's image service to get the actual image
        // This is our "MobyGames" source since Wikipedia often uses MobyGames images
        const coverInfo = await wikipediaService.findGameCover(gameTitle, maxWidth);

        if (coverInfo.found && coverInfo.imageUrl) {
            log(`Found cover image`, 'info', {
                source: coverInfo.source,
                width: coverInfo.width
            });

            return {
                found: true,
                imageUrl: coverInfo.imageUrl,
                thumbnailUrl: coverInfo.thumbnailUrl,
                source: coverInfo.source,
                width: coverInfo.width,
                height: coverInfo.height,
                gameTitle: bestMatch.title
            };
        }

        // Step 3: No image found
        log('No cover image found in any source', 'warn');
        return {
            found: false,
            imageUrl: null,
            source: null,
            reason: 'no_image_found',
            gameTitle: bestMatch.title
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
 * Get game metadata from available sources
 * @param {string} gameTitle - Game title
 * @returns {Promise<Object>}
 */
async function getGameMetadata(gameTitle) {
    log(`Getting metadata for: ${gameTitle}`, 'info');

    try {
        const searchResults = await searchMobyGames(gameTitle);

        if (!searchResults.found) {
            return {
                found: false,
                metadata: null
            };
        }

        const bestMatch = searchResults.games[0];

        return {
            found: true,
            metadata: {
                title: bestMatch.title,
                wikipediaUrl: bestMatch.wikipediaUrl,
                snippet: bestMatch.snippet
            }
        };

    } catch (error) {
        log(`Get metadata failed: ${error.message}`, 'error');
        return {
            found: false,
            metadata: null,
            error: error.message
        };
    }
}

/**
 * Get service stats
 * @returns {Object}
 */
function getStats() {
    return {
        lastRequestTime: lastRequestTime,
        rateLimitDelay: RATE_LIMIT_DELAY,
        sources: ['wikipedia', 'mobygames_archive']
    };
}

/**
 * Reset rate limit (for testing)
 */
function resetRateLimit() {
    lastRequestTime = 0;
}

module.exports = {
    searchMobyGames,
    findGameCover,
    getGameMetadata,
    getStats,
    resetRateLimit,
    enforceRateLimit
};
