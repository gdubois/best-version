/**
 * Game Research Service
 *
 * Researches game information using Wikipedia API and LLM-powered analysis.
 * Extracts metadata including title, genres, platforms, release dates,
 * developers, publishers, descriptions, and best version recommendations.
 *
 * Core features:
 * - Platform rankings (best version to play today)
 * - Patch/mod recommendations
 * - Emulator suggestions for retro games
 *
 * @module services/game-creator/research
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { createLogger } = require('./logger');
const llmClient = require('./llmClient');
const { researchGameWithAgent: agentResearch } = require('./agent');

/**
 * Research configuration
 */
const RESEARCH_CONFIG = {
    maxSearchResults: 10,
    maxReadUrls: 3,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};

/**
 * Logger instance for research component
 * @private
 */
const logger = createLogger('research', { redactApiKey: true });

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
 * Sleep for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load the LLM prompt template for game research
 * @returns {string}
 */
async function loadLLMPrompt() {
    const promptPath = path.join(__dirname, '../../../prompts/json_prompt.txt');
    try {
        return await fs.readFile(promptPath, 'utf8');
    } catch (error) {
        log(`Failed to load LLM prompt: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Load the game metadata schema
 * @returns {Object}
 */
async function loadGameSchema() {
    const schemaPath = path.join(__dirname, '../../../game_metadata_schema.json');
    try {
        const content = await fs.readFile(schemaPath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        log(`Failed to load game schema: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Search Wikipedia for game information
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchWikipedia(query) {
    try {
        const searchResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=5&search=${encodeURIComponent(query)}`
        );

        if (!searchResponse.ok) {
            return [];
        }

        const searchData = await searchResponse.json();
        const results = [];

        if (Array.isArray(searchData) && searchData.length === 4) {
            const titles = searchData[1] || [];
            const urls = searchData[3] || [];

            const titlesToFetch = titles.slice(0, 3);

            if (titlesToFetch.length > 0) {
                const extractResponse = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&explaintext=&titles=${titlesToFetch.map(t => encodeURIComponent(t)).join('|')}`
                );

                if (extractResponse.ok) {
                    const extractData = await extractResponse.json();
                    const pages = extractData.query?.pages;

                    const extractMap = {};
                    if (pages) {
                        for (const page of Object.values(pages)) {
                            if (page.title && page.extract) {
                                extractMap[page.title] = page.extract;
                            }
                        }
                    }

                    for (let i = 0; i < titles.length; i++) {
                        if (titles[i]) {
                            results.push({
                                title: titles[i],
                                snippet: extractMap[titles[i]] || '',
                                url: urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
                                source: 'wikipedia'
                            });
                        }
                    }
                }
            } else {
                for (let i = 0; i < titles.length; i++) {
                    if (titles[i]) {
                        results.push({
                            title: titles[i],
                            snippet: '',
                            url: urls[i] || `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[i])}`,
                            source: 'wikipedia'
                        });
                    }
                }
            }
        }

        return results;
    } catch (error) {
        log(`Wikipedia search failed: ${error.message}`, 'error');
        return [];
    }
}

/**
 * Search for platform/version information from multiple sources
 * @param {string} gameTitle
 * @returns {Promise<Object>}
 */
async function searchPlatformInfo(gameTitle) {
    const platforms = [];
    const versions = [];
    const sources = [];

    // Search for platform information on Wikipedia
    const platformSearchResults = await searchWikipedia(`${gameTitle} platforms versions`);

    for (const result of platformSearchResults) {
        if (result.snippet) {
            // Extract platform mentions
            const platformKeywords = {
                'playstation': 'PlayStation',
                'ps5': 'PlayStation 5',
                'ps4': 'PlayStation 4',
                'switch': 'Nintendo Switch',
                'xbox': 'Xbox',
                'pc': 'PC',
                'nes': 'NES',
                'sn': 'SNES',
                'n64': 'Nintendo 64',
                'gamecube': 'GameCube',
                'wii': 'Wii',
                'amiga': 'Amiga',
                'atari': 'Atari',
                'dos': 'MS-DOS',
                'c64': 'Commodore 64',
                'apple': 'Apple II'
            };

            const snippetLower = result.snippet.toLowerCase();
            for (const [key, platform] of Object.entries(platformKeywords)) {
                if (snippetLower.includes(key) && !platforms.includes(platform)) {
                    platforms.push(platform);
                }
            }

            if (result.url && !sources.includes(result.url)) {
                sources.push(result.url);
            }
        }
    }

    // Search for remasters/remakes
    const remakeSearchResults = await searchWikipedia(`${gameTitle} remaster remake remake`);
    for (const result of remakeSearchResults) {
        if (result.title && result.title.includes('remaster')) {
            versions.push({
                name: result.title,
                type: 'remaster',
                platform: extractPlatformFromTitle(result.title)
            });
        }
    }

    return {
        platforms,
        versions,
        sources
    };
}

/**
 * Extract platform from a title string
 * @param {string} title
 * @returns {string}
 */
function extractPlatformFromTitle(title) {
    const platformMatches = {
        'ps4': 'PlayStation 4',
        'ps5': 'PlayStation 5',
        'switch': 'Nintendo Switch',
        'xbox': 'Xbox',
        'pc': 'PC',
        'ps1': 'PlayStation',
        'ps2': 'PlayStation 2',
        'ps3': 'PlayStation 3'
    };

    const titleLower = title.toLowerCase();
    for (const [key, platform] of Object.entries(platformMatches)) {
        if (titleLower.includes(key)) {
            return platform;
        }
    }
    return 'Unknown';
}

/**
 * Search for patches and mods information
 * @param {string} gameTitle
 * @returns {Promise<Object>}
 */
