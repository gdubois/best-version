/**
 * Retry Logic with Exponential Backoff
 *
 * Provides retry functionality with configurable backoff strategies for transient error recovery.
 * GC-4.1: Retry Logic with Exponential Backoff
 */

/**
 * Retry configuration options
 * @typedef {Object} RetryOptions
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 5000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 20000)
 * @param {number} backoffFactor - Multiplier for exponential backoff (default: 2)
 * @param {boolean} jitter - Add random jitter to prevent thundering herd (default: true)
 * @param {Function} shouldRetry - Custom function to determine if error should be retried
 * @param {Function} logger - Custom logger function (default: console)
 */

/**
 * Error types that are considered transient and should be retried
 */
const TRANSIENT_ERROR_PATTERNS = [
    /ETIMEDOUT/,
    /ECONNRESET/,
    /ECONNREFUSED/,
    /ENOTFOUND/,
    /ECONNABORTED/, // Axios connection abort
    /network.*error/i,
    /timeout/i,
    /rate.*limit/i,
    /too.*many.*request/i,
    /\b50[0-9]\b/, // 5xx server errors (word boundary)
    /\b429\b/ // Too Many Requests (word boundary)
];

/**
 * Error types that should NOT be retried (permanent errors)
 */
const PERMANENT_ERROR_PATTERNS = [
    /40[0-9]/, // 400-409 client errors (bad request, not found, etc.)
    /41[0-9]/, // 41x client errors
    /42[0-8]/, // 420-428 client errors (excluding 429)
    /43[0-9]/, // 43x client errors
    /4[4-9][0-9]/, // 44x-49x client errors
    /validation.*error/i,
    /invalid.*request/i,
    /unauthorized/i,
    /forbidden/i
];

// Retryable 4xx status codes (these should be retried despite being client errors)
const RETRYABLE_4XX_CODES = [408, 423, 425]; // Request Timeout, Locked, Too Early

/**
 * Default retry configuration
 */
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelay: 5000,  // 5 seconds
    maxDelay: 20000,     // 20 seconds
    backoffFactor: 2,    // Exponential factor
    jitter: true,        // Add randomness
    logLevel: 'info'     // 'debug', 'info', 'warn', 'error'
};

/**
 * Calculate delay with exponential backoff and optional jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} options - Retry options
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, options) {
    const { initialDelay, maxDelay, backoffFactor, jitter } = {
        ...DEFAULT_OPTIONS,
        ...options
    };

    // Exponential backoff: initialDelay * (backoffFactor ^ attempt)
    let delay = initialDelay * Math.pow(backoffFactor, attempt);

    // Cap at maxDelay
    delay = Math.min(delay, maxDelay);

    // Add jitter (±15%) to prevent thundering herd
    if (jitter) {
        const jitterRange = delay * 0.15;
        delay = delay + (Math.random() * jitterRange * 2 - jitterRange);
    }

    return Math.round(delay);
}

/**
 * Determine if an error should be retried
 * @param {Error} error - The error to check
 * @param {number} attempt - Current attempt number
 * @param {Object} options - Retry options
 * @returns {boolean} True if the error should be retried
 */
function shouldRetry(error, attempt, options = {}) {
    const { customShouldRetry } = { ...DEFAULT_OPTIONS, ...options };

    // Allow custom retry logic to override
    if (typeof customShouldRetry === 'function') {
        return customShouldRetry(error, attempt);
    }

    const errorMessage = error.message || error.toString();

    // Check permanent errors first
    for (const pattern of PERMANENT_ERROR_PATTERNS) {
        if (pattern.test(errorMessage)) {
            return false;
        }
    }

    // Check transient errors
    for (const pattern of TRANSIENT_ERROR_PATTERNS) {
        if (pattern.test(errorMessage)) {
            return true;
        }
    }

    // Default: retry network-like errors (has code property)
    if (error.code || error.status) {
        const status = error.status || (error.response?.status);
        const code = error.code;

        // Retry 5xx server errors
        if (status >= 500) {
            return true;
        }

        // Retry axios error codes
        if (code && (code.startsWith('E') || code === 'ECONNABORTED')) {
            return true;
        }

        // Retry specific 4xx codes that can be transient
        if (status && RETRYABLE_4XX_CODES.includes(status)) {
            return true;
        }

        // Retry 429 (Too Many Requests)
        if (status === 429) {
            return true;
        }
    }

    // Unknown errors: retry once to be safe
    return attempt < 1;
}

/**
 * Sleep for the specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration options
 * @returns {Promise} Result of the function
 */
async function withRetry(fn, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const { maxRetries, logger = console, logLevel } = config;

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            if (attempt > 0) {
                log(logger, logLevel, 'debug',
                    `Retry attempt ${attempt}/${maxRetries}`
                );
            }

            // Wrap function call in Promise to handle both sync and async functions
            return await Promise.resolve(fn());

        } catch (error) {
            lastError = error;
            attempt++;

            // Log the error
            log(logger, logLevel, 'warn',
                `Attempt ${attempt}/${maxRetries + 1} failed: ${error.message}`
            );

            // Check if we should retry
            if (!shouldRetry(error, attempt - 1, config)) {
                logger.error(`Not retrying (permanent error): ${error.message}`);
                throw error;
            }

            // Check if we've exhausted retries
            if (attempt > maxRetries) {
                logger.error(`All ${maxRetries} retries exhausted`);
                throw error;
            }

            // Calculate and apply backoff delay
            const delay = calculateDelay(attempt - 1, config);
            logger.info(`Retrying in ${delay}ms...`);

            await sleep(delay);
        }
    }

    // Should never reach here, but just in case
    throw lastError;
}

