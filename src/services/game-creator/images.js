/**
 * Image Storage Service
 *
 * Handles downloading, processing, and storing game cover images.
 * Integrates with Wikipedia service and manages local image cache.
 *
 * @module services/game-creator/images
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('./logger');
const llmClient = require('./llmClient');

// Use public/images for direct serving by the web service
const IMAGES_PATH = path.join(__dirname, '../../../public/images');

// Try to load sharp for image processing
let sharp = null;
try {
    sharp = require('sharp');
} catch (error) {
    // sharp is optional - we'll store images as-is if not available
}

/**
 * Logger instance for images component
 * @private
 */
const logger = createLogger('images', { redactApiKey: true });

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
 * Ensure images directory exists
 * @private
 */
async function ensureImagesDir() {
    try {
        await fs.access(IMAGES_PATH);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(IMAGES_PATH, { recursive: true });
            log('Created images directory', 'info', { path: IMAGES_PATH });
        }
    }
}

/**
 * Get the path for a game's image
 * @param {string} slug - Game slug
 * @returns {string}
 */
function getImagePath(slug) {
    const slugId = slug.split('/').pop();
    return path.join(IMAGES_PATH, `${slugId}.jpg`);
}

/**
 * Check if an image exists for a game
 * @param {string} slug - Game slug
 * @returns {Promise<boolean>}
 */