async function searchPatchesAndMods(gameTitle) {
    const patches = [];
    const sources = [];

    // Search Wikipedia for patch information with broader queries
    const patchQueries = [
        `${gameTitle} patch mod unofficial`,
        `${gameTitle} uncensored patch`,
        `${gameTitle} translation patch`,
        `${gameTitle} romhack`
    ];

    for (const query of patchQueries) {
        const patchSearchResults = await searchWikipedia(query);

        for (const result of patchSearchResults) {
            if (result.snippet) {
                // Look for patch-related keywords (expanded)
                const patchKeywords = [
                    'patch', 'mod', 'unofficial', 'translation', 'enhancement', 'fix',
                    'uncensored', 'romhack', 'fan translation', 'high resolution',
                    ' widescreen', 'fps unlock', 'quality of life'
                ];
                const hasPatchInfo = patchKeywords.some(keyword => result.snippet.toLowerCase().includes(keyword));

                if (hasPatchInfo) {
                    // Determine patch type from snippet
                    let patchType = 'general';
                    const snippetLower = result.snippet.toLowerCase();
                    if (snippetLower.includes('uncensored') || snippetLower.includes('unrated')) {
                        patchType = 'uncensored';
                    } else if (snippetLower.includes('translation')) {
                        patchType = 'translation';
                    } else if (snippetLower.includes('enhancement') || snippetLower.includes('high res') || snippetLower.includes('widescreen')) {
                        patchType = 'enhancement';
                    } else if (snippetLower.includes('fix') || snippetLower.includes('bug')) {
                        patchType = 'fix';
                    }

                    patches.push({
                        source: result.title,
                        info: result.snippet.substring(0, 300),
                        url: result.url,
                        type: patchType
                    });
                }
            }
        }
    }

    // Add known patch sources with specific URLs
    patches.push({
        source: 'romhacking.net',
        info: `Search for ${gameTitle} patches including uncensored, translation, and enhancement patches`,
        url: `https://www.romhacking.net/search/?term=${encodeURIComponent(gameTitle)}`,
        type: 'aggregator'
    });

    patches.push({
        source: 'PCGamingWiki',
        info: 'Check PCGamingWiki for compatibility fixes, widescreen patches, FPS unlocks, and quality-of-life improvements',
        url: `https://www.pcgamingwiki.com/wiki/Special:Search?search=${encodeURIComponent(gameTitle)}`,
        type: 'aggregator'
    });

    patches.push({
        source: 'Reddit',
        info: 'Community discussions and patch recommendations',
        url: `https://www.reddit.com/search/?q=${encodeURIComponent(gameTitle + ' patch')}`,
        type: 'community'
    });

    return { patches, sources };
}

/**
 * Gather game data from multiple web sources
 * @param {string} gameTitle
 * @returns {Promise<Object>}
 */
async function gatherGameData(gameTitle) {
    log('Gathering game data from web sources', 'info');

    // Search Wikipedia for basic info
    const wikiResults = await searchWikipedia(`${gameTitle} video game`);

    // Extract detailed info
    const wikiData = extractFromSearchResults(gameTitle, wikiResults);

    // Search for platform/version information
    const platformData = await searchPlatformInfo(gameTitle);

    // Search for patches and mods
    const patchData = await searchPatchesAndMods(gameTitle);

    // Collect all sources
    const allSources = [
        ...wikiResults.map(r => r.url).filter(Boolean),
        ...platformData.sources,
        ...patchData.sources
    ];

    return {
        wikipediaData: wikiData,
        platformData,
        patchData,
        sources: [...new Set(allSources)]
    };
}

/**
 * Build the LLM prompt using the template file with all gathered data
 * @param {string} gameTitle
 * @param {Object} gatheredData
 * @param {Object} schema
 * @param {string} promptTemplate - The prompt template loaded from file
 * @returns {string}
 */
async function buildLLMPrompt(gameTitle, gatheredData, schema, promptTemplate = null) {
    // Load prompt template if not provided
    if (!promptTemplate) {
        promptTemplate = await loadLLMPrompt();
    }

    // If template loading failed, use a fallback inline prompt
    if (!promptTemplate) {
        return `
You are a video game research assistant. Your task is to analyze the gathered web data and produce a comprehensive JSON file about a video game, with special focus on identifying the BEST VERSION to play today.

GAME TITLE: ${gameTitle}

=== GATHERED DATA FROM WEB SEARCHES ===

WIKIPEDIA INFORMATION:
${JSON.stringify(gatheredData.wikipediaData, null, 2)}

PLATFORM/VERSION INFORMATION:
${JSON.stringify(gatheredData.platformData, null, 2)}

PATCHES AND MODS INFORMATION:
${JSON.stringify(gatheredData.patchData, null, 2)}

=== YOUR TASK ===

1. Analyze all the gathered data about "${gameTitle}"
2. Identify the BEST VERSION to play today by considering:
   - Graphics quality and resolution
   - Performance (frame rate, load times)
   - Features and extras (remaster improvements, bonus content)
   - Availability and ease of access
   - Modern conveniences (save states, achievements, controls)
3. Rank all versions from BEST to WORST in the play_today field
4. Include specific patch recommendations with source links
5. Include emulator recommendations for retro platforms
6. Output VALID JSON matching the provided schema

SCHEMA TO FOLLOW:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Your response must be valid JSON only. No additional text, no markdown formatting.
`.trim();
    }

    // Replace the placeholder with the actual game title
    let prompt = promptTemplate.replace('{{{GAME_TITLE}}}', gameTitle);

    // Append the gathered data from web searches
    prompt += `

=== GATHERED DATA FROM PRELIMINARY WEB SEARCHES ===

WIKIPEDIA INFORMATION:
${JSON.stringify(gatheredData.wikipediaData, null, 2)}

PLATFORM/VERSION INFORMATION:
${JSON.stringify(gatheredData.platformData, null, 2)}

PATCHES AND MODS INFORMATION:
${JSON.stringify(gatheredData.patchData, null, 2)}

=== ADDITIONAL INSTRUCTIONS ===

Use the gathered data above as a starting point, but you MUST perform additional web searches
using MCP tools to find:
1. Specific patch names with versions and direct download URLs
2. Complete platform list with accurate release dates
3. Best version recommendations from community sources

SCHEMA TO FOLLOW:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Your response must be valid JSON only. No additional text, no markdown formatting.
`.trim();

    return prompt;
}

