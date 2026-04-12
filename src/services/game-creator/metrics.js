/**
 * Processing Metrics Collection Service
 *
 * Tracks and stores metrics on game processing performance,
 * success rates, and API response times.
 *
 * GC-5.1: Processing Metrics Collection
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');

/**
 * Logger instance for metrics component
 */
const logger = createLogger('metrics', { redactApiKey: true });

/**
 * Configuration for metrics collection
 */
const CONFIG = {
    storageDir: path.join(__dirname, '../../data/metrics'),
    dailySummaryFile: 'daily-summary.json',
    maxDailyEntries: 1000,
    retentionDays: 90 // Keep daily summaries for 90 days
};

/**
 * Initialize metrics storage directory
 */
function ensureStorageDirectory() {
    if (!fs.existsSync(CONFIG.storageDir)) {
        fs.mkdirSync(CONFIG.storageDir, { recursive: true });
        logger.info('Created metrics storage directory', { path: CONFIG.storageDir });
    }
}

/**
 * Get today's date string (YYYY-MM-DD)
 * @returns {string} Today's date
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get the daily summary filename for a given date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Filename
 */
function getDailySummaryFilename(dateStr) {
    return `${dateStr}.json`;
}

/**
 * Load daily summary file
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Summary data
 */
function loadDailySummary(dateStr) {
    ensureStorageDirectory();

    const filename = getDailySummaryFilename(dateStr);
    const filePath = path.join(CONFIG.storageDir, filename);

    if (!fs.existsSync(filePath)) {
        return {
            date: dateStr,
            processed: 0,
            autoApproved: 0,
            needsReview: 0,
            failed: 0,
            totalProcessingTimeMs: 0,
            validationFailures: {},
            apiResponseTimes: {
                duckduckgo: [],
                wikipedia: []
            },
            entries: []
        };
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        logger.error(`Failed to load daily summary for ${dateStr}: ${error.message}`);
        return null;
    }
}

/**
 * Save daily summary file
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {Object} summary - Summary data
 */
function saveDailySummary(dateStr, summary) {
    ensureStorageDirectory();

    const filename = getDailySummaryFilename(dateStr);
    const filePath = path.join(CONFIG.storageDir, filename);

    // Limit entries to prevent file bloat
    if (summary.entries.length > CONFIG.maxDailyEntries) {
        summary.entries = summary.entries.slice(-CONFIG.maxDailyEntries);
    }

    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
}

/**
 * Record a completed processing run
 * @param {Object} data - Processing data
 * @param {string} data.submissionId - Submission ID
 * @param {string} data.title - Game title
 * @param {string} data.status - 'auto_approved', 'needs_review', 'failed'
 * @param {number} data.processingTimeMs - Total processing time in milliseconds
 * @param {number} [data.confidenceScore] - Confidence score (0-1)
 * @param {Object} [data.validationIssues] - Validation issues if any
 * @param {Object} [data.apiResponseTimes] - API response times
 */
function recordProcessingComplete(data) {
    const today = getTodayString();
    const summary = loadDailySummary(today);

    if (!summary) {
        logger.warn(`Could not load daily summary for ${today}, skipping metric recording`);
        return;
    }

    // Update counts
    summary.processed++;
    if (data.status === 'auto_approved') {
        summary.autoApproved++;
    } else if (data.status === 'needs_review') {
        summary.needsReview++;
    } else if (data.status === 'failed') {
        summary.failed++;
    }

    // Update total processing time
    summary.totalProcessingTimeMs += data.processingTimeMs || 0;

    // Track validation failures
    if (data.validationIssues) {
        Object.entries(data.validationIssues).forEach(([field, count]) => {
            summary.validationFailures[field] = (summary.validationFailures[field] || 0) + count;
        });
    }

    // Track API response times
    if (data.apiResponseTimes) {
        if (data.apiResponseTimes.duckduckgo !== undefined) {
            summary.apiResponseTimes.duckduckgo.push(data.apiResponseTimes.duckduckgo);
        }
        if (data.apiResponseTimes.wikipedia !== undefined) {
            summary.apiResponseTimes.wikipedia.push(data.apiResponseTimes.wikipedia);
        }
    }

    // Add entry
    summary.entries.push({
        submissionId: data.submissionId,
        title: data.title,
        status: data.status,
        processingTimeMs: data.processingTimeMs,
        confidenceScore: data.confidenceScore,
        timestamp: new Date().toISOString()
    });

    saveDailySummary(today, summary);
}

