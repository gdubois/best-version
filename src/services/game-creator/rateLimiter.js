/**
 * API Rate Limit Handling Service
 *
 * Tracks and enforces rate limits for external API calls.
 * Prevents exceeding rate limits and handles backoff on rate limit responses.
 *
 * GC-4.3: API Rate Limit Handling
 */

const { createLogger } = require('./logger');

/**
 * Logger instance for rate limiter component
 */
const logger = createLogger('rate_limiter', { redactApiKey: true });

/**
 * Rate limit configuration per API
 */
const RATE_LIMIT_CONFIG = {
    duckduckgo: {
        name: 'DuckDuckGo',
        requestsPerMinute: 50,
        requestsPerHour: 1000,
        burstLimit: 10, // Allow short bursts up to this many requests
        backoffMultiplier: 2, // Exponential backoff multiplier
        minBackoff: 1000, // Minimum backoff in ms
        maxBackoff: 60000 // Maximum backoff in ms (1 minute)
    },
    wikipedia: {
        name: 'Wikipedia',
        requestsPerMinute: 10,
        requestsPerHour: 500,
        burstLimit: 2,
        backoffMultiplier: 2,
        minBackoff: 6000, // 6 seconds (Wikipedia minimum)
        maxBackoff: 120000 // 2 minutes
    }
};

/**
 * Rate limit state tracking
 * @typedef {Object} RateLimitState
 * @param {Array<number>} requestTimestamps - Timestamps of recent requests
 * @param {number} currentBackoff - Current backoff value in ms
 * @param {number} backoffUntil - Timestamp when backoff ends
 * @param {number} consecutiveRateLimits - Count of consecutive 429 responses
 */

/**
 * Current rate limit state per API
 */
