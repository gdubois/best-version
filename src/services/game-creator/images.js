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

const IMAGES_PATH = path.join(__dirname, '../../../images');

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
 * Primary source: MobyGames (via Wikipedia)
 * Fallback: Wikipedia direct search
 * Final fallback: DuckDuckGo image search
 * @param {string} gameTitle - Game title
 * @param {string} slug - Game slug
 * @returns {Promise<Object>}
 */
async function fetchAndStoreCover(gameTitle, slug) {
    const mobygamesService = require('./mobygames');

    log(`Fetching cover for: ${gameTitle}`, 'info', { slug });

    // Try MobyGames first (which uses Wikipedia as its data source)
    let coverInfo = await mobygamesService.findGameCover(gameTitle, 600);

    // If MobyGames doesn't have it, fall back to direct Wikipedia search
    if (!coverInfo.found || !coverInfo.imageUrl) {
        log('MobyGames search did not find image, trying Wikipedia directly', 'debug', { gameTitle });
        const wikipediaService = require('./wikipedia');
        coverInfo = await wikipediaService.findGameCover(gameTitle, 600);

        if (coverInfo.found && coverInfo.imageUrl) {
            log('Found image via Wikipedia fallback', 'info', { gameTitle });
        }
    }

    // Final fallback: DuckDuckGo image search
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
    imageExists,
    getImagePath,
    getImageStats,
    deleteImage,
    ensureImagesDir
};