/**
 * Merge LLM results with gathered data
 * @param {Object} gatheredData
 * @param {Object} llmResult
 * @returns {Object}
 */
function mergeLLMResults(gatheredData, llmResult) {
    const basicInfo = llmResult.basic_info || {};
    const release = llmResult.release || {};
    const description = llmResult.description || {};

    // Preserve full structured platform objects from LLM output
    // LLM outputs: { name, region, release_date } per platform
    const llmPlatforms = release.platforms || [];
    const platforms = llmPlatforms.length > 0 ? llmPlatforms : (gatheredData.platformData?.platforms || []);

    return {
        title: basicInfo.title || gatheredData.wikipediaData?.title,
        alternativeTitles: llmResult.alternativeNames || gatheredData.wikipediaData?.alternativeTitles || [],
        genres: basicInfo.genres || gatheredData.wikipediaData?.genres || [],
        platforms: platforms,
        releaseDate: extractReleaseDate(llmResult, gatheredData.wikipediaData?.releaseDate),
        releaseYear: null, // Will be calculated
        developers: basicInfo.developers || gatheredData.wikipediaData?.developers || [],
        publishers: basicInfo.publishers || gatheredData.wikipediaData?.publishers || [],
        description: description.long_description || gatheredData.wikipediaData?.description,
        synopsis: description.synopsis || gatheredData.wikipediaData?.synopsis,
        features: description.key_features || [],
        playToday: llmResult.play_today || [], // CORE FEATURE!
        reception: llmResult.reception || {
            scores: [],
            reviews: [],
            legacy: null
        },
        confidence: 0.0, // Will be calculated
        sources: gatheredData.sources,
        serie: llmResult.serie || null,
        similarGames: llmResult.similar_games || []
    };
}

/**
 * Extract release date from LLM result
 * @param {Object} llmResult
 * @param {string} fallbackDate
 * @returns {string}
 */
function extractReleaseDate(llmResult, fallbackDate) {
    const platforms = llmResult.release?.platforms || [];
    for (const platform of platforms) {
        if (platform.release_date) {
            return platform.release_date;
        }
    }
    return fallbackDate || null;
}

/**
 * Calculate confidence score based on result quality
 * @param {Object} result
 * @returns {number}
 */
function calculateConfidence(result) {
    let confidence = 0.3;

    if (result.genres?.length > 0) confidence += 0.1;
    if (result.platforms?.length > 0) confidence += 0.1;
    if (result.releaseDate) confidence += 0.1;
    if (result.developers?.length > 0) confidence += 0.05;
    if (result.publishers?.length > 0) confidence += 0.05;
    if (result.description && result.description.length > 100) confidence += 0.1;
    if (result.playToday?.length > 0) confidence += 0.15; // Bonus for play_today
    if (result.sources?.length > 0) confidence += 0.05;

    return Math.min(confidence, 0.95);
}

/**
 * Research a game using LLM-powered analysis with self-hosted LLM
 *
 * Workflow:
 * 1. Gather data from Wikipedia and other web sources
 * 2. Send consolidated data to LLM for analysis
 * 3. LLM identifies best version and generates structured JSON
 * 4. Merge results and calculate confidence
 *
 * @param {string} gameTitle - Game to research
 * @param {Object} options
 * @returns {Promise<Object>} Game data matching the schema
 */
async function researchGameWithLLM(gameTitle, options = {}) {
    log(`Starting LLM-powered research for: ${gameTitle}`, 'info', { title: gameTitle });

    const startTime = Date.now();
    const schema = await loadGameSchema();

    if (!schema) {
        log('Schema not found, falling back to basic research', 'warn');
        const fallback = await researchGame(gameTitle, options);
        fallback.playToday = await generatePlayTodayRecommendations(fallback);
        return fallback;
    }

    try {
        // Step 1: Gather data from web sources
        log('Step 1: Gathering data from web sources', 'info');
        const gatheredData = await gatherGameData(gameTitle);

        if (!gatheredData.wikipediaData) {
            log('Failed to gather game data, falling back to basic research', 'warn');
            const fallback = await researchGame(gameTitle, options);
            fallback.playToday = await generatePlayTodayRecommendations(fallback);
            return fallback;
        }

        // Step 2: Load prompt template and build prompt
        log('Step 2: Loading prompt template and building LLM prompt', 'info');
        const promptTemplate = await loadLLMPrompt();
        const llmPrompt = await buildLLMPrompt(gameTitle, gatheredData, schema, promptTemplate);

        log('Step 3: Sending prompt to LLM for analysis', 'info');
        const llmResult = await llmClient.callLLMWithJSON(llmPrompt, schema);

        if (!llmResult.success) {
            log(`LLM JSON parsing failed: ${llmResult.error}`, 'error');
            // Fallback to basic research
            const fallback = await researchGame(gameTitle, options);
            fallback.playToday = await generatePlayTodayRecommendations(fallback);
            return fallback;
        }

        // Step 3: Merge LLM results with gathered data
        const result = mergeLLMResults(gatheredData, llmResult.data);

        // Step 4: Generate enhanced play_today recommendations
        result.playToday = await generatePlayTodayRecommendations(result);

        // Step 5: Calculate confidence
        result.confidence = calculateConfidence(result);

        // Extract release year
        if (result.releaseDate) {
            const yearMatch = result.releaseDate.match(/^(\d{4})/);
            if (yearMatch) {
                result.releaseYear = parseInt(yearMatch[1], 10);
            }
        }

        result.researchTime = Date.now() - startTime;

        log(`LLM research completed successfully`, 'info', {
            title: gameTitle,
            confidence: result.confidence,
            time: result.researchTime,
            playTodayCount: result.playToday?.length || 0,
            platforms: result.platforms?.length || 0
        });

        return result;

    } catch (error) {
        log(`LLM research failed: ${error.message}`, 'error');

        // Fallback to basic research
        log('Falling back to basic Wikipedia research', 'info');
        const fallback = await researchGame(gameTitle, options);
        fallback.playToday = await generatePlayTodayRecommendations(fallback);
        return fallback;
    }
}

