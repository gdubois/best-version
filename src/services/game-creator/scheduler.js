/**
 * Game Creator Scheduler Service
 *
 * Manages the automated processing schedule using cron jobs.
 * Runs the game creator pipeline at configurable intervals.
 *
 * @module services/game-creator/scheduler
 */

const cron = require('node-cron');
const processor = require('./processor');
const { createLogger } = require('./logger');

// Configuration
const DEFAULT_SCHEDULE = '30 * * * *'; // :30 past every hour
const SCHEDULE_ENV_VAR = 'GAME_CREATOR_CRON_SCHEDULE';
const ENABLE_FEATURE_ENV_VAR = 'ENABLE_GAME_CREATOR';

// Scheduler state
let scheduler = null;
let isProcessing = false;

/**
 * Logger instance for scheduler component
 * @private
 */
const logger = createLogger('scheduler', { redactApiKey: true });

/**
 * Logger helper (wraps structured logger)
 * @private
 */
async function log(message, level = 'info') {
    switch (level) {
        case 'debug':
            await logger.debug(message);
            break;
        case 'warn':
            await logger.warn(message);
            break;
        case 'error':
            await logger.error(message);
            break;
        default:
            await logger.info(message);
    }
}

/**
 * Check if the game creator feature is enabled
 * @returns {boolean}
 */
function isFeatureEnabled() {
    const enabled = process.env[ENABLE_FEATURE_ENV_VAR];
    return enabled !== 'false' && enabled !== '0' && enabled !== 'disabled';
}

/**
 * Get the cron schedule from environment or use default
 * @returns {string}
 */
function getSchedule() {
    return process.env[SCHEDULE_ENV_VAR] || DEFAULT_SCHEDULE;
}

/**
 * Process the next pending game submission
 * @returns {Promise<void>}
 */
async function processNextGame() {
    if (isProcessing) {
        log('Processing already in progress, skipping this run', 'warn');
        return;
    }

    isProcessing = true;
    log('Starting game processing run');

    try {
        const result = await processor.run();

        if (!result.processed) {
            log(`Processing run result: ${result.reason}`, 'info');
        } else if (result.success) {
            log(`Successfully processed: ${result.slug} (${result.title})`, 'info', {
                confidence: result.confidence,
                time: result.processingTime
            });
        } else {
            log(`Processing failed: ${result.reason}`, 'warn', {
                confidence: result.confidence,
                issues: result.issues
            });
        }

    } catch (error) {
        log(`Error processing game: ${error.message}`, 'error');

    } finally {
        isProcessing = false;
    }
}

/**
 * Initialize and start the scheduler
 * @returns {void}
 */
function start() {
    if (!isFeatureEnabled()) {
        log('Game Creator feature is disabled. Set ENABLE_GAME_CREATOR=1 to enable.', 'warn');
        return;
    }

    if (scheduler) {
        log('Scheduler already running', 'warn');
        return;
    }

    const schedule = getSchedule();
    log(`Starting scheduler with schedule: ${schedule}`);

    // Create the cron job
    scheduler = cron.schedule(schedule, processNextGame, {
        scheduled: true,
        timezone: process.env.TIMEZONE || 'UTC'
    });

    log('Scheduler started successfully');
}

/**
 * Stop the scheduler gracefully
 * @returns {Promise<void>}
 */
async function stop() {
    if (!scheduler) {
        log('Scheduler not running', 'warn');
        return;
    }

    log('Stopping scheduler...');

    // Wait for any in-progress processing to complete
    if (isProcessing) {
        log('Waiting for current processing to complete...', 'warn');

        // Wait up to 5 minutes for processing to complete
        const timeout = 5 * 60 * 1000;
        const startTime = Date.now();

        while (isProcessing && (Date.now() - startTime < timeout)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (isProcessing) {
            log('Processing did not complete within timeout, forcing stop', 'error');
        }
    }

    // Stop the cron job
    scheduler.stop();
    scheduler = null;

    log('Scheduler stopped');
}

/**
 * Check if scheduler is currently running
 * @returns {boolean}
 */
function isRunning() {
    return scheduler !== null;
}

/**
 * Get current scheduler status
 * @returns {Object}
 */
function getStatus() {
    return {
        running: isRunning(),
        processing: isProcessing,
        schedule: getSchedule(),
        featureEnabled: isFeatureEnabled(),
        nextRun: scheduler ? scheduler.nextScheduledInvocation() : null
    };
}

/**
 * Manually trigger a processing run (for testing/admin use)
 * @returns {Promise<void>}
 */
async function runNow() {
    log('Manual processing trigger received', 'info');
    await processNextGame();
}

module.exports = {
    start,
    stop,
    isRunning,
    getStatus,
    runNow,
    isFeatureEnabled,
    getSchedule
};