/**
 * Get today's metrics summary
 * @returns {Object} Today's metrics with calculated averages
 */
function getTodayMetrics() {
    const today = getTodayString();
    const summary = loadDailySummary(today);

    if (!summary || summary.processed === 0) {
        return {
            date: today,
            processed: 0,
            autoApproved: 0,
            needsReview: 0,
            failed: 0,
            successRate: 0,
            autoApprovalRate: 0,
            avgProcessingTimeMs: 0,
            validationFailures: {},
            avgApiResponseTimes: {
                duckduckgo: 0,
                wikipedia: 0
            }
        };
    }

    // Calculate averages
    const avgProcessingTime = summary.totalProcessingTimeMs / summary.processed;

    const ddgTimes = summary.apiResponseTimes.duckduckgo;
    const avgDDGTime = ddgTimes.length > 0
        ? ddgTimes.reduce((a, b) => a + b, 0) / ddgTimes.length
        : 0;

    const wikiTimes = summary.apiResponseTimes.wikipedia;
    const avgWikiTime = wikiTimes.length > 0
        ? wikiTimes.reduce((a, b) => a + b, 0) / wikiTimes.length
        : 0;

    const successRate = (summary.autoApproved + summary.needsReview) / summary.processed;
    const autoApprovalRate = summary.autoApproved / summary.processed;

    return {
        date: today,
        processed: summary.processed,
        autoApproved: summary.autoApproved,
        needsReview: summary.needsReview,
        failed: summary.failed,
        successRate: parseFloat(successRate.toFixed(2)),
        autoApprovalRate: parseFloat(autoApprovalRate.toFixed(2)),
        avgProcessingTimeMs: parseFloat(avgProcessingTime.toFixed(0)),
        validationFailures: summary.validationFailures,
        avgApiResponseTimes: {
            duckduckgo: parseFloat(avgDDGTime.toFixed(0)),
            wikipedia: parseFloat(avgWikiTime.toFixed(0))
        }
    };
}

/**
 * Get metrics for a specific date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Object} Metrics for the date
 */
function getDateMetrics(dateStr) {
    const summary = loadDailySummary(dateStr);

    if (!summary || summary.processed === 0) {
        return null;
    }

    // Calculate averages (same as getTodayMetrics)
    const avgProcessingTime = summary.totalProcessingTimeMs / summary.processed;

    const ddgTimes = summary.apiResponseTimes.duckduckgo;
    const avgDDGTime = ddgTimes.length > 0
        ? ddgTimes.reduce((a, b) => a + b, 0) / ddgTimes.length
        : 0;

    const wikiTimes = summary.apiResponseTimes.wikipedia;
    const avgWikiTime = wikiTimes.length > 0
        ? wikiTimes.reduce((a, b) => a + b, 0) / wikiTimes.length
        : 0;

    const successRate = (summary.autoApproved + summary.needsReview) / summary.processed;
    const autoApprovalRate = summary.autoApproved / summary.processed;

    return {
        date: dateStr,
        processed: summary.processed,
        autoApproved: summary.autoApproved,
        needsReview: summary.needsReview,
        failed: summary.failed,
        successRate: parseFloat(successRate.toFixed(2)),
        autoApprovalRate: parseFloat(autoApprovalRate.toFixed(2)),
        avgProcessingTimeMs: parseFloat(avgProcessingTime.toFixed(0)),
        validationFailures: summary.validationFailures,
        avgApiResponseTimes: {
            duckduckgo: parseFloat(avgDDGTime.toFixed(0)),
            wikipedia: parseFloat(avgWikiTime.toFixed(0))
        }
    };
}

/**
 * Get metrics for the last N days
 * @param {number} days - Number of days to retrieve
 * @returns {Array} Array of daily metrics
 */
function getLastNDaysMetrics(days = 7) {
    const dailyMetrics = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayMetrics = getDateMetrics(dateStr);
        if (dayMetrics) {
            dailyMetrics.unshift(dayMetrics);
        }
    }

    return dailyMetrics;
}