/**
 * Extract game information from search results (keyword-based fallback)
 * @param {string} gameTitle
 * @param {Array} searchResults
 * @returns {Object}
 */
function extractFromSearchResults(gameTitle, searchResults) {
    const extracted = {
        title: gameTitle,
        alternativeTitles: [],
        genres: [],
        platforms: [],
        releaseDate: null,
        developers: [],
        publishers: [],
        description: null,
        synopsis: null,
        features: [],
        reception: {
            scores: [],
            reviews: [],
            legacy: null
        },
        confidence: 0.8,
        sources: []
    };

    if (!searchResults || searchResults.length === 0) {
        extracted.confidence = 0.0;
        return extracted;
    }

    for (const result of searchResults.slice(0, RESEARCH_CONFIG.maxReadUrls)) {
        try {
            if (result.snippet && result.snippet.toLowerCase().includes('may refer to')) {
                continue;
            }

            if (result.title && result.title !== gameTitle) {
                const altTitle = result.title.replace(new RegExp(`\\s*-${gameTitle}-.*$`, 'i'), '').trim();
                if (altTitle && !extracted.alternativeTitles.includes(altTitle)) {
                    extracted.alternativeTitles.push(altTitle);
                }
            }

            if (result.snippet && result.snippet.length > 50) {
                const snippet = result.snippet.toLowerCase();
                const originalSnippet = result.snippet;

                if (!extracted.description && originalSnippet.length > 100) {
                    extracted.description = originalSnippet.substring(0, 500);
                }

                const genreKeywords = [
                    'rpg', 'action', 'adventure', 'strategy', 'puzzle',
                    'simulation', 'sports', 'racing', 'fighting', 'platformer',
                    'shooter', 'horror', 'stealth', 'survival', 'roguelike',
                    'mmorpg', 'turn-based', 'real-time', 'visual novel',
                    'point-and-click', 'interactive fiction', 'logic', 'educational'
                ];
                for (const genre of genreKeywords) {
                    if (snippet.includes(genre)) {
                        const normalizedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
                        if (!extracted.genres.includes(normalizedGenre)) {
                            extracted.genres.push(normalizedGenre);
                        }
                    }
                }

                const platformKeywords = {
                    'playstation': 'PlayStation',
                    'ps5': 'PlayStation 5',
                    'ps4': 'PlayStation 4',
                    'ps3': 'PlayStation 3',
                    'ps2': 'PlayStation 2',
                    'switch': 'Nintendo Switch',
                    'xbox series': 'Xbox Series X/S',
                    'xbox one': 'Xbox One',
                    'xbox 360': 'Xbox 360',
                    'xbox': 'Xbox',
                    'nintendo': 'Nintendo',
                    '3ds': 'Nintendo 3DS',
                    'wii u': 'Wii U',
                    'wii': 'Wii',
                    'gamecube': 'GameCube',
                    'n64': 'Nintendo 64',
                    'nes': 'NES',
                    'super nintendo': 'SNES',
                    'game boy advance': 'Game Boy Advance',
                    'gba': 'Game Boy Advance',
                    'game boy': 'Game Boy',
                    'pc': 'PC',
                    'steam': 'PC',
                    'mac': 'Mac',
                    'linux': 'Linux',
                    'psp': 'PSP',
                    'mobile': 'Mobile',
                    'ios': 'iOS',
                    'android': 'Android',
                    'amiga': 'Amiga',
                    'atari st': 'Atari ST',
                    'atari': 'Atari',
                    'ms-dos': 'MS-DOS',
                    'apple iigs': 'Apple IIGS',
                    'c64': 'Commodore 64',
                    'commodore 64': 'Commodore 64'
                };
                for (const [key, platform] of Object.entries(platformKeywords)) {
                    if (snippet.includes(key)) {
                        if (!extracted.platforms.includes(platform)) {
                            extracted.platforms.push(platform);
                        }
                    }
                }

                const yearPatterns = [
                    /released(?:ed)?\s+(?:in\s+)?(\d{4})/i,
                    /(\d{4})\s+video\s+game/i,
                    /\((\d{4})\)/i
                ];
                for (const pattern of yearPatterns) {
                    const yearMatch = snippet.match(pattern);
                    if (yearMatch && yearMatch[1] && !extracted.releaseDate) {
                        const year = yearMatch[1];
                        if (year >= 1970 && year <= 2030) {
                            extracted.releaseDate = `${year}-01-01`;
                            break;
                        }
                    }
                }

                const devPatterns = [
                    /developed by\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+and|\s+for|\s+published|\s+game|\s+in|\s+\.)/i
                ];
                for (const pattern of devPatterns) {
                    const match = snippet.match(pattern);
                    if (match) {
                        const companyName = match[1].trim();
                        if (!extracted.developers.includes(companyName)) {
                            extracted.developers.push(companyName);
                        }
                        break;
                    }
                }

                const pubPatterns = [
                    /published by\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+for|\s+in|\s+\.)/i
                ];
                for (const pattern of pubPatterns) {
                    const match = snippet.match(pattern);
                    if (match) {
                        const companyName = match[1].trim();
                        if (!extracted.publishers.includes(companyName)) {
                            extracted.publishers.push(companyName);
                        }
                        break;
                    }
                }
            }

            if (result.url) {
                extracted.sources.push(result.url);
            }

        } catch (error) {
            log(`Error processing search result: ${error.message}`, 'warn', { url: result.url });
        }
    }

    if (!extracted.description && searchResults[0]?.snippet?.length > 200) {
        extracted.description = searchResults[0].snippet.substring(0, 500);
    }

    let confidence = 0.3;
    if (extracted.genres.length > 0) confidence += 0.15;
    if (extracted.platforms.length > 0) confidence += 0.15;
    if (extracted.releaseDate) confidence += 0.15;
    if (extracted.developers.length > 0) confidence += 0.1;
    if (extracted.publishers.length > 0) confidence += 0.1;
    if (extracted.description && extracted.description.length > 100) confidence += 0.1;

    extracted.confidence = Math.min(confidence, 0.95);

    return extracted;
}

