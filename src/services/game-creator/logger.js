/**
 * Comprehensive Logging Service
 *
 * Provides structured JSON logging with file rotation, component separation,
 * and sensitive data redaction for the Game Creator service.
 * GC-4.2: Comprehensive Logging
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const lock = require('proper-lockfile');

/**
 * Log levels with priority order
 */
const LogLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

/**
 * Configuration for the logger
 */
const DEFAULT_CONFIG = {
    logDir: path.join(__dirname, '../../logs'),
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 10,
    level: 'info',
    redactApiKey: true,
    redactPatterns: [
        /api[_-]?key/i,
        /api[_-]?secret/i,
        /password/i,
        /token/i,
        /authorization/i,
        /bearer\s+\w+/i,
        /Bearer\s+\w+/i,
        /Bearer [\w-]+/g
    ],
    redactReplacement: '[REDACTED]'
};

/**
 * Sensitive keys that should always be redacted
 */
const SENSITIVE_KEYS = [
    'apiKey',
    'api_key',
    'apiSecret',
    'api_secret',
    'password',
    'token',
    'auth',
    'authorization',
    'bearer',
    'secret',
    'credentials',
    'privateKey',
    'private_key'
];

/**
 * Redact sensitive values from an object
 * @param {Object} obj - Object to redact
 * @param {Array} patterns - Regex patterns to match
 * @param {string} replacement - Replacement text
 * @param {WeakSet} _visited - Internal: tracks visited objects to prevent circular reference issues
 * @returns {Object} Redacted object
 */
function redactSensitive(obj, patterns, replacement, _visited = new WeakSet()) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    // Handle circular references
    if (_visited.has(obj)) {
        return '[Circular Reference]';
    }
    _visited.add(obj);

    const redacted = {};

    for (const key of Object.keys(obj)) {
        // Check if key name is sensitive
        const keyMatch = SENSITIVE_KEYS.some(sk =>
            key.toLowerCase().includes(sk.toLowerCase())
        );

        if (keyMatch && typeof obj[key] === 'string') {
            redacted[key] = replacement;
            continue;
        }

        // Check if value matches sensitive patterns
        if (typeof obj[key] === 'string') {
            let value = obj[key];
            for (const pattern of patterns) {
                value = value.replace(pattern, replacement);
            }
            redacted[key] = value;
        } else if (Array.isArray(obj[key])) {
            // Handle arrays
            redacted[key] = obj[key].map(item =>
                typeof item === 'object' && item !== null
                    ? redactSensitive(item, patterns, replacement, _visited)
                    : item
            );
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively redact nested objects
            redacted[key] = redactSensitive(obj[key], patterns, replacement, _visited);
        } else {
            redacted[key] = obj[key];
        }
    }

    return redacted;
}

/**
 * Format a log entry as JSON
 * @param {string} level - Log level
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @returns {string} JSON string
 */
function formatLogEntry(level, component, message, metadata = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level: level,
        component: component,
        message: message,
        pid: process.pid,
        hostname: os.hostname()
    };

    // Add metadata if provided
    if (Object.keys(metadata).length > 0) {
        entry.metadata = metadata;
    }

    return JSON.stringify(entry);
}

/**
 * Rotate log files if needed
 * @param {string} logFilePath - Path to the current log file
 * @param {number} maxFileSize - Max file size in bytes
 * @param {number} maxFiles - Max number of backup files
 */
