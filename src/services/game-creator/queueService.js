/**
 * Game Submission Queue Service
 *
 * Manages the queue of pending game submissions for automated processing.
 * Reads from submissions/index.json and tracks processing state.
 *
 * @module services/game-creator/queueService
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { lock } = require('proper-lockfile');

const SUBMISSIONS_PATH = path.join(__dirname, '../../../submissions');
const SUBMISSIONS_INDEX = path.join(SUBMISSIONS_PATH, 'index.json');
const SUBMISSIONS_LOCK = path.join(SUBMISSIONS_PATH, '.index.json.lock');
const GAMES_PATH = path.join(__dirname, '../../../games');
const GAMES_INDEX = path.join(GAMES_PATH, 'index.json');

// Lock configuration
const LOCK_OPTIONS = {
    stale: 10000,        // Consider lock stale after 10 seconds
    update: 1000,        // Update lock every 1 second
    retries: {
        retries: 3,      // Retry 3 times
        factor: 1.5,     // Exponential backoff
        minTimeout: 1000 // Minimum 1 second between retries
    }
};

/**
 * Ensure the submissions directory and required files exist
 * @private
 */
async function ensureSubmissionsDirectory() {
    try {
        // Create directory if it doesn't exist
        await fs.mkdir(SUBMISSIONS_PATH, { recursive: true });

        // Create index.json if it doesn't exist
        try {
            await fs.access(SUBMISSIONS_INDEX);
        } catch {
            await fs.writeFile(SUBMISSIONS_INDEX, JSON.stringify({ submissions: [] }, null, 2), 'utf8');
        }

        // Create lock file if it doesn't exist (proper-lockfile requires it)
        try {
            await fs.access(SUBMISSIONS_LOCK);
        } catch {
            await fs.writeFile(SUBMISSIONS_LOCK, 'lock', 'utf8');
        }
    } catch (error) {
        console.error('[QueueService] Failed to ensure submissions directory:', error.message);
        throw error;
    }
}

// Initialize on module load
ensureSubmissionsDirectory().catch(err => {
    console.error('[QueueService] Initialization error:', err.message);
});

/**
 * Queue state tracker for in-memory state management
 */
class QueueState {
    constructor() {
        this.inProgress = new Map(); // submissionId -> { startedAt, lockId }
        this.processed = new Set();   // submissionIds that were processed this session
    }

    /**
     * Mark a submission as in progress
     * @param {string} submissionId
     * @returns {boolean} true if successfully marked, false if already in progress
     */
    markInProgress(submissionId) {
        if (this.inProgress.has(submissionId)) {
            return false;
        }
        const lockId = uuidv4();
        this.inProgress.set(submissionId, {
            startedAt: new Date().toISOString(),
            lockId
        });
        return true;
    }

    /**
     * Release a submission from in-progress state
     * @param {string} submissionId
     */
    release(submissionId) {
        this.inProgress.delete(submissionId);
    }

    /**
     * Check if a submission is currently being processed
     * @param {string} submissionId
     * @returns {boolean}
     */
    isProcessing(submissionId) {
        return this.inProgress.has(submissionId);
    }

    /**
     * Add a submission to processed set
     * @param {string} submissionId
     */
    markProcessed(submissionId) {
        this.processed.add(submissionId);
    }

    /**
     * Check if submission was already processed this session
     * @param {string} submissionId
     * @returns {boolean}
     */
    wasProcessed(submissionId) {
        return this.processed.has(submissionId);
    }

    /**
     * Get count of submissions currently in progress
     * @returns {number}
     */
    getInProgressCount() {
        return this.inProgress.size;
    }
}

// Global queue state instance
const queueState = new QueueState();

/**
 * Load the submissions index file with file locking
 * @returns {Promise<{submissions: Array}>}
 * @private
 */
async function loadSubmissionsIndex() {
    try {
        const release = await lock(SUBMISSIONS_LOCK, LOCK_OPTIONS);
        try {
            const data = await fs.readFile(SUBMISSIONS_INDEX, 'utf8');
            return JSON.parse(data);
        } finally {
            release();
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist yet, return empty structure
            return { submissions: [] };
        }
        throw error;
    }
}