/**
 * Generate "play today" recommendations based on research results
 *
 * This is the CORE FEATURE - ranks platforms by quality of experience
 *
 * @param {Object} researchResult - Results from research
 * @returns {Promise<Array>} Ranked list of versions to play today
 */
async function generatePlayTodayRecommendations(researchResult) {
    const recommendations = [];

    const platforms = researchResult.platforms || [];
    const releaseDate = researchResult.releaseDate || '';
    const releaseYear = releaseDate ? parseInt(releaseDate.match(/^(\d{4})/)?.[1] || '2000', 10) : 2000;

    const isRetroGame = releaseYear < 2005;

    // Platform priority for "best version" determination
    const platformPriority = {
        'PC': 100,
        'Microsoft Windows': 100,
        'PlayStation 5': 95,
        'Xbox Series X/S': 95,
        'Nintendo Switch': 90,
        'PlayStation 4': 85,
        'Xbox One': 85,
        'PlayStation 3': 70,
        'Xbox 360': 70,
        'Wii U': 65,
        'Nintendo 3DS': 60,
        'Wii': 55,
        'GameCube': 50,
        'Nintendo 64': 45,
        'PlayStation 2': 40,
        'SNES': 35,
        'Super Nintendo Entertainment System (SNES)': 35,
        'NES': 30,
        'Nintendo Entertainment System (NES)': 30,
        'Game Boy Advance': 25,
        'PlayStation': 25,
        'Game Boy': 20,
        'MS-DOS': 18,
        'Amiga': 18,
        'Atari ST': 16,
        'Commodore 64': 10,
        'Atari': 10,
        'Apple IIGS': 8,
        'iOS': 80,
        'Android': 80,
        'Mobile': 75,
        'Mac': 85,
        'Macintosh': 85,
        'macOS': 85,
        'Linux': 85,
        'PSP': 55,
        'PlayStation Vita': 60
    };

    // Rank platforms by priority
    const rankedPlatforms = platforms
        .map(platform => ({
            platform,
            priority: platformPriority[platform] || 50
        }))
        .sort((a, b) => b.priority - a.priority);

    // Generate recommendations for top platforms
    for (const { platform, priority } of rankedPlatforms.slice(0, 5)) {
        // Extract platform name for structured objects
        let platformName;
        if (typeof platform === 'string') {
            platformName = platform;
        } else if (platform && typeof platform === 'object') {
            platformName = platform.name || 'Unknown';
        } else {
            platformName = 'Unknown';
        }

        const recommendation = {
            platform: platformName,
            details: getPlatformDetails(platform, researchResult, isRetroGame),
            available_in_english: true,
            recommended_patches: getRecommendedPatches(platformName, researchResult, isRetroGame),
            emulators: isRetroGame ? getEmulatorRecommendations(platformName) : []
        };

        recommendations.push(recommendation);
    }

    // Fallback if no platforms found
    if (recommendations.length === 0) {
        recommendations.push({
            platform: 'Original Platform',
            details: 'Play on the original release platform for authentic experience',
            available_in_english: true,
            recommended_patches: [],
            emulators: isRetroGame ? ['Search for emulators supporting the original platform'] : []
        });
    }

    return recommendations;
}

/**
 * Get platform-specific details for a recommendation
 * @param {string|Object} platform - Platform name string or structured object { name, region, release_date }
 * @param {Object} researchResult
 * @param {boolean} isRetroGame
 * @returns {string}
 */
function getPlatformDetails(platform, researchResult, isRetroGame) {
    // Extract platform name if it's a structured object
    let platformName;
    if (typeof platform === 'string') {
        platformName = platform;
    } else if (platform && typeof platform === 'object') {
        platformName = platform.name || 'Unknown';
    } else {
        platformName = 'Unknown';
    }

    const genres = researchResult.genres || [];
    const isAdventure = genres.includes('Adventure');
    const isRPG = genres.includes('Rpg') || genres.includes('RPG');

    const details = {
        'PC': isRetroGame
            ? 'Best modern experience via DOSBox/emulator with high-resolution patches, save states, and keyboard/mouse support. Check PCGamingWiki for specific recommendations.'
            : 'Best modern experience with patches, mods, and quality-of-life improvements. Often has the most features and best performance.',
        'Microsoft Windows': isRetroGame
            ? 'Best modern experience via DOSBox/emulator with high-resolution patches, save states, and keyboard/mouse support. Check PCGamingWiki for specific recommendations.'
            : 'Best modern experience with patches, mods, and quality-of-life improvements. Often has the most features and best performance.',
        'PlayStation 5': 'Modern remaster with 4K support, fast loading, and modern controls.',
        'Xbox Series X/S': 'Modern remaster with backward compatibility and Game Pass access.',
        'Nintendo Switch': 'Portable option with modern conveniences. Good for playing on the go.',
        'PlayStation 4': 'Widely available remaster with good performance and features.',
        'Xbox One': 'Good backward compatibility and Game Pass access.',
        'Nintendo Entertainment System (NES)': 'Original authentic experience. Best played via emulator (Mesen) or NES Classic for convenience.',
        'NES': 'Original authentic experience. Best played via emulator (Mesen) or NES Classic for convenience.',
        'Super Nintendo Entertainment System (SNES)': 'Original authentic experience with enhanced graphics/sound. Consider SNES Classic or emulator.',
        'SNES': 'Original authentic experience with enhanced graphics/sound. Consider SNES Classic or emulator.',
        'Nintendo 64': 'Original authentic experience. Dolphin emulator offers modern enhancements.',
        'PlayStation': 'Original experience, best via DuckStation emulator or PS Classic.',
        'PlayStation 2': 'Original experience with excellent PCSX2 emulator support.',
        'GameCube': 'Original authentic experience. Dolphin emulator provides modern enhancements.',
        'Wii': 'Original experience via Dolphin emulator with modern features.',
        'MS-DOS': 'Original PC experience. Use DOSBox Staging for modern OS compatibility with high-res patches.',
        'Amiga': 'Original experience via WinUAE or FS-UAE emulator. Best graphics/sound balance for many classics.',
        'Atari ST': 'Original experience via Steem or Hatari emulator.',
        'Commodore 64': 'Original experience via VICE emulator suite.',
        'Apple IIGS': 'Original experience via openApple or other Apple II emulators.',
        'macOS': 'Original Mac experience with modern OS compatibility. Best preservation of original design.',
        'Mac': 'Original Mac experience with modern OS compatibility. Best preservation of original design.',
        'Macintosh': 'Original Mac experience with modern OS compatibility. Best preservation of original design.'
    };

    // Genre-specific recommendations
    if (isAdventure && isRetroGame && platformName === 'PC') {
        return 'Best platform for adventure games with modern patches, remastered assets, and quality-of-life improvements. Check PCGamingWiki for specific recommendations.';
    }

    if (isAdventure && isRetroGame && platformName === 'Microsoft Windows') {
        return 'Best platform for adventure games with modern patches, remastered assets, and quality-of-life improvements. Check PCGamingWiki for specific recommendations.';
    }

    if (isRPG && platformName === 'PC') {
        return 'Best platform for RPGs with mods, translations, and quality-of-life patches. Often includes unofficial enhancements.';
    }

    if (isRPG && platformName === 'Microsoft Windows') {
        return 'Best platform for RPGs with mods, translations, and quality-of-life patches. Often includes unofficial enhancements.';
    }

    return details[platformName] || `Play on ${platformName} for an authentic or modernized experience`;
}

