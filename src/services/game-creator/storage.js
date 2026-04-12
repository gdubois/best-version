/**
 * Game Storage Service
 *
 * Assembles and stores game metadata files.
 * Manages the games library and index.
 *
 * @module services/game-creator/storage
 */

const fs = require('fs').promises;
const path = require('path');
const { lock } = require('proper-lockfile');
const { createLogger } = require('./logger');

const GAMES_PATH = path.join(__dirname, '../../../games');
const GAMES_INDEX = path.join(GAMES_PATH, 'index.json');
const GAMES_LOCK = path.join(GAMES_PATH, '.index.json.lock');

const LOCK_OPTIONS = {
    stale: 10000,
    update: 1000,
    retries: {
        retries: 3,
        factor: 1.5,
        minTimeout: 1000
    }
};

/**
 * Logger instance for storage component
 * @private
 */
const logger = createLogger('storage', { redactApiKey: true });

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
 * Generate URL slug from game title
 * @param {string} title
 * @returns {string}
 */
function generateSlug(title) {
    return '/games/' + title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')  // Remove special chars
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/-+/g, '-');       // Replace multiple hyphens
}

/**
 * Load games index with locking
 * @returns {Promise<Object>}
 * @private
 */
async function loadGamesIndex() {
    try {
        const release = await lock(GAMES_LOCK, LOCK_OPTIONS);
        try {
            const data = await fs.readFile(GAMES_INDEX, 'utf8');
            return JSON.parse(data);
        } finally {
            release();
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { games: [] };
        }
        throw error;
    }
}

/**
 * Save games index with locking
 * @param {Object} indexData
 * @private
 */
async function saveGamesIndex(indexData) {
    const release = await lock(GAMES_LOCK, LOCK_OPTIONS);
    try {
        await fs.writeFile(GAMES_INDEX, JSON.stringify(indexData, null, 2), 'utf8');
    } finally {
        release();
    }
}

/**
 * Check if a game exists using the index (with locking for consistency)
 * @param {string} slug
 * @returns {Promise<boolean>}
 */