/**
 * Save the submissions index file with file locking
 * @param {Object} indexData - Data to save
 * @private
 */
async function saveSubmissionsIndex(indexData) {
    const release = await lock(SUBMISSIONS_LOCK, LOCK_OPTIONS);
    try {
        await fs.writeFile(SUBMISSIONS_INDEX, JSON.stringify(indexData, null, 2), 'utf8');
    } finally {
        release();
    }
}

/**
 * Check if a game already exists in the games library
 * @param {string} title - Game title to check
 * @returns {Promise<boolean>}
 */
async function gameExists(title) {
    try {
        const index = await loadGamesIndex();
        return index.games.some(g =>
            g.title.toLowerCase() === title.toLowerCase() ||
            (g.alternativeNames && g.alternativeNames.some(an =>
                an.toLowerCase() === title.toLowerCase()
            ))
        );
    } catch (error) {
        // If games index doesn't exist, no games exist yet
        return false;
    }
}

/**
 * Load the games index file
 * @returns {Promise<{games: Array}>}
 */
async function loadGamesIndex() {
    try {
        const data = await fs.readFile(GAMES_INDEX, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { games: [] };
        }
        throw error;
    }
}

/**
 * Get the next pending submission from the queue
 *
 * Filters out:
 * - Submissions not in 'pending' status
 * - Games that already exist in the library
 * - Submissions currently being processed
 *
 * @returns {Promise<Object|null>} The next submission to process, or null if none available
 */
async function getNextPendingSubmission() {
    const index = await loadSubmissionsIndex();

    for (const submission of index.submissions) {
        // Skip non-pending submissions
        if (submission.status !== 'pending') {
            continue;
        }

        // Skip if already being processed
        if (queueState.isProcessing(submission.id)) {
            continue;
        }

        // Skip if game already exists
        if (await gameExists(submission.title)) {
            // Mark as completed since game already exists
            await updateSubmissionStatus(submission.id, 'completed', {
                reason: 'Game already exists in library'
            });
            continue;
        }

        // Skip if processor marked it for later
        if (submission.processorStatus?.skipUntil) {
            const skipUntil = new Date(submission.processorStatus.skipUntil);
            if (new Date() < skipUntil) {
                continue;
            }
        }

        return submission;
    }

    return null;
}

/**
 * Mark a submission as in progress
 * @param {string} submissionId
 * @returns {Promise<boolean>} true if successfully marked
 */
async function markInProgress(submissionId) {
    // Check in-memory state first
    if (!queueState.markInProgress(submissionId)) {
        return false;
    }

    // Update file-based state
    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        queueState.release(submissionId);
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = 'in_progress';
    submission.processorStatus = {
        ...submission.processorStatus,
        lastAttempt: new Date().toISOString(),
        attemptCount: (submission.processorStatus?.attemptCount || 0) + 1,
        inProgressSince: new Date().toISOString()
    };

    await saveSubmissionsIndex(index);
    return true;
}

/**
 * Mark a submission as completed
 * @param {string} submissionId
 * @param {Object} options
 * @param {string} options.gameSlug - The slug of the created game (if applicable)
 * @param {number} options.confidenceScore - The confidence score of the generated data
 */
async function markCompleted(submissionId, options = {}) {
    queueState.release(submissionId);
    queueState.markProcessed(submissionId);

    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = 'completed';
    submission.processorStatus = {
        ...submission.processorStatus,
        lastAttempt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        gameSlug: options.gameSlug,
        confidenceScore: options.confidenceScore,
        failureReason: null
    };

    await saveSubmissionsIndex(index);
}

/**
 * Mark a submission as failed
 * @param {string} submissionId
 * @param {string} reason - The failure reason
 * @param {Object} options
 * @param {string} options.skipUntil - When to retry (ISO date string)
 */
