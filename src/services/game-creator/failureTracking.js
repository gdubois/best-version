/**
 * Failure Recovery and Dead Letter Queue Service
 *
 * Manages failed submissions, provides recovery mechanisms,
 * and handles automatic retry after cooldown periods.
 *
 * GC-4.4: Failure Recovery and Dead Letter Queue
 */

const { createLogger } = require('./logger');
const queueService = require('./queueService');

/**
 * Logger instance for failure tracking component
 */
const logger = createLogger('failure_tracking', { redactApiKey: true });

/**
 * Configuration for failure recovery
 */
const CONFIG = {
    autoRetryEnabled: true,
    autoRetryCooldown: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxRetryAttempts: 3, // Maximum number of retry attempts before permanent failure
    cleanupInterval: 60 * 60 * 1000 // Check for auto-retry every hour
};

/**
 * Failure reasons categorization
 */
const FailureReasons = {
    VERIFICATION_FAILED: 'verification_failed',
    VALIDATION_FAILED: 'validation_failed',
    PROCESSING_ERROR: 'processing_error',
    API_ERROR: 'api_error',
    RATE_LIMITED: 'rate_limited',
    TIMEOUT: 'timeout',
    REJECTED: 'rejected',
    UNKNOWN: 'unknown'
};

/**
 * Get detailed failure information for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Object|null>} Failure details or null if not found
 */
async function getFailureDetails(submissionId) {
    try {
        const failedSubmissions = await queueService.getFailedSubmissions();
        const submission = failedSubmissions.find(s => s.id === submissionId);

        if (!submission) {
            return null;
        }

        const { processorStatus } = submission;
        const lastAttempt = processorStatus?.lastAttempt || submission.submittedAt;
        const failedAt = processorStatus?.failedAt || lastAttempt;
        const skipUntil = processorStatus?.skipUntil;

        // Calculate if auto-retry is available
        const now = Date.now();
        const skipUntilDate = skipUntil ? new Date(skipUntil) : null;
        const canAutoRetry = skipUntilDate ? now >= skipUntilDate.getTime() : true;
        const timeUntilRetry = skipUntilDate && !canAutoRetry
            ? skipUntilDate.getTime() - now
            : 0;

        // Categorize the failure
        const failureReason = categorizeFailureReason(
            processorStatus?.failureReason || 'unknown'
        );

        return {
            submissionId: submission.id,
            title: submission.title,
            submittedAt: submission.submittedAt,
            failedAt,
            lastAttempt,
            failureReason,
            failureMessage: processorStatus?.failureReason || 'Unknown error',
            attemptCount: processorStatus?.attemptCount || 1,
            skipUntil,
            canAutoRetry,
            timeUntilRetryMs: timeUntilRetry,
            metadata: {
                confidenceScore: processorStatus?.confidenceScore,
                gameSlug: processorStatus?.gameSlug,
                imageFound: processorStatus?.imageFound
            }
        };
    } catch (error) {
        logger.error(`Failed to get failure details for ${submissionId}: ${error.message}`);
        return null;
    }
}

/**
 * Categorize a failure reason into a standard category
 * @param {string} reason - Raw failure reason
 * @returns {string} Categorized reason
 */
function categorizeFailureReason(reason) {
    if (!reason) return FailureReasons.UNKNOWN;

    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('verification') || lowerReason.includes('confidence')) {
        return FailureReasons.VERIFICATION_FAILED;
    }

    if (lowerReason.includes('validation')) {
        return FailureReasons.VALIDATION_FAILED;
    }

    if (lowerReason.includes('rate') || lowerReason.includes('limit')) {
        return FailureReasons.RATE_LIMITED;
    }

    if (lowerReason.includes('timeout') || lowerReason.includes('timed out')) {
        return FailureReasons.TIMEOUT;
    }

    if (lowerReason.includes('rejected')) {
        return FailureReasons.REJECTED;
    }

    if (lowerReason.includes('api') || lowerReason.includes('http')) {
        return FailureReasons.API_ERROR;
    }

    return FailureReasons.PROCESSING_ERROR;
}

/**
 * Get all failed submissions with their failure details
 * @returns {Promise<Array>} Array of failure details
 */
async function getAllFailures() {
    const failedSubmissions = await queueService.getFailedSubmissions();

    const failureDetails = await Promise.all(
        failedSubmissions.map(async (submission) => {
            return await getFailureDetails(submission.id);
        })
    );

    return failureDetails.filter(d => d !== null);
}

/**
 * Get failed submissions by failure reason category
 * @param {string} reason - Failure reason category
 * @returns {Promise<Array>} Filtered failures
 */
async function getFailuresByReason(reason) {
    const allFailures = await getAllFailures();
    return allFailures.filter(f => f.failureReason === reason);
}

/**
 * Retry a failed submission
 * @param {string} submissionId - Submission ID to retry
 * @returns {Promise<Object>} Result of the retry operation
 */
async function retryFailedSubmission(submissionId) {
    logger.info(`Manual retry requested for submission: ${submissionId}`);

    try {
        // Reset the submission to pending status
        await queueService.retrySubmission(submissionId);

        logger.info(`Submission ${submissionId} reset to pending status`);

        return {
            success: true,
            submissionId,
            message: 'Submission queued for retry'
        };
    } catch (error) {
        logger.error(`Failed to retry submission ${submissionId}: ${error.message}`);

        return {
            success: false,
            submissionId,
            error: error.message
        };
    }
}