async function imageExists(slug) {
    const imagePath = getImagePath(slug);
    try {
        await fs.access(imagePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

/**
 * Process and resize an image using sharp
 * @param {Buffer} imageBuffer - Raw image data
 * @param {number} maxWidth - Maximum width
 * @returns {Promise<Buffer>}
 */
async function processImage(imageBuffer, maxWidth = 600) {
    if (!sharp) {
        log('sharp not available, returning original image', 'warn');
        return imageBuffer;
    }

    try {
        const processed = await sharp(imageBuffer)
            .resize({ width: maxWidth, fit: 'inside' })
            .jpeg({ quality: 85 })
            .toBuffer();

        return processed;

    } catch (error) {
        log(`Image processing failed: ${error.message}`, 'error');
        return imageBuffer;
    }
}

/**
 * Download and store a game cover image
 * @param {string} slug - Game slug
 * @param {string} imageUrl - URL to download from
 * @returns {Promise<Object>}
 */
async function storeGameImage(slug, imageUrl) {
    await ensureImagesDir();

    const imagePath = getImagePath(slug);

    // Check if image already exists
    if (await imageExists(slug)) {
        log('Image already exists, skipping download', 'info', { slug });
        return {
            success: true,
            path: imagePath,
            skipped: true
        };
    }

    // Skip SVG images - they're usually logos, not cover art
    if (imageUrl.includes('.svg')) {
        log('Skipping SVG image - not suitable for cover art', 'warn', { imageUrl });
        return {
            success: false,
            error: 'SVG images not supported for cover art'
        };
    }

    log(`Downloading cover image for: ${slug}`, 'info', { imageUrl });

    try {
        const axios = require('axios');

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5
        });

        // Process the image (resize, convert to JPEG)
        const processedBuffer = await processImage(Buffer.from(response.data), 600);

        // Write to disk
        await fs.writeFile(imagePath, processedBuffer);

        log(`Image stored successfully`, 'info', {
            path: imagePath,
            size: processedBuffer.length
        });

        return {
            success: true,
            path: imagePath,
            size: processedBuffer.length,
            url: `/images/${slug.split('/').pop()}.jpg`
        };

    } catch (error) {
        log(`Failed to store image: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Find the best cover image using LLM-powered web search
 * @param {string} gameTitle - Game title
 * @returns {Promise<Object>} Image info or { found: false }
 */
async function findCoverImageWithLLM(gameTitle) {
    log('Starting LLM-powered image search', 'info', { gameTitle });

    try {
        // Load the image search prompt
        const promptPath = path.join(__dirname, '../../../prompts/image_search.txt');
        let promptTemplate;
        try {
            promptTemplate = await fs.readFile(promptPath, 'utf8');
        } catch (error) {
            log('Failed to load image_search.txt prompt', 'warn', { error: error.message });
            return { found: false, reason: 'prompt_not_found' };
        }

        // Replace placeholder with game title
        let prompt = promptTemplate.replace('${GAME_TITLE}', gameTitle);

        // Try to use MCP web search tool if available
        const mcpClientPath = './mcp-client';
        let mcpClient;
        try {
            mcpClient = require(mcpClientPath);
        } catch (error) {
            log('MCP client not available, will use LLM directly', 'debug');
        }

        // Perform web searches using MCP if available
        let searchResults = '';
        if (mcpClient && typeof mcpClient.executeTool === 'function') {
            try {
                const searchPrompts = [
                    `${gameTitle} cover art official`,
                    `${gameTitle} box art wiki`,
                    `${gameTitle} Wikipedia infobox image`
                ];

                const results = [];
                for (const searchPrompt of searchPrompts) {
                    const toolResult = await mcpClient.executeTool('search-web', {
                        query: searchPrompt,
                        num: 10
                    });
                    if (toolResult && toolResult.results) {
                        results.push(...toolResult.results);
                    }
                }

                // Format results for LLM
                searchResults = results.slice(0, 15).map((r, i) =>
                    `${i + 1}. ${r.title || 'No title'}\n   URL: ${r.url || ''}\n   Snippet: ${(r.snippet || '').substring(0, 200)}`
                ).join('\n\n');

                log('MCP search completed', 'info', { resultsCount: results.length });
            } catch (error) {
                log('MCP search failed, continuing without it', 'warn', { error: error.message });
            }
        }

        // Append search results to prompt
        if (searchResults) {
            prompt += `\n\n=== SEARCH RESULTS ===\n${searchResults}\n\nBased on the search results above, select the best cover image.`;
        }

        // Call LLM to analyze and select best image
        const llmResponse = await llmClient.callLLMWithJSON(prompt, {
            type: 'object',
            properties: {
                imageUrl: { type: 'string', description: 'Direct URL to the image' },
                source: { type: 'string', description: 'Source website name' },
                reason: { type: 'string', description: 'Why this is the best image' }
            },
            required: ['imageUrl', 'source', 'reason']
        });

        if (llmResponse.success && llmResponse.data) {
            const data = llmResponse.data;

            // Validate the image URL
            if (!data.imageUrl || !data.imageUrl.match(/^https?:\/\/.*\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
                log('LLM returned invalid image URL', 'warn', { url: data.imageUrl });
                return { found: false, reason: 'invalid_image_url' };
            }

            log('LLM selected cover image', 'info', {
                url: data.imageUrl,
                source: data.source,
                reason: data.reason
            });

            return {
                found: true,
                imageUrl: data.imageUrl,
                source: data.source || 'LLM-selected',
                reason: data.reason
            };
        }

        log('LLM image selection failed', 'warn', { error: llmResponse.error });
        return { found: false, reason: 'llm_selection_failed' };

    } catch (error) {
        log('LLM-powered image search failed: ' + error.message, 'error');
        return { found: false, reason: error.message };
    }
}

/**
 * Search for game cover art using DuckDuckGo image search
 * @param {string} gameTitle - Game title
 * @returns {Promise<Object>} Image info or { found: false }
 */
async function searchDuckDuckGoImages(gameTitle) {
    const duckduckgoService = require('./duckduckgo');

    if (!duckduckgoService.isEnabled()) {
        log('DuckDuckGo search is disabled', 'debug');
        return { found: false, reason: 'disabled' };
    }

    log('Searching DuckDuckGo for cover art', 'info', { gameTitle });

    try {
        // Search for cover art with specific terms
        const searchQueries = [
            `${gameTitle} cover art`,
            `${gameTitle} box art`,
            `${gameTitle} game cover`,
            `${gameTitle} video game cover`
        ];

        for (const query of searchQueries) {
            const result = await duckduckgoService.search(query);

            for (const r of result.results || []) {
                // Look for image-hosting domains or known game art sites
                const favorableDomains = [
                    'vignette.wikimedia.org',
                    'upload.wikimedia.org',
                    'img.ign.com',
                    'cdn.akamai.steamstatic.com',
                    'media.rawg.io',
                    'artworks.thegamer.com',
                    'static.wikia.nocookie.net',
                    'images.fanbox.cc'
                ];

                const url = r.url || '';

                // Check if URL looks like it could lead to an image
                const hasFavorableDomain = favorableDomains.some(domain => url.includes(domain));
                const looksLikeImagePage = url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) ||
                    url.includes('/image/') ||
                    url.includes('/images/') ||
                    url.includes('upload.wikimedia') ||
                    hasFavorableDomain;

                if (looksLikeImagePage) {
                    log('Found potential image source via DuckDuckGo', 'info', { url });

                    // If it's a direct image URL, use it
                    if (url.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
                        return {
                            found: true,
                            imageUrl: url,
                            source: 'duckduckgo'
                        };
                    }

                    // For Wikimedia URLs, try to extract the actual image
                    if (url.includes('wikimedia.org')) {
                        // Wikimedia URLs are usually direct images
                        return {
                            found: true,
                            imageUrl: url,
                            source: 'duckduckgo'
                        };
                    }
                }
            }
        }

        log('No suitable image found via DuckDuckGo', 'debug', { gameTitle });
        return { found: false, reason: 'no_suitable_image' };

    } catch (error) {
        log('DuckDuckGo image search failed: ' + error.message, 'error');
        return { found: false, reason: error.message };
    }
}

/**
 * Fetch and store a game's cover image
 * Primary source: LLM-powered image search with MCP web tools
 * Fallback 1: MobyGames (via Wikipedia)
 * Fallback 2: Wikipedia direct search
 * Final fallback: DuckDuckGo image search
 * @param {string} gameTitle - Game title
 * @param {string} slug - Game slug
 * @returns {Promise<Object>}
 */
async function fetchAndStoreCover(gameTitle, slug) {
    log(`Fetching cover for: ${gameTitle}`, 'info', { slug });

    // PRIMARY: Try LLM-powered image search first
    let coverInfo = await findCoverImageWithLLM(gameTitle);

    if (coverInfo.found && coverInfo.imageUrl) {
        log('LLM-powered search found cover image', 'info', {
            gameTitle,
            source: coverInfo.source
        });
    }

    // FALLBACK 1: Try MobyGames (via Wikipedia)
    if (!coverInfo.found || !coverInfo.imageUrl) {
        log('LLM search did not find image, trying MobyGames', 'debug', { gameTitle });
        const mobygamesService = require('./mobygames');
        coverInfo = await mobygamesService.findGameCover(gameTitle, 600);

        if (coverInfo.found && coverInfo.imageUrl) {
            log('Found image via MobyGames fallback', 'info', { gameTitle });
        }
    }

    // FALLBACK 2: Wikipedia direct search
    if (!coverInfo.found || !coverInfo.imageUrl) {
        log('MobyGames search did not find image, trying Wikipedia directly', 'debug', { gameTitle });
        const wikipediaService = require('./wikipedia');
        coverInfo = await wikipediaService.findGameCover(gameTitle, 600);

        if (coverInfo.found && coverInfo.imageUrl) {
            log('Found image via Wikipedia fallback', 'info', { gameTitle });
        }
    }

    // FINAL FALLBACK: DuckDuckGo image search
    if (!coverInfo.found || !coverInfo.imageUrl) {
        log('Wikipedia search did not find image, trying DuckDuckGo image search', 'debug', { gameTitle });
        coverInfo = await searchDuckDuckGoImages(gameTitle);

        if (coverInfo.found && coverInfo.imageUrl) {
            log('Found image via DuckDuckGo fallback', 'info', { gameTitle });
        }
    }

    if (!coverInfo.found || !coverInfo.imageUrl) {
        log('No cover image found in any source', 'warn', { gameTitle });
        return {
            success: false,
            found: false,
            reason: 'no_image_found'
        };
    }

    // Download and store the image
    const storeResult = await storeGameImage(slug, coverInfo.imageUrl);

    if (storeResult.success) {
        log('Cover image fetched and stored', 'info', {
            slug,
            source: coverInfo.source
        });

        return {
            success: true,
            found: true,
            path: storeResult.path,
            url: storeResult.url,
            source: coverInfo.source,
            width: coverInfo.width,
            height: coverInfo.height
        };
    }

    return {
        success: false,
        found: true,
        reason: 'storage_failed',
        error: storeResult.error
    };
}

/**
 * Get image statistics
 * @returns {Promise<Object>}
 */
async function getImageStats() {
    await ensureImagesDir();

    try {
        const files = await fs.readdir(IMAGES_PATH);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

        const totalSize = await Promise.all(
            imageFiles.map(async file => {
                const stat = await fs.stat(path.join(IMAGES_PATH, file));
                return stat.size;
            })
        ).then(sizes => sizes.reduce((a, b) => a + b, 0));

        return {
            directory: IMAGES_PATH,
            count: imageFiles.length,
            totalSize,
            sharpAvailable: !!sharp
        };

    } catch (error) {
        return {
            directory: IMAGES_PATH,
            count: 0,
            totalSize: 0,
            sharpAvailable: !!sharp,
            error: error.message
        };
    }
}

/**
 * Delete an image file
 * @param {string} slug - Game slug
 * @returns {Promise<boolean>}
 */
async function deleteImage(slug) {
    const imagePath = getImagePath(slug);

    try {
        await fs.unlink(imagePath);
        log(`Image deleted: ${slug}`, 'info');
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            log(`Image not found: ${slug}`, 'warn');
            return false;
        }
        throw error;
    }
}

module.exports = {
    storeGameImage,
    fetchAndStoreCover,
    findCoverImageWithLLM,
    imageExists,
    getImagePath,
    getImageStats,
    deleteImage,
    ensureImagesDir
};