/**
 * Get recommended patches for a platform
 * @param {string} platform
 * @param {Object} researchResult
 * @param {boolean} isRetroGame
 * @returns {Array<Object>} Array of patch objects with name and description
 */
function getRecommendedPatches(platform, researchResult, isRetroGame) {
    const patches = [];

    // Extract platform name for comparison
    let platformName;
    if (typeof platform === 'string') {
        platformName = platform;
    } else if (platform && typeof platform === 'object') {
        platformName = platform.name || 'Unknown';
    } else {
        platformName = 'Unknown';
    }

    // Priority: Uncensored patches first, then positive-feedback patches
    // This is especially important for retro games

    // Check for uncensored patches (highest priority)
    if (isRetroGame) {
        // Common uncensored patch patterns for retro games
        const uncensoredPatchKeywords = [
            'uncensored', 'unrated', 'japan uncensored', 'full version',
            'international', 'director cut', 'complete'
        ];

        // Search through any patches found in research
        const gameTitle = researchResult.title || '';

        // Add uncensored patch recommendation for retro games (especially NES/SNES)
        if ((platformName.includes('NES') || platformName.includes('SNES') ||
             platformName.includes('Nintendo') || platformName.includes('MS-DOS')) &&
            isRetroGame) {
            // Check if this is a game that likely has uncensored versions
            // Many adventure games had censorship in Western releases
            const genres = researchResult.genres || [];
            const isAdventure = genres.includes('Adventure') || genres.includes('Point-and-click');

            if (isAdventure || true) { // Always include for retro games
                patches.push({
                    name: 'Uncensored Patch',
                    description: 'Removes Western censorship. Check romhacking.net for specific uncensored versions of this game.',
                    type: 'uncensored',
                    url: `https://www.romhacking.net/search/?term=${encodeURIComponent(gameTitle + ' uncensored')}`,
                    feedback: 'positive'
                });
            }
        }
    }

    // Add translation patches for retro games
    if (isRetroGame && (platformName.includes('NES') || platformName.includes('SNES'))) {
        patches.push({
            name: 'Fan Translation Patch',
            description: 'English translation for Japanese-only releases. Check for community-translated versions.',
            type: 'translation',
            url: `https://www.romhacking.net/search/?term=${encodeURIComponent(gameTitle + ' translation')}`,
            feedback: 'positive'
        });
    }

    // Add enhancement patches for PC games
    if (platformName.includes('PC') || platformName.includes('Windows')) {
        const gameTitle = researchResult.title || '';

        // High-res patches for retro games
        if (isRetroGame) {
            patches.push({
                name: 'High Resolution Patch',
                description: 'Enables modern resolutions and widescreen support for retro games.',
                type: 'enhancement',
                url: `https://www.pcgamingwiki.com/wiki/Special:Search?search=${encodeURIComponent(gameTitle)}`,
                feedback: 'positive'
            });
        }

        // FPS unlock patches
        patches.push({
            name: 'FPS Unlock / Performance Patches',
            description: 'Removes frame rate limits and improves performance on modern systems.',
            type: 'enhancement',
            url: `https://www.pcgamingwiki.com/wiki/Special:Search?search=${encodeURIComponent(gameTitle)}`,
            feedback: 'positive'
        });
    }

    // Quality of life patches
    if (isRetroGame) {
        patches.push({
            name: 'Quality of Life Patches',
            description: 'Save states, quick loading, and other modern conveniences via emulator or patch.',
            type: 'enhancement',
            url: '',
            feedback: 'positive'
        });
    }

    return patches;
}

/**
 * Get emulator recommendations for a platform
 * @param {string} platform
 * @returns {Array<Object>} Array of emulator objects
 */