async function rotateLogs(logFilePath, maxFileSize, maxFiles) {
    const lockPath = `${logFilePath}.lock`;

    try {
        // Check if log file exists first - no rotation needed if it doesn't
        const stats = await fs.stat(logFilePath).catch(() => null);

        // Check if rotation is needed
        if (!stats || stats.size < maxFileSize) {
            return;
        }

        // Acquire lock to prevent concurrent rotation
        const release = await lock.lock(lockPath, {
            stale: 10000, // Consider locks older than 10s stale
            retries: {
                retries: 3,
                factor: 1.5,
                minTimeout: 100
            }
        });

        try {
            // Get base directory and name
            const logDir = path.dirname(logFilePath);
            const baseName = path.basename(logFilePath, '.log');

            // Sort existing rotated files
            const existingFiles = await fs.readdir(logDir).catch(() => []);
            const rotatedFiles = existingFiles
                .filter(f => f.startsWith(baseName) && f.endsWith('.log'))
                .map(f => ({
                    file: f,
                    number: parseInt(f.replace(/\D/g, '')) || 0
                }))
                .sort((a, b) => a.number - b.number);

            // Remove oldest files if we're at max
            while (rotatedFiles.length >= maxFiles) {
                const oldest = rotatedFiles.shift();
                await fs.unlink(path.join(logDir, oldest.file)).catch(err => {
                    console.error(`[Logger] Failed to delete old log file: ${err.message}`);
                });
            }

            // Rotate existing files (renumber)
            for (let i = rotatedFiles.length - 1; i >= 0; i--) {
                const currentFile = rotatedFiles[i].file;
                const newNumber = i + 2; // Next number after current file
                const newFile = `${baseName}.${newNumber}.log`;

                await fs.rename(
                    path.join(logDir, currentFile),
                    path.join(logDir, newFile)
                ).catch(err => {
                    console.error(`[Logger] Failed to rotate log file: ${err.message}`);
                });
            }

            // Move current file to .1
            await fs.rename(
                logFilePath,
                path.join(logDir, `${baseName}.1.log`)
            ).catch(err => {
                console.error(`[Logger] Failed to rotate current log: ${err.message}`);
            });

            // Create new empty log file
            await fs.writeFile(logFilePath, '', 'utf8');

        } finally {
            // Always release the lock
            await release();
        }

    } catch (error) {
        if (error.code !== 'LOCK_ACQUISITION_TIMEOUT') {
            console.error('[Logger] Failed to rotate logs:', error.message);
        }
    }
}

/**
 * Write a log entry to file
 * @param {string} logFilePath - Path to the log file
 * @param {string} level - Log level
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
async function writeLog(logFilePath, level, component, message, metadata) {
    try {
        const logDir = path.dirname(logFilePath);
        await fs.mkdir(logDir, { recursive: true }).catch(() => {});

        const entry = formatLogEntry(level, component, message, metadata);

        await fs.appendFile(logFilePath, entry + '\n', 'utf8');

    } catch (error) {
        // Fallback to console if file writing fails
        console.error(`[Logger] Failed to write log: ${error.message}`);
    }
}

/**
 * Get log file path for a component
 * @param {string} component - Component name
 * @param {string} logDir - Base log directory
 * @returns {string} Full path to log file
 */
function getComponentLogPath(component, logDir) {
    // Sanitize component name for filesystem - prevent path traversal
    const safeComponent = component
        .replace(/\.\./g, '') // Remove path traversal attempts
        .replace(/[^a-zA-Z0-9_-]/g, '_'); // Only allow safe characters

    // Ensure we don't escape the logDir
    const normalizedLogDir = path.normalize(logDir);
    const normalizedPath = path.join(normalizedLogDir, `game_creator_${safeComponent}.log`);

    // Verify the path is within logDir (defense in depth)
    if (!normalizedPath.startsWith(normalizedLogDir)) {
        throw new Error(`Component name "${component}" resolved to invalid path`);
    }

    return normalizedPath;
}

/**
 * Create a logger instance for a specific component
 * @param {string} component - Component name (e.g., 'processor', 'research', 'queue')
 * @param {Object} config - Logger configuration
 * @returns {Object} Logger instance
 */