/**
 * Retry with different strategies based on error type
 * @param {Function} fn - Async function to retry
 * @param {Object} strategies - Error-specific retry strategies
 * @param {Object} options - Default retry options
 * @returns {Promise} Result of the function
 */
async function withRetryByErrorType(fn, strategies = {}, options = {}) {
    const defaultOptions = { ...DEFAULT_OPTIONS, ...options };
    const logger = defaultOptions.logger || console;

    let lastError;

    try {
        return await withRetry(fn, defaultOptions);
    } catch (error) {
        lastError = error;

        // Determine error type and apply specific strategy
        const errorType = determineErrorType(error);

        if (errorType && strategies[errorType]) {
            const strategy = strategies[errorType];
            logger.info(`Applying ${errorType} retry strategy`);

            try {
                // Merge strategy options with defaults
                const strategyOptions = {
                    ...defaultOptions,
                    ...strategy
                };

                return await withRetry(fn, strategyOptions);
            } catch (strategyError) {
                lastError = strategyError;
            }
        }

        throw lastError;
    }
}

/**
 * Determine the type of error for strategy selection
 * @param {Error} error - The error to classify
 * @returns {string|null} Error type identifier
 */
function determineErrorType(error) {
    const message = error.message || error.toString();

    if (/rate.*limit|429|too.*many/i.test(message)) {
        return 'rate_limit';
    }

    if (/timeout|timed.*out|ETIMEDOUT/i.test(message)) {
        return 'timeout';
    }

    if (/ECONNRESET|ECONNREFUSED|network/i.test(message)) {
        return 'network';
    }

    if (/5[0-9]{2}/.test(message)) {
        return 'server_error';
    }

    if (/4[0-4]{2}/.test(message)) {
        return 'client_error';
    }

    return 'unknown';
}

/**
 * Predefined retry strategies for common error types
 */
const PREDEFINED_STRATEGIES = {
    rate_limit: {
        maxRetries: 3,
        initialDelay: 10000,  // 10 seconds
        maxDelay: 60000,      // 1 minute
        backoffFactor: 2,
        jitter: true
    },

    timeout: {
        maxRetries: 2,
        initialDelay: 3000,   // 3 seconds
        maxDelay: 10000,      // 10 seconds
        backoffFactor: 2,
        jitter: true
    },

    network: {
        maxRetries: 3,
        initialDelay: 2000,   // 2 seconds
        maxDelay: 15000,      // 15 seconds
        backoffFactor: 2.5,
        jitter: true
    },

    server_error: {
        maxRetries: 2,
        initialDelay: 5000,   // 5 seconds
        maxDelay: 30000,      // 30 seconds
        backoffFactor: 2,
        jitter: true
    },

    client_error: {
        maxRetries: 0         // Don't retry client errors
    },

    default: {
        maxRetries: 3,
        initialDelay: 5000,
        maxDelay: 20000,
        backoffFactor: 2,
        jitter: true
    }
};

/**
 * Retry using a predefined strategy
 * @param {Function} fn - Async function to retry
 * @param {string} strategyName - Name of the predefined strategy
 * @param {Object} overrides - Options to override strategy defaults
 * @returns {Promise} Result of the function
 */
async function withPredefinedStrategy(fn, strategyName = 'default', overrides = {}) {
    const strategy = PREDEFINED_STRATEGIES[strategyName] || PREDEFINED_STRATEGIES.default;

    const options = {
        ...DEFAULT_OPTIONS,
        ...strategy,
        ...overrides
    };

    return await withRetry(fn, options);
}

/**
 * Helper: Log message based on log level
 * @param {Object} logger - Logger object
 * @param {string} logLevel - Current log level setting
 * @param {string} messageLevel - Level of this message
 * @param {string} message - Message to log
 */
function log(logger, logLevel, messageLevel, message) {
    const levelOrder = ['debug', 'info', 'warn', 'error'];
    const currentLevelIdx = levelOrder.indexOf(logLevel);
    const messageLevelIdx = levelOrder.indexOf(messageLevel);

    if (messageLevelIdx >= currentLevelIdx) {
        const logMethod = logger[messageLevel] || logger.info;
        logMethod(message);
    }
}

module.exports = {
    withRetry,
    withRetryByErrorType,
    withPredefinedStrategy,
    shouldRetry,
    calculateDelay,
    determineErrorType,
    PREDEFINED_STRATEGIES,
    TRANSIENT_ERROR_PATTERNS,
    PERMANENT_ERROR_PATTERNS,
    DEFAULT_OPTIONS,
    sleep
};