async function gameExists(slug) {
    try {
        const index = await loadGamesIndex();
        const slugId = slug.split('/').pop();

        return index.games.some(g => {
            // Check by slug
            if (g.slug === slug) {
                return true;
            }

            // Also check if file would exist (legacy check)
            const fileSlug = g.slug.split('/').pop();
            if (fileSlug === slugId) {
                return true;
            }

            // Check alternative names
            if (g.alternativeNames && g.alternativeNames.includes(slugId)) {
                return true;
            }

            return false;
        });
    } catch (error) {
        // If index doesn't exist, fall back to file check
        const filePath = path.join(GAMES_PATH, `${slug.split('/').pop()}.json`);
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Assemble complete game data from research results
 * @param {Object} researchData - Research results
 * @param {Object} options
 * @returns {Object}
 */
function assembleGameData(researchData, options = {}) {
    const { title, alternativeTitles, genres, platforms, releaseDate, developers, publishers, description, synopsis, reception, playToday, key_features, features, themes, similarGames, serie } = researchData;

    // Generate slug
    const slug = generateSlug(title);

    // Convert platforms array to structured format
    // Handle both string arrays (old format) and structured objects (LLM output)
    const validRegions = ['Japan', 'North America', 'Europe', 'Australia', 'Asia', 'Brazil', 'World'];

    const structuredPlatforms = (platforms || []).map(platform => {
        if (typeof platform === 'string') {
            // Old format: just platform name
            return {
                name: platform,
                region: 'World',
                release_date: releaseDate || '0000-00-00'
            };
        } else if (typeof platform === 'object') {
            // New format: LLM output with name, region, release_date
            let region = platform.region || 'World';
            // Map common region names to valid enum values
            if (region.toLowerCase() === 'global') {
                region = 'World';
            } else if (!validRegions.includes(region)) {
                region = 'World'; // Default to World if invalid
            }

            return {
                name: platform.name || platform.platform || 'Unknown',
                region: region,
                release_date: platform.release_date || releaseDate || '0000-00-00'
            };
        }
        return { name: 'Unknown', region: 'World', release_date: '0000-00-00' };
    });

    // Normalize genres to match schema enum values EXACTLY
    const validGenres = [
        'Action', 'Action RPG', 'Adventure', 'Fighting', 'FPS', 'JRPG',
        'Platform', 'Puzzle', 'Racing', 'RPG', 'Role-Playing Game (RPG)',
        'RTS', "Shoot 'em up", 'Simulator', 'Social Simulation', 'Sports',
        'Stealth', 'Strategy', 'Survival Horror', 'Tactical Role-Playing'
    ];

    const genreMap = {
        'Point-and-click': 'Adventure',
        'Point and click': 'Adventure',
        'Visual novel': 'Adventure',
        'Interactive fiction': 'Adventure',
        'Platformer': 'Platform',
        'Roguelike': 'RPG',
        'MMORPG': 'RPG',
        'Shooter': 'Action',
        'Horror': 'Survival Horror',
        'Survival': 'Survival Horror',
        'Simulation': 'Simulator'
    };

    const normalizedGenres = [...new Set((genres || []).map(g => genreMap[g] || g))]
        .filter(g => validGenres.includes(g));

     // Process play_today data from research - must match schema exactly
    // Valid emulator platform values per schema
    const validEmulatorPlatforms = ['Windows', 'Android', 'Linux', 'macOS'];

    const processedPlayToday = (playToday || []).map(pt => {
        const patchObjects = (pt.recommended_patches || []).map(p => {
            if (typeof p === 'string') {
                // Handle string patches: split by " - " if present, otherwise use as both name and description
                const parts = p.split(' - ');
                if (parts.length >= 2) {
                    const patchObj = {
                        name: parts[0].trim(),
                        description: parts.slice(1).join(' - ').trim()
                    };
                    if (p.url) patchObj.url = p.url;
                    return patchObj;
                }
                // If no " - " separator, use the string as both name and description
                const patchObj = {
                    name: p.trim().length > 60 ? p.trim().substring(0, 57) + '...' : p.trim(),
                    description: p.trim()
                };
                if (p.url) patchObj.url = p.url;
                return patchObj;
            }
            // Handle object patches - URL is optional per schema (only include if present)
            const patchObj = {
                name: p.name || 'Patch',
                description: p.description || p.name || 'No description'
            };
            if (p.url) patchObj.url = p.url;
            return patchObj;
        }).filter(p => p.name && p.description); // URL is optional, only require name and description

        const emulatorObjects = (pt.emulators || []).map(e => {
            if (typeof e === 'string') {
                return {
                    platform: 'Windows',
                    recommended_emulator: e,
                    optimal_settings: ['Default settings']
                };
            }
            // Validate platform against enum, default to Windows if invalid
            let platform = e.platform || 'Windows';
            if (!validEmulatorPlatforms.includes(platform)) {
                platform = 'Windows';
            }
            return {
                platform: platform,
                recommended_emulator: e.recommended_emulator || e.name || 'Emulator',
                optimal_settings: e.optimal_settings || ['Default settings']
            };
        }).filter(e => e.recommended_emulator);

        // Extract platform as a string - handle both string and structured object formats
        let platformName;
        if (typeof pt.platform === 'string') {
            platformName = pt.platform;
        } else if (pt.platform && typeof pt.platform === 'object') {
            // LLM outputs structured object: { name, region, release_date }
            platformName = pt.platform.name || 'Unknown';
        } else {
            platformName = 'Unknown';
        }

        return {
            platform: platformName,
            details: pt.details,
            available_in_english: {
                official_localization: pt.available_in_english !== false
            },
            recommended_patches: patchObjects,
            emulators: emulatorObjects
        };
    }).filter(pt => pt.platform && pt.details);

    // Fallback play_today if none from research
    const finalPlayToday = processedPlayToday.length > 0 ? processedPlayToday : [
        {
            platform: structuredPlatforms[0]?.name || 'Unknown',
            details: 'Original release',
            available_in_english: { official_localization: true },
            recommended_patches: [],
            emulators: []
        }
    ];

   // Handle serie data properly - must have non-null values for required fields
    const serieData = {
        is_part_of_serie: false,
        serie_name: '',
        part_number: 1  // Default to 1 (minimum valid value)
    };
    if (options.isPartOfSeries || serie?.is_part_of_serie) {
        serieData.is_part_of_serie = true;
        serieData.serie_name = options.seriesName || serie?.serie_name || '';
        serieData.part_number = options.partNumber || serie?.part_number || 1;
    }

    // Handle similar_games - must be array of objects with {title, url_slug}
    const similarGamesData = (options.similarGames || similarGames || []).map(game => {
        if (typeof game === 'string') {
            // Convert string to object format
            return {
                title: game,
                url_slug: '/games/' + game.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            };
        } else if (game && typeof game === 'object') {
            // Already in object format
            return {
                title: game.title || 'Unknown',
                url_slug: game.url_slug || '/games/' + (game.title || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')
            };
        }
        return null;
    }).filter(Boolean);

    // Assemble metadata object
    const gameData = {
        basic_info: {
            url_slug: slug,
            title: title,
            cover_url: `/images/${slug.split('/').pop()}.jpg`,
            genres: normalizedGenres.length > 0 ? normalizedGenres : ['Adventure'],
            themes: options.themes || (themes && themes.length > 0 ? themes : (researchData.themes && researchData.themes.length > 0 ? researchData.themes : ['Classic'])),
            modes: {
                single_player: true,
                multiplayer_local: false,
                multiplayer_online: false,
                co_op: false
            },
            difficulty_rating: options.difficultyRating || 3,
            developers: developers || ['Unknown'],
            publishers: publishers || developers || ['Unknown']
        },
        release: {
            alternative_names: alternativeTitles || [],
            platforms: structuredPlatforms.length > 0 ? structuredPlatforms : [
                { name: 'Unknown', region: 'World', release_date: '0000-00-00' }
            ]
        },
        serie: serieData,
        similar_games: similarGamesData,
        play_today: finalPlayToday,
        description: {
            synopsis: synopsis || description || 'No synopsis available.',
            key_features: options.keyFeatures || (key_features && key_features.length > 0 ? key_features : (features && features.length > 0 ? features : ['Classic gameplay'])),
            long_description: description || 'No description available.',
            legacy_and_impact: options.legacyAndImpact || (reception?.legacy ? [reception.legacy] : (researchData.reception?.legacy ? [researchData.reception.legacy] : ['Classic game']))
        }
    };

    // Set reception data if available
    if (reception) {
        if (reception.scores && reception.scores.length > 0) {
            // Calculate average score - normalize to 1.0-10.0 scale
            const avgScore = reception.scores.reduce((a, b) => a + b, 0) / reception.scores.length;
            // If scores are already 0-10, use as-is; if 0-100, divide by 10
            const normalizedScore = avgScore > 10 ? avgScore / 10 : avgScore;
            // Round to 1 decimal place and clamp to 1.0-10.0 range
            gameData.basic_info.reception_score = Math.max(1.0, Math.min(10.0, Math.round(normalizedScore * 10) / 10));
        }
        if (reception.reviews && reception.reviews.length > 0) {
            gameData.basic_info.review = reception.reviews[0];
        }
        if (reception.legacy) {
            gameData.description.legacy_and_impact = [reception.legacy];
        }
    }

    return {
        slug,
        data: gameData
    };
}

/**
 * Save game data to file and update index
 * @param {string} slug - URL slug (must match gameData.basic_info.url_slug)
 * @param {Object} gameData - Complete game metadata
 * @returns {Promise<Object>}
 */
async function saveGame(slug, gameData) {
    // ENFORCE: The slug parameter must match the url_slug in the game data
    if (gameData.basic_info.url_slug !== slug) {
        log(`Slug mismatch - enforcing filename slug: ${slug}`, 'warn', {
            providedSlug: slug,
            dataSlug: gameData.basic_info.url_slug
        });
        // Ensure the game data's url_slug matches the filename slug
        gameData.basic_info.url_slug = slug;
    }

    const fileName = slug.split('/').pop() + '.json';
    const filePath = path.join(GAMES_PATH, fileName);

    log(`Saving game: ${gameData.basic_info.title}`, 'info', { slug });

    // Check if file already exists
    if (await gameExists(slug)) {
        throw new Error(`Game file already exists: ${slug}`);
    }

    // Write game file
    await fs.writeFile(filePath, JSON.stringify(gameData, null, 2), 'utf8');

    // Update index
    const index = await loadGamesIndex();
    const gameEntry = {
        title: gameData.basic_info.title,
        slug: slug,
        alternativeNames: gameData.release?.alternative_names || []
    };

    index.games.push(gameEntry);
    await saveGamesIndex(index);

    log(`Game saved successfully`, 'info', { slug, fileName });

    return {
        slug,
        filePath,
        title: gameData.basic_info.title
    };
}

/**
 * Get game data by slug
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
async function getGame(slug) {
    const fileName = slug.split('/').pop() + '.json';
    const filePath = path.join(GAMES_PATH, fileName);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Get all games from the library
 * @returns {Promise<Array>}
 */
async function getAllGames() {
    const index = await loadGamesIndex();
    return index.games;
}

/**
 * Get library statistics
 * @returns {Promise<Object>}
 */
async function getLibraryStats() {
    const index = await loadGamesIndex();
    const games = index.games;

    // Count genres
    const genreCounts = {};
    for (const game of games) {
        const gameData = await getGame(game.slug);
        if (gameData?.basic_info?.genres) {
            for (const genre of gameData.basic_info.genres) {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            }
        }
    }

    return {
        totalGames: games.length,
        genres: genreCounts
    };
}

/**
 * Process a research result and save the game
 * @param {Object} researchData
 * @param {Object} validationResult
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function processAndSave(researchData, validationResult, options = {}) {
    // Validate first
    if (!validationResult.valid) {
        log('Validation failed, not saving game', 'warn', {
            confidence: validationResult.confidenceScore,
            recommendation: validationResult.recommendation
        });
        return {
            success: false,
            reason: 'validation_failed',
            validation: validationResult
        };
    }

    try {
        // Assemble game data
        const { slug, data: gameData } = assembleGameData(researchData, {
            ...options,
            confidence: researchData.confidence
        });

        // Save to storage
        const result = await saveGame(slug, gameData);

        log('Game processed and saved successfully', 'info', {
            slug,
            confidence: researchData.confidence
        });

        return {
            success: true,
            ...result
        };

    } catch (error) {
        log('Error saving game: ' + error.message, 'error');

        return {
            success: false,
            reason: 'save_error',
            error: error.message
        };
    }
}

module.exports = {
    // Public API
    generateSlug,
    assembleGameData,
    saveGame,
    getGame,
    getAllGames,
    getLibraryStats,
    processAndSave,
    gameExists,

    // For testing
    _loadGamesIndex: loadGamesIndex,
    _saveGamesIndex: saveGamesIndex
};