async function markFailed(submissionId, reason, options = {}) {
    queueState.release(submissionId);

    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = 'failed';
    submission.processorStatus = {
        ...submission.processorStatus,
        lastAttempt: new Date().toISOString(),
        attemptCount: (submission.processorStatus?.attemptCount || 0) + 1,
        failureReason: reason,
        failedAt: new Date().toISOString(),
        skipUntil: options.skipUntil
    };

    await saveSubmissionsIndex(index);
}

/**
 * Mark a submission for admin review
 * @param {string} submissionId
 * @param {Object} options
 * @param {number} options.confidenceScore
 * @param {Array} options.issues - List of validation issues
 * @param {Object} options.draftData - The generated draft data
 */
async function markForReview(submissionId, options = {}) {
    queueState.release(submissionId);

    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = 'needs_review';
    submission.processorStatus = {
        ...submission.processorStatus,
        lastAttempt: new Date().toISOString(),
        needsReviewAt: new Date().toISOString(),
        confidenceScore: options.confidenceScore,
        issues: options.issues,
        draftPath: options.draftPath,
        draftData: options.draftData,
        failureReason: null
    };

    await saveSubmissionsIndex(index);
}

/**
 * Update submission status (internal helper)
 * @param {string} submissionId
 * @param {string} status
 * @param {Object} processorStatusUpdates
 */
async function updateSubmissionStatus(submissionId, status, processorStatusUpdates = {}) {
    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = status;
    submission.processorStatus = {
        ...submission.processorStatus,
        ...processorStatusUpdates,
        lastAttempt: new Date().toISOString()
    };

    await saveSubmissionsIndex(index);
}

/**
 * Get all failed submissions for admin review
 * @returns {Promise<Array>}
 */
async function getFailedSubmissions() {
    const index = await loadSubmissionsIndex();
    return index.submissions
        .filter(s => s.status === 'failed')
        .sort((a, b) => {
            // Sort by oldest first
            const aDate = a.processorStatus?.lastAttempt || a.submittedAt;
            const bDate = b.processorStatus?.lastAttempt || b.submittedAt;
            return new Date(aDate) - new Date(bDate);
        });
}

/**
 * Get all submissions needing review
 * @returns {Promise<Array>}
 */
async function getSubmissionsNeedingReview() {
    const index = await loadSubmissionsIndex();
    return index.submissions
        .filter(s => s.status === 'needs_review')
        .sort((a, b) => {
            const aDate = a.processorStatus?.needsReviewAt || a.submittedAt;
            const bDate = b.processorStatus?.needsReviewAt || b.submittedAt;
            return new Date(aDate) - new Date(bDate);
        });
}

/**
 * Get queue statistics
 * @returns {Promise<Object>}
 */
async function getQueueStats() {
    const index = await loadSubmissionsIndex();

    return {
        total: index.submissions.length,
        pending: index.submissions.filter(s => s.status === 'pending').length,
        inProgress: queueState.getInProgressCount(),
        completed: index.submissions.filter(s => s.status === 'completed').length,
        failed: index.submissions.filter(s => s.status === 'failed').length,
        needsReview: index.submissions.filter(s => s.status === 'needs_review').length
    };
}

/**
 * Retry a failed submission
 * @param {string} submissionId
 */
async function retrySubmission(submissionId) {
    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === submissionId);

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
    }

    if (submission.status !== 'failed') {
        throw new Error(`Submission ${submissionId} is not in failed status (current: ${submission.status})`);
    }

    // Reset to pending
    submission.status = 'pending';
    submission.processorStatus = {
        ...submission.processorStatus,
        lastAttempt: new Date().toISOString(),
        retryAt: new Date().toISOString(),
        skipUntil: null
    };

    await saveSubmissionsIndex(index);
}

// Export public API
module.exports = {
    // Main queue operations
    getNextPendingSubmission,
    markInProgress,
    markCompleted,
    markFailed,
    markForReview,

    // Query operations
    getFailedSubmissions,
    getSubmissionsNeedingReview,
    getQueueStats,

    // Admin operations
    retrySubmission,

    // State management (for internal use and testing)
    queueState,

    // Internal methods (exported for API layer)
    _loadSubmissionsIndex: loadSubmissionsIndex,
    _saveSubmissionsIndex: saveSubmissionsIndex
};