const rateLimitState = {
    duckduckgo: {
        requestTimestamps: [],
        currentBackoff: 0,
        backoffUntil: 0,
        consecutiveRateLimits: 0
    },
    wikipedia: {
        requestTimestamps: [],
        currentBackoff: 0,
        backoffUntil: 0,
        consecutiveRateLimits: 0
    }
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean up old request timestamps (older than 1 hour)
 * @param {string} apiKey - API identifier
 */
function cleanupOldTimestamps(apiKey) {
    const state = rateLimitState[apiKey];
    if (!state) return;

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    state.requestTimestamps = state.requestTimestamps.filter(
        ts => ts > oneHourAgo
    );
}

/**
 * Get current request count for the last minute
 * @param {string} apiKey - API identifier
 * @returns {number} Number of requests in the last minute
 */
function getRequestsInLastMinute(apiKey) {
    const state = rateLimitState[apiKey];
    if (!state) return 0;

    const oneMinuteAgo = Date.now() - (60 * 1000);
    return state.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;
}

/**
 * Get current request count for the last hour
 * @param {string} apiKey - API identifier
 * @returns {number} Number of requests in the last hour
 */
function getRequestsInLastHour(apiKey) {
    const state = rateLimitState[apiKey];
    if (!state) return 0;

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return state.requestTimestamps.filter(ts => ts > oneHourAgo).length;
}

/**
 * Calculate exponential backoff delay
 * @param {number} consecutiveErrors - Number of consecutive rate limit errors
 * @param {Object} config - API rate limit config
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(consecutiveErrors, config) {
    const backoff = config.minBackoff * Math.pow(config.backoffMultiplier, consecutiveErrors - 1);
    return Math.min(backoff, config.maxBackoff);
}

/**
 * Check if we're currently in backoff period
 * @param {string} apiKey - API identifier
 * @returns {boolean} True if in backoff period
 */
function isInBackoff(apiKey) {
    const state = rateLimitState[apiKey];
    return state && state.backoffUntil > Date.now();
}

/**
 * Get remaining backoff time
 * @param {string} apiKey - API identifier
 * @returns {number} Milliseconds until backoff ends (0 if not in backoff)
 */
function getRemainingBackoff(apiKey) {
    const state = rateLimitState[apiKey];
    if (!state || state.backoffUntil <= Date.now()) {
        return 0;
    }
    return state.backoffUntil - Date.now();
}

/**
 * Wait for rate limit if needed before making a request
 * @param {string} apiKey - API identifier (duckduckgo or wikipedia)
 * @returns {Promise<void>}
 */
async function waitForRateLimit(apiKey) {
    const config = RATE_LIMIT_CONFIG[apiKey];
    const state = rateLimitState[apiKey];

    if (!config || !state) {
        logger.warn(`Unknown API key: ${apiKey}, skipping rate limit check`);
        return;
    }

    const now = Date.now();

    // Clean up old timestamps
    cleanupOldTimestamps(apiKey);

    // Check if we're in backoff period
    if (state.backoffUntil > now) {
        const remaining = state.backoffUntil - now;
        logger.info(`${config.name}: In backoff period, waiting ${remaining}ms`, {
            apiKey,
            remainingMs: remaining
        });
        await sleep(remaining);
        state.backoffUntil = 0;
        state.currentBackoff = 0;
    }

    // Check requests per minute limit
    const requestsThisMinute = getRequestsInLastMinute(apiKey);
    const remainingThisMinute = config.requestsPerMinute - requestsThisMinute;

    if (remainingThisMinute <= 0) {
        // Need to wait for a request to expire from the minute window
        const oldestRequest = state.requestTimestamps[0];
        const waitTime = (oldestRequest + 60000) - now + 100; // +100ms buffer
        logger.warn(`${config.name}: Rate limit approached, waiting ${waitTime}ms`, {
            apiKey,
            requestsThisMinute,
            limit: config.requestsPerMinute,
            waitMs: waitTime
        });
        await sleep(waitTime);
    } else if (remainingThisMinute <= config.burstLimit) {
        // Approaching limit - add small delay to spread requests
        const delay = 1000 * (config.burstLimit - remainingThisMinute + 1);
        logger.debug(`${config.name}: Approaching rate limit, adding delay`, {
            apiKey,
            remaining: remainingThisMinute,
            delayMs: delay
        });
        await sleep(delay);
    }

    // Check requests per hour limit
    const requestsThisHour = getRequestsInLastHour(apiKey);
    if (requestsThisHour >= config.requestsPerHour) {
        logger.error(`${config.name}: Hourly rate limit exceeded`, {
            apiKey,
            requestsThisHour,
            limit: config.requestsPerHour
        });
        throw new Error(`${config.name} hourly rate limit exceeded (${requestsThisHour}/${config.requestsPerHour})`);
    }

    // Record this request
    state.requestTimestamps.push(now);
}

/**
 * Handle a rate limit response (429)
 * @param {string} apiKey - API identifier
 * @param {Object} response - The HTTP response object
 * @returns {Promise<number>} The backoff duration in ms
 */
async function handleRateLimitResponse(apiKey, response) {
    const config = RATE_LIMIT_CONFIG[apiKey];
    const state = rateLimitState[apiKey];

    if (!config || !state) {
        return 0;
    }

    state.consecutiveRateLimits++;

    // Try to get Retry-After header
    let retryAfter = null;
    if (response && response.headers) {
        const retryAfterHeader = response.headers['retry-after'];
        if (retryAfterHeader) {
            // Retry-After can be seconds or HTTP date
            if (!isNaN(parseInt(retryAfterHeader))) {
                retryAfter = parseInt(retryAfterHeader) * 1000;
            } else {
                const retryDate = new Date(retryAfterHeader);
                if (!isNaN(retryDate.getTime())) {
                    retryAfter = retryDate.getTime() - Date.now();
                }
            }
        }
    }

    // Calculate backoff with exponential increase
    let backoff = retryAfter || calculateBackoff(state.consecutiveRateLimits, config);

    logger.warn(`${config.name}: Rate limit hit, backing off for ${backoff}ms`, {
        apiKey,
        consecutiveErrors: state.consecutiveRateLimits,
        retryAfterHeader: retryAfter,
        backoffMs: backoff
    });

    // Set backoff period
    state.currentBackoff = backoff;
    state.backoffUntil = Date.now() + backoff;

    // Wait for backoff period
    await sleep(backoff);

    // Reset backoff after waiting
    state.backoffUntil = 0;
    state.currentBackoff = 0;

    return backoff;
}

/**
 * Reset rate limit state for an API
 * @param {string} apiKey - API identifier
 */
function resetRateLimit(apiKey) {
    if (rateLimitState[apiKey]) {
        rateLimitState[apiKey] = {
            requestTimestamps: [],
            currentBackoff: 0,
            backoffUntil: 0,
            consecutiveRateLimits: 0
        };
        logger.info(`${RATE_LIMIT_CONFIG[apiKey]?.name || apiKey}: Rate limit state reset`, { apiKey });
    }
}

/**
 * Get current rate limit status for an API
 * @param {string} apiKey - API identifier
 * @returns {Object} Current rate limit status
 */
function getRateLimitStatus(apiKey) {
    const config = RATE_LIMIT_CONFIG[apiKey];
    const state = rateLimitState[apiKey];

    if (!config || !state) {
        return {
            available: false,
            error: `Unknown API key: ${apiKey}`
        };
    }

    const requestsThisMinute = getRequestsInLastMinute(apiKey);
    const requestsThisHour = getRequestsInLastHour(apiKey);
    const inBackoff = isInBackoff(apiKey);
    const remainingBackoff = getRemainingBackoff(apiKey);

    return {
        api: config.name,
        requestsThisMinute,
        requestsPerMinuteLimit: config.requestsPerMinute,
        remainingThisMinute: config.requestsPerMinute - requestsThisMinute,
        requestsThisHour,
        requestsPerHourLimit: config.requestsPerHour,
        remainingThisHour: config.requestsPerHour - requestsThisHour,
        inBackoff,
        remainingBackoffMs: remainingBackoff,
        consecutiveRateLimits: state.consecutiveRateLimits,
        canMakeRequest: !inBackoff && requestsThisMinute < config.requestsPerMinute
    };
}

/**
 * Get rate limit status for all APIs
 * @returns {Object} Status for all configured APIs
 */
function getAllRateLimitStatus() {
    const status = {};
    for (const apiKey of Object.keys(RATE_LIMIT_CONFIG)) {
        status[apiKey] = getRateLimitStatus(apiKey);
    }
    return status;
}

/**
 * Wrap an API call with rate limiting
 * @param {string} apiKey - API identifier
 * @param {Function} apiCall - Async function to call
 * @param {Object} options - Options
 * @param {number} options.maxRetries - Maximum retries on rate limit (default: 3)
 * @returns {Promise<any>} Result of the API call
 */
async function withRateLimit(apiKey, apiCall, options = {}) {
    const { maxRetries = 3 } = options;
    const config = RATE_LIMIT_CONFIG[apiKey];

    if (!config) {
        logger.warn(`Unknown API key: ${apiKey}, calling without rate limiting`);
        return await apiCall();
    }

    let lastError;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
        try {
            // Wait for rate limit before making request
            await waitForRateLimit(apiKey);

            // Make the API call
            const result = await apiCall();

            // Success - reset consecutive rate limit counter
            if (rateLimitState[apiKey]) {
                rateLimitState[apiKey].consecutiveRateLimits = 0;
            }

            return result;

        } catch (error) {
            lastError = error;
            retryCount++;

            // Check if this is a rate limit error (429)
            const isRateLimitError =
                error.status === 429 ||
                error.response?.status === 429 ||
                error.message?.includes('rate limit') ||
                error.message?.includes('too many requests');

            if (isRateLimitError && retryCount <= maxRetries) {
                // Handle rate limit and wait
                await handleRateLimitResponse(apiKey, error.response || error);
                continue;
            }

            // Not a rate limit error or max retries exceeded
            throw error;
        }
    }

    throw lastError;
}

module.exports = {
    RATE_LIMIT_CONFIG,
    rateLimitState,
    waitForRateLimit,
    handleRateLimitResponse,
    resetRateLimit,
    getRateLimitStatus,
    getAllRateLimitStatus,
    withRateLimit,
    getRequestsInLastMinute,
    getRequestsInLastHour,
    isInBackoff,
    getRemainingBackoff,
    calculateBackoff,
    sleep
};
