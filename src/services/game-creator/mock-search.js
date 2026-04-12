/**
 * Mock Search Service for Testing
 *
 * Provides mock search results for testing the game creator pipeline
 * without relying on external APIs that may be rate-limited or blocked.
 *
 * @module services/game-creator/mock-search
 */

/**
 * Mock search results for known games
 */
const MOCK_RESULTS = {
    'sweethome': [
        {
            title: 'Sweet Home (video game) - Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Sweet_Home_(video_game)',
            snippet: 'Sweet Home is a 1989 survival horror adventure game developed and published by Konami for the Family Computer (Famicom). The game was directed by Toshiki Yamamura and was one of the first survival horror games, predating Resident Evil.'
        },
        {
            title: 'Sweet Home (game) | Sweet Home Wiki | Fandom',
            url: 'https://sweethome.fandom.com/wiki/Sweet_Home_(game)',
            snippet: 'Sweet Home is a survival horror game released for the Famicom in 1989. It follows a team of paranormal investigators led by Dr. Hideto Morisawa as they explore an abandoned mansion.'
        },
        {
            title: 'Sweet Home: The forgotten 1989 game that inspired the Resident Evil series',
            url: 'https://www.inverse.com/gaming/sweet-home-8bit-week',
            snippet: 'Sweet Home is widely considered one of the first survival horror games and a direct inspiration for Capcom\'s Resident Evil series. The game was released exclusively in Japan for the NES.'
        },
        {
            title: 'Sweet Home - MobyGames',
            url: 'https://www.mobygames.com/game/13590/sweet-home/',
            snippet: 'Sweet Home was released on October 26, 1989 in Japan for the NES/Famicom. Developer: Konami. Genre: Adventure, Horror.'
        },
        {
            title: 'Sweet Home — StrategyWiki',
            url: 'https://strategywiki.org/wiki/Sweet_Home',
            snippet: 'Complete walkthrough, guide, and walkthrough for Sweet Home on Famicom/NES. Includes puzzle solutions, item locations, and ending walkthrough.'
        },
        {
            title: 'Sweet Home PC-Engine Translation Patch',
            url: 'https://www.romhacking.net/game/7024/',
            snippet: 'Translation patch for Sweet Home PC-Engine CD release. Makes the game playable in English with full translation.'
        }
    ]
};

/**
 * Search for mock results
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
async function search(query) {
    console.log('[MOCK SEARCH] Query:', query);

    // Normalize query for matching
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Find matching mock results
    for (const [key, results] of Object.entries(MOCK_RESULTS)) {
        if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
            console.log('[MOCK SEARCH] Found', results.length, 'mock results');
            return {
                query,
                results: results.map(r => ({
                    ...r,
                    source: 'mock'
                })),
                count: results.length,
                duration: 50,
                source: 'mock'
            };
        }
    }

    // Return empty results if no match
    console.log('[MOCK SEARCH] No mock results found, returning empty');
    return {
        query,
        results: [],
        count: 0,
        duration: 10,
        source: 'mock',
        error: 'No mock data available for this query'
    };
}

/**
 * Check if service is enabled
 * @returns {boolean}
 */
function isEnabled() {
    return process.env.MOCK_SEARCH_ENABLED === 'true';
}

/**
 * Get service configuration
 * @returns {Object}
 */
function getConfig() {
    return {
        enabled: isEnabled(),
        availableGames: Object.keys(MOCK_RESULTS)
    };
}

module.exports = {
    search,
    isEnabled,
    getConfig,
    MOCK_RESULTS
};