/**
 * Permanently mark a submission as failed (no more retries)
 * @param {string} submissionId - Submission ID
 * @param {string} reason - Reason for permanent failure
 * @returns {Promise<void>}
 */
async function markPermanentlyFailed(submissionId, reason) {
    const index = await queueService._loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = 'failed';
    submission.processorStatus = {
        ...submission.processorStatus,
        failureReason: reason,
        failedAt: new Date().toISOString(),
        permanent: true,
        skipUntil: null // No more retries
    };

    await queueService._saveSubmissionsIndex(index);

    logger.warn(`Submission ${submissionId} marked as permanently failed: ${reason}`, {
        submissionId,
        reason
    });
}

/**
 * Check for submissions that are ready for auto-retry
 * @returns {Promise<Array>} Submissions ready for auto-retry
 */
async function checkAutoRetryEligible() {
    const failedSubmissions = await queueService.getFailedSubmissions();
    const now = Date.now();

    const eligible = failedSubmissions.filter(submission => {
        const skipUntil = submission.processorStatus?.skipUntil;

        // Skip if permanently failed
        if (submission.processorStatus?.permanent) {
            return false;
        }

        // Skip if no skipUntil is set (manual retry only)
        if (!skipUntil) {
            return false;
        }

        // Check if cooldown has passed
        const skipUntilDate = new Date(skipUntil);
        return now >= skipUntilDate.getTime();
    });

    return eligible;
}

/**
 * Process auto-retry for eligible submissions
 * @param {number} maxConcurrent - Maximum submissions to retry concurrently
 * @returns {Promise<Array>} Results of retry operations
 */
async function processAutoRetry(maxConcurrent = 5) {
    if (!CONFIG.autoRetryEnabled) {
        logger.debug('Auto-retry is disabled');
        return [];
    }

    const eligible = await checkAutoRetryEligible();

    if (eligible.length === 0) {
        logger.debug('No submissions eligible for auto-retry');
        return [];
    }

    logger.info(`Found ${eligible.length} submissions eligible for auto-retry`);

    const results = [];

    // Process with concurrency limit
    for (let i = 0; i < eligible.length; i += maxConcurrent) {
        const batch = eligible.slice(i, i + maxConcurrent);

        const batchResults = await Promise.all(
            batch.map(async (submission) => {
                try {
                    await queueService.retrySubmission(submission.id);
                    logger.info(`Auto-retry queued for: ${submission.id} - "${submission.title}"`);

                    return {
                        success: true,
                        submissionId: submission.id
                    };
                } catch (error) {
                    logger.error(`Auto-retry failed for ${submission.id}: ${error.message}`);

                    return {
                        success: false,
                        submissionId: submission.id,
                        error: error.message
                    };
                }
            })
        );

        results.push(...batchResults);

        // Small delay between batches
        if (i + maxConcurrent < eligible.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;

    logger.info(`Auto-retry complete: ${successes} successful, ${failures} failed`);

    return results;
}

/**
 * Get failure statistics
 * @returns {Promise<Object>} Failure statistics
 */
async function getFailureStats() {
    const allFailures = await getAllFailures();

    // Group by failure reason
    const byReason = {};
    allFailures.forEach(f => {
        byReason[f.failureReason] = (byReason[f.failureReason] || 0) + 1;
    });

    // Calculate time-based stats
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const recent24h = allFailures.filter(
        f => new Date(f.failedAt).getTime() >= oneDayAgo
    ).length;

    const recent7d = allFailures.filter(
        f => new Date(f.failedAt).getTime() >= oneWeekAgo
    ).length;

    // Get permanently failed count (placeholder - would need additional query)
    const permanentCount = 0;

    return {
        totalFailures: allFailures.length,
        recent24h,
        recent7d,
        byReason,
        permanentlyFailed: permanentCount,
        eligibleForRetry: allFailures.filter(f => f.canAutoRetry).length,
        categories: Object.keys(FailureReasons)
    };
}

/**
 * Cleanup old failure records (optional maintenance)
 * @param {number} maxAgeDays - Maximum age in days (default: 90)
 * @returns {Promise<number>} Number of records cleaned up
 */
async function cleanupOldFailures(maxAgeDays = 90) {
    // Note: This would require modifying the queueService to support deletion
    // For now, we just log what would be cleaned up
    const allFailures = await getAllFailures();
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);

    const oldFailures = allFailures.filter(
        f => new Date(f.failedAt).getTime() < cutoff
    );

    logger.info(`Found ${oldFailures.length} failure records older than ${maxAgeDays} days`);

    // In a full implementation, these would be archived or deleted
    // For now, we return the count

    return oldFailures.length;
}

module.exports = {
    FailureReasons,
    CONFIG,
    getFailureDetails,
    getAllFailures,
    getFailuresByReason,
    retryFailedSubmission,
    markPermanentlyFailed,
    checkAutoRetryEligible,
    processAutoRetry,
    getFailureStats,
    cleanupOldFailures,
    categorizeFailureReason
};