function getEmulatorRecommendations(platform) {
    // Valid platform enum values per schema: Windows, Android, Linux, macOS
    const emulators = {
        'NES': [
            { name: 'Mesen', desc: 'most accurate NES emulator', platforms: ['Windows', 'macOS', 'Linux'] },
            { name: 'Nestopia', desc: 'highly compatible', platforms: ['Windows', 'macOS', 'Linux'] },
            { name: 'FCEUmm', desc: 'cross-platform with save states', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'SNES': [
            { name: 'Snes9x', desc: 'compatible and widely used', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'bsnes', desc: 'accurate cycles emulation', platforms: ['Windows', 'macOS', 'Linux'] },
            { name: 'Higan', desc: 'feature-rich multi-system', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Nintendo 64': [
            { name: 'Project64', desc: 'Windows N64 emulator', platforms: ['Windows'] },
            { name: 'Mupen64Plus', desc: 'cross-platform solution', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'PlayStation': [
            { name: 'DuckStation', desc: 'modern PS1 emulator', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'ePSXe', desc: 'legacy emulator', platforms: ['Windows'] },
            { name: 'PCSX-ReARMed', desc: 'accurate emulation', platforms: ['Windows', 'Linux'] }
        ],
        'PlayStation 2': [
            { name: 'PCSX2', desc: 'best PS2 emulator', platforms: ['Windows', 'macOS', 'Linux'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'GameCube': [
            { name: 'Dolphin', desc: 'excellent compatibility', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Wii': [
            { name: 'Dolphin', desc: 'also supports GameCube', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Game Boy': [
            { name: 'EmuGBA', desc: 'multi-system emulator', platforms: ['Windows', 'Linux'] },
            { name: 'VisualBoyAdvance', desc: 'classic GBA emulator', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Game Boy Advance': [
            { name: 'mGBA', desc: 'accurate GBA emulation', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'VisualBoyAdvance', desc: 'widely compatible', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'MS-DOS': [
            { name: 'DOSBox Staging', desc: 'modern DOSBox with enhancements', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'DOSBox', desc: 'classic DOS emulator', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Amiga': [
            { name: 'WinUAE', desc: 'Windows Amiga emulator', platforms: ['Windows'] },
            { name: 'FS-UAE', desc: 'cross-platform frontend', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Atari ST': [
            { name: 'Steem', desc: 'Windows/macOS Atari ST emulator', platforms: ['Windows', 'macOS'] },
            { name: 'Hatari', desc: 'cross-platform ST/Falcon', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Commodore 64': [
            { name: 'VICE', desc: 'suite of C64 emulators', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Atari': [
            { name: 'JzIntella', desc: 'Atari Jaguar emulator', platforms: ['Windows'] },
            { name: 'Hatari', desc: 'ST/Falcon emulator', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'RetroArch', desc: 'libretro cores support', platforms: ['Windows', 'Android', 'Linux', 'macOS'] }
        ],
        'Apple IIGS': [
            { name: 'openApple', desc: 'Apple IIGS emulator', platforms: ['Windows', 'Android', 'Linux', 'macOS'] },
            { name: 'AppleWin', desc: 'Apple II emulator', platforms: ['Windows'] }
        ]
    };

    // Extract platform name for lookup (handle both string and object formats)
    let platformNameForLookup;
    if (typeof platform === 'string') {
        platformNameForLookup = platform;
    } else if (platform && typeof platform === 'object') {
        platformNameForLookup = platform.name || 'Unknown';
    } else {
        platformNameForLookup = 'Unknown';
    }

    const platformEmulators = emulators[platformNameForLookup];
    if (!platformEmulators) {
        return [
            {
                platform: 'Windows',
                recommended_emulator: `Generic emulator - search for emulators supporting ${platformNameForLookup}`,
                optimal_settings: ['Default settings']
            }
        ];
    }

    // Expand to multiple entries, one per platform
    const result = [];
    for (const emu of platformEmulators) {
        for (const plat of emu.platforms) {
            result.push({
                platform: plat,
                recommended_emulator: `${emu.name} - ${emu.desc}`,
                optimal_settings: ['Default settings']
            });
        }
    }
    return result;
}

/**
 * Search for game information using Wikipedia API
 * @param {string} query
 * @param {Object} options
 * @returns {Promise<Array>}
 */
async function searchWeb(query, options = {}) {
    const searchQueries = [
        `${query} video game`,
        `${query} game`,
        query
    ];

    let wikiResults = [];
    let bestResults = [];

    for (const searchQuery of searchQueries) {
        try {
            wikiResults = await searchWikipedia(searchQuery);
            log(`Searched "${searchQuery}": ${wikiResults.length} results`, 'info');

            const hasGamePage = wikiResults.some(r =>
                r.title.toLowerCase().includes('video game') ||
                (r.snippet && r.snippet.toLowerCase().includes('game') && r.snippet.toLowerCase().includes('developed'))
            );

            if (hasGamePage) {
                log(`Found video game page: ${wikiResults[0]?.title}`, 'info');
                return wikiResults;
            }

            if (wikiResults.length > bestResults.length) {
                bestResults = wikiResults;
            }

            if (wikiResults.length > 0) {
                continue;
            }
        } catch (err) {
            log(`Search "${searchQuery}" failed: ${err.message}`, 'warn');
        }
    }

    log(`Wikipedia returned ${bestResults.length} results`, 'info', { query });
    return bestResults;
}

/**
 * Research a game using web search (Wikipedia-based fallback)
 * @param {string} gameTitle
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function researchGame(gameTitle, options = {}) {
    log(`Starting research for game: ${gameTitle}`, 'info', { title: gameTitle });

    const startTime = Date.now();
    const result = {
        title: gameTitle,
        alternativeTitles: [],
        genres: [],
        platforms: [],
        releaseDate: null,
        releaseYear: null,
        developers: [],
        publishers: [],
        description: null,
        synopsis: null,
        features: [],
        reception: {
            scores: [],
            reviews: [],
            legacy: null
        },
        confidence: 0.0,
        sources: [],
        researchTime: 0,
        error: null
    };

    try {
        const searches = [
            {
                query: `${gameTitle} video game`,
                purpose: 'overview'
            }
        ];

        const searchResults = [];

        for (const search of searches) {
            let lastError;

            for (let attempt = 1; attempt <= RESEARCH_CONFIG.retryAttempts; attempt++) {
                try {
                    log(`Searching for ${search.purpose} (attempt ${attempt})`, 'info', {
                        query: search.query
                    });

                    const results = await searchWeb(search.query, {
                        num: RESEARCH_CONFIG.maxSearchResults
                    });

                    searchResults.push({
                        purpose: search.purpose,
                        results: results
                    });

                    break;

                } catch (error) {
                    lastError = error;

                    if (attempt < RESEARCH_CONFIG.retryAttempts) {
                        const delay = RESEARCH_CONFIG.retryDelay * Math.pow(2, attempt - 1);
                        log(`Search failed, retrying in ${delay}ms`, 'warn', {
                            purpose: search.purpose,
                            error: error.message,
                            delay
                        });
                        await sleep(delay);
                    }
                }
            }

            if (lastError) {
                log(`Search failed after ${RESEARCH_CONFIG.retryAttempts} attempts`, 'error', {
                    purpose: search.purpose,
                    error: lastError.message
                });
            }
        }

        const allResults = searchResults.flatMap(s => s.results);
        const extracted = extractFromSearchResults(gameTitle, allResults);

        result.alternativeTitles = extracted.alternativeTitles;
        result.genres = extracted.genres;
        result.platforms = extracted.platforms;
        result.releaseDate = extracted.releaseDate;
        result.developers = extracted.developers;
        result.publishers = extracted.publishers || extracted.developers;
        result.confidence = extracted.confidence;
        result.sources = extracted.sources;

        if (result.releaseDate) {
            const yearMatch = result.releaseDate.match(/^(\d{4})/);
            if (yearMatch) {
                result.releaseYear = parseInt(yearMatch[1], 10);
            }
        }

        result.researchTime = Date.now() - startTime;

        log(`Research completed`, 'info', {
            title: gameTitle,
            confidence: result.confidence,
            time: result.researchTime,
            genres: result.genres.length,
            platforms: result.platforms.length
        });

    } catch (error) {
        result.error = error.message;
        result.researchTime = Date.now() - startTime;

        log(`Research failed: ${error.message}`, 'error', {
            title: gameTitle,
            time: result.researchTime
        });
    }

    return result;
}

/**
 * Verify if a game exists via web search
 * @param {string} gameTitle
 * @returns {Promise<{exists: boolean, confidence: number}>}
 */
async function verifyGameExists(gameTitle) {
    log(`Verifying game exists: ${gameTitle}`, 'info');

    try {
        const query = `"${gameTitle}" video game`;
        const results = await searchWeb(query, { num: 5 });

        const hasRelevantResults = results.length > 0;
        const confidence = hasRelevantResults ? Math.min(0.5 + (results.length * 0.1), 0.9) : 0.0;

        return {
            exists: hasRelevantResults,
            confidence
        };

    } catch (error) {
        log(`Verification failed: ${error.message}`, 'error');
        return {
            exists: false,
            confidence: 0.0
        };
    }
}

/**
 * Get search statistics
 * @returns {Object}
 */
function getStats() {
    return {
        config: RESEARCH_CONFIG,
        llmConfig: llmClient.getConfig()
    };
}

/**
 * Research a game using the agent-based approach with web search
 * @param {string} gameTitle - Game to research
 * @returns {Promise<Object>} Game data with metadata
 */
async function researchGameWithAgent(gameTitle) {
    log(`Starting agent-based research for: ${gameTitle}`, 'info', { title: gameTitle });

    const startTime = Date.now();

    try {
        // Use the agent service to research the game
        const agentResult = await agentResearch(gameTitle);

        if (!agentResult.success) {
            log(`Agent research failed: ${agentResult.error}`, 'error');
            // Fall back to LLM-based research
            log('Falling back to LLM-based research', 'info');
            return await researchGameWithLLM(gameTitle);
        }

        const metadata = agentResult.metadata;

        if (!metadata) {
            log('Agent returned no metadata, falling back to LLM-based research', 'warn');
            return await researchGameWithLLM(gameTitle);
        }

        // The agent now returns complete game data following game_metadata_schema.json format
        // We need to map it to the internal format used by the processor
        let result = {
            title: metadata.title || gameTitle,
            alternativeTitles: metadata.alternativeTitles || metadata.alternateTitles || [],
            genres: metadata.genres || [],
            platforms: metadata.platforms || [],
            releaseDate: metadata.releaseDate || null,
            releaseYear: null,
            developers: metadata.developers || metadata.developer ? Array.isArray(metadata.developers || metadata.developer) ? (metadata.developers || metadata.developer) : [metadata.developers || metadata.developer] : [],
            publishers: metadata.publishers || metadata.publisher ? Array.isArray(metadata.publishers || metadata.publisher) ? (metadata.publishers || metadata.publisher) : [metadata.publishers || metadata.publisher] : [],
            description: metadata.description || '',
            synopsis: metadata.synopsis || '',
            features: metadata.features || [],
            reception: metadata.reception || { scores: [], reviews: [], legacy: null },
            playToday: metadata.play_today || metadata.playToday || [],
            confidence: metadata.confidence || agentResult.confidence || 0.7,
            sources: metadata.sources || metadata.sourceUrls || agentResult.sourceUrls || [],
            serie: metadata.serie || metadata.series || null,
            similarGames: metadata.similarGames || [],
            researchTime: Date.now() - startTime
        };

        // Extract release year from releaseDate
        if (result.releaseDate) {
            const yearMatch = result.releaseDate.match(/^(\d{4})/);
            if (yearMatch) {
                result.releaseYear = parseInt(yearMatch[1], 10);
            }
        }

        // If playToday is empty, generate recommendations
        if (!result.playToday || result.playToday.length === 0) {
            log('Generating play_today recommendations', 'info');
            result.playToday = await generatePlayTodayRecommendations(result);
        }

        log(`Agent research completed successfully`, 'info', {
            title: gameTitle,
            confidence: result.confidence,
            time: result.researchTime,
            playTodayCount: result.playToday.length
        });

        return result;

    } catch (error) {
        log(`Agent research failed: ${error.message}`, 'error');
        // Fall back to LLM-based research
        log('Falling back to LLM-based research', 'info');
        return await researchGameWithLLM(gameTitle);
    }
}

module.exports = {
    researchGame,
    researchGameWithLLM,
    researchGameWithAgent,
    verifyGameExists,
    searchWeb,
    searchWikipedia,
    searchPlatformInfo,
    searchPatchesAndMods,
    extractFromSearchResults,
    extractPlatformFromTitle,
    loadLLMPrompt,
    loadGameSchema,
    generatePlayTodayRecommendations,
    gatherGameData,
    buildLLMPrompt,
    mergeLLMResults,
    extractReleaseDate,
    calculateConfidence,
    getPlatformDetails,
    getRecommendedPatches,
    getEmulatorRecommendations,
    sleep,
    getStats,
    RESEARCH_CONFIG
};