function createLogger(component, config = {}) {
    const loggerConfig = { ...DEFAULT_CONFIG, ...config };
    const logPath = getComponentLogPath(component, loggerConfig.logDir);

    const log = async (level, message, metadata = {}) => {
        // Check if we should log this level
        if (LogLevels[level.toUpperCase()] < LogLevels[loggerConfig.level.toUpperCase()]) {
            return;
        }

        // Redact sensitive data if enabled
        let safeMetadata = metadata;
        if (loggerConfig.redactApiKey) {
            try {
                safeMetadata = redactSensitive(
                    metadata,
                    loggerConfig.redactPatterns,
                    loggerConfig.redactReplacement
                );
            } catch (redactError) {
                // If redaction fails, log a warning and use empty metadata
                console.warn(`[Logger] Redaction failed: ${redactError.message}`);
                safeMetadata = { redactionFailed: true };
            }
        }

        // Check if rotation is needed
        await rotateLogs(logPath, loggerConfig.maxFileSize, loggerConfig.maxFiles);

        // Write to file
        await writeLog(logPath, level, component, message, safeMetadata);

        // Also output to console for ERROR and WARN
        if (level === 'error' || level === 'warn') {
            const consoleMsg = `[${level.toUpperCase()}] [${component}] ${message}`;
            if (level === 'error') {
                console.error(consoleMsg);
            } else {
                console.warn(consoleMsg);
            }
        }
    };

    return {
        debug: (message, metadata) => log('debug', message, metadata),
        info: (message, metadata) => log('info', message, metadata),
        warn: (message, metadata) => log('warn', message, metadata),
        error: (message, metadata) => log('error', message, metadata),

        // Convenience methods for common logging patterns
        submission: (message, submissionId, submissionTitle, extraMetadata = {}) => {
            const metadata = {
                submissionId,
                submissionTitle,
                ...extraMetadata
            };
            return log('info', message, metadata);
        },

        processing: (message, submissionId, confidenceScore, extraMetadata = {}) => {
            const metadata = {
                submissionId,
                confidenceScore,
                ...extraMetadata
            };
            return log('info', message, metadata);
        },

        validation: (message, submissionId, validationResult, extraMetadata = {}) => {
            const metadata = {
                submissionId,
                valid: validationResult.valid,
                confidenceScore: validationResult.confidenceScore,
                issues: validationResult.issues?.length || 0,
                recommendation: validationResult.recommendation,
                ...extraMetadata
            };
            return log('info', message, metadata);
        }
    };
}

/**
 * Create loggers for all Game Creator components
 * @param {Object} config - Shared configuration for all loggers
 * @returns {Object} Object containing all component loggers
 */
function createComponentLoggers(config = {}) {
    const components = [
        'processor',
        'queue',
        'research',
        'validation',
        'storage',
        'scheduler',
        'wikipedia',
        'images',
        'retry',
        'api'
    ];

    const loggers = {};
    for (const comp of components) {
        loggers[comp] = createLogger(comp, config);
    }

    return loggers;
}

/**
 * Get a specific component logger
 * @param {string} component - Component name
 * @param {Object} config - Logger configuration
 * @returns {Object} Logger instance
 */
function getComponentLogger(component, config = {}) {
    return createLogger(component, config);
}

/**
 * Parse a log entry from JSON string
 * @param {string} logLine - JSON log line
 * @returns {Object} Parsed log entry
 */
function parseLogEntry(logLine) {
    try {
        return JSON.parse(logLine);
    } catch (error) {
        return { raw: logLine, parseError: error.message };
    }
}

/**
 * Read and parse recent log entries
 * @param {string} component - Component name
 * @param {number} lines - Number of lines to read
 * @param {string} logDir - Base log directory
 * @returns {Array} Parsed log entries
 */
async function readRecentLogs(component, lines = 100, logDir) {
    const logPath = getComponentLogPath(component, logDir);

    try {
        const content = await fs.readFile(logPath, 'utf8');
        const linesArray = content.split('\n').filter(l => l.trim());
        const recentLines = linesArray.slice(-lines);

        return recentLines.map(parseLogEntry);
    } catch (error) {
        return [];
    }
}

module.exports = {
    LogLevels,
    DEFAULT_CONFIG,
    createLogger,
    createComponentLoggers,
    getComponentLogger,
    redactSensitive,
    parseLogEntry,
    readRecentLogs,
    SENSITIVE_KEYS
};