/**
 * Get aggregated metrics for a date range
 * @param {number} days - Number of days to aggregate
 * @returns {Object} Aggregated metrics
 */
function getAggregatedMetrics(days = 7) {
    const dailyMetrics = getLastNDaysMetrics(days);

    if (dailyMetrics.length === 0) {
        return {
            periodDays: days,
            totalProcessed: 0,
            totalAutoApproved: 0,
            totalNeedsReview: 0,
            totalFailed: 0,
            avgSuccessRate: 0,
            avgAutoApprovalRate: 0,
            avgProcessingTimeMs: 0,
            mostCommonValidationFailures: []
        };
    }

    const totalProcessed = dailyMetrics.reduce((sum, m) => sum + m.processed, 0);
    const totalAutoApproved = dailyMetrics.reduce((sum, m) => sum + m.autoApproved, 0);
    const totalNeedsReview = dailyMetrics.reduce((sum, m) => sum + m.needsReview, 0);
    const totalFailed = dailyMetrics.reduce((sum, m) => sum + m.failed, 0);

    const avgSuccessRate = dailyMetrics.reduce((sum, m) => sum + m.successRate, 0) / dailyMetrics.length;
    const avgAutoApprovalRate = dailyMetrics.reduce((sum, m) => sum + m.autoApprovalRate, 0) / dailyMetrics.length;
    const avgProcessingTime = dailyMetrics.reduce((sum, m) => sum + m.avgProcessingTimeMs, 0) / dailyMetrics.length;

    // Aggregate validation failures
    const validationFailureMap = {};
    dailyMetrics.forEach(m => {
        Object.entries(m.validationFailures).forEach(([field, count]) => {
            validationFailureMap[field] = (validationFailureMap[field] || 0) + count;
        });
    });

    const mostCommonValidationFailures = Object.entries(validationFailureMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([field, count]) => ({ field, count }));

    return {
        periodDays: days,
        totalProcessed,
        totalAutoApproved,
        totalNeedsReview,
        totalFailed,
        avgSuccessRate: parseFloat(avgSuccessRate.toFixed(2)),
        avgAutoApprovalRate: parseFloat(avgAutoApprovalRate.toFixed(2)),
        avgProcessingTimeMs: parseFloat(avgProcessingTime.toFixed(0)),
        mostCommonValidationFailures
    };
}

/**
 * Clean up old daily summary files
 * @returns {number} Number of files deleted
 */
function cleanupOldSummaries() {
    ensureStorageDirectory();

    const files = fs.readdirSync(CONFIG.storageDir);
    const cutoff = Date.now() - (CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const filePath = path.join(CONFIG.storageDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            deleted++;
        }
    });

    if (deleted > 0) {
        logger.info(`Cleaned up ${deleted} old metrics summary files`);
    }

    return deleted;
}

/**
 * Get current processing entry (for ongoing tracking)
 * @returns {Object|null} Current entry or null if none
 */
let currentProcessingEntry = null;

function startTrackingProcessing(submissionId, title) {
    currentProcessingEntry = {
        submissionId,
        title,
        startTime: Date.now(),
        apiResponseTimes: {}
    };
}

function recordApiResponse(api, durationMs) {
    if (currentProcessingEntry) {
        currentProcessingEntry.apiResponseTimes[api] = durationMs;
    }
}

function endTrackingProcessing(status, confidenceScore, validationIssues) {
    if (!currentProcessingEntry) {
        return null;
    }

    const processingTimeMs = Date.now() - currentProcessingEntry.startTime;

    const entry = {
        submissionId: currentProcessingEntry.submissionId,
        title: currentProcessingEntry.title,
        status,
        processingTimeMs,
        confidenceScore,
        validationIssues,
        apiResponseTimes: currentProcessingEntry.apiResponseTimes
    };

    currentProcessingEntry = null;

    return entry;
}

module.exports = {
    CONFIG,
    getTodayString,
    loadDailySummary,
    saveDailySummary,
    recordProcessingComplete,
    getTodayMetrics,
    getDateMetrics,
    getLastNDaysMetrics,
    getAggregatedMetrics,
    cleanupOldSummaries,
    // Real-time tracking
    startTrackingProcessing,
    recordApiResponse,
    endTrackingProcessing
};
