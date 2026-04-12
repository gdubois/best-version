/**
 * Admin Processor Status API
 *
 * Provides endpoint for monitoring the game creator processor.
 * GC-3.4: Processor Status Dashboard
 */

const express = require('express');
const queueService = require('../../services/game-creator/queueService');
const processor = require('../../services/game-creator/processor');
const scheduler = require('../../services/game-creator/scheduler');

const router = express.Router();

// All routes require admin authentication
const adminAuth = require('../../middleware/adminAuth').adminAuth;
router.use(adminAuth.requireAdmin.bind(adminAuth));

/**
 * GET /api/admin/processor-status
 * Returns current processor status and queue metrics
 */
router.get('/processor-status', async (req, res) => {
    try {
        // Get queue statistics
        const queueStats = await queueService.getQueueStats();

        // Get scheduler status
        const schedulerStatus = scheduler.getStatus();

        // Get in-progress submission if any
        let inProgressSubmission = null;
        try {
            const index = await queueService._loadGamesIndex
                ? await queueService._loadGamesIndex()
                : { submissions: [] };

            const inProgress = index.submissions.find(s => s.status === 'in_progress');
            if (inProgress) {
                inProgressSubmission = {
                    id: inProgress.id,
                    title: inProgress.title,
                    inProgressSince: inProgress.processorStatus?.inProgressSince
                };
            }
        } catch (error) {
            // Index might not exist
        }

        // Calculate next run time
        let nextRun = null;
        if (schedulerStatus.running) {
            const schedule = schedulerStatus.schedule;
            // Parse cron schedule and calculate next run
            nextRun = calculateNextRun(schedule);
        }

        res.json({
            queue: {
                ...queueStats,
                pending: queueStats.pending,
                inProgress: queueStats.inProgress,
                completed: queueStats.completed,
                failed: queueStats.failed,
                needsReview: queueStats.needsReview,
                total: queueStats.total
            },
            scheduler: {
                running: schedulerStatus.running,
                schedule: schedulerStatus.schedule,
                featureEnabled: schedulerStatus.featureEnabled,
                nextRun: nextRun
            },
            processing: {
                inProgress: inProgressSubmission,
                isProcessing: schedulerStatus.processing
            },
            // Timestamp for client-side refresh
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[ProcessorStatus] Error fetching status:', error.message);
        res.status(500).json({ error: 'Failed to fetch processor status' });
    }
});

/**
 * POST /api/admin/processor-status/run-now
 * Manually trigger a processing run
 */
router.post('/processor-status/run-now', async (req, res) => {
    try {
        // Check if processing is already in progress
        const schedulerStatus = scheduler.getStatus();
        if (schedulerStatus.processing) {
            return res.status(409).json({
                error: 'Processing already in progress',
                retryAfter: 60 // Suggest waiting 60 seconds
            });
        }

        // Run the processor
        const result = await processor.run();

        res.json({
            success: true,
            result: {
                processed: result.processed,
                success: result.success,
                reason: result.reason,
                slug: result.slug,
                title: result.title,
                confidence: result.confidence,
                imageFound: result.imageFound
            }
        });

    } catch (error) {
        console.error('[ProcessorStatus] Error running processor:', error.message);
        res.status(500).json({ error: 'Failed to run processor' });
    }
});

/**
 * POST /api/admin/processor-status/start
 * Start the scheduler if feature is enabled
 */
router.post('/processor-status/start', (req, res) => {
    try {
        if (!scheduler.isFeatureEnabled()) {
            return res.status(400).json({
                error: 'Game creator feature is disabled',
                hint: 'Set ENABLE_GAME_CREATOR=1 to enable'
            });
        }

        scheduler.start();

        res.json({
            success: true,
            message: 'Scheduler started',
            schedule: scheduler.getSchedule()
        });

    } catch (error) {
        console.error('[ProcessorStatus] Error starting scheduler:', error.message);
        res.status(500).json({ error: 'Failed to start scheduler' });
    }
});

/**
 * POST /api/admin/processor-status/stop
 * Stop the scheduler gracefully
 */
router.post('/processor-status/stop', async (req, res) => {
    try {
        await scheduler.stop();

        res.json({
            success: true,
            message: 'Scheduler stopped'
        });

    } catch (error) {
        console.error('[ProcessorStatus] Error stopping scheduler:', error.message);
        res.status(500).json({ error: 'Failed to stop scheduler' });
    }
});

/**
 * Helper: Calculate next run time from cron schedule
 * @param {string} schedule - Cron schedule string
 * @returns {string} ISO timestamp
 */
function calculateNextRun(schedule) {
    // Simple cron parser for common schedules
    // Format: minute hour day month weekday
    const parts = schedule.split(' ');
    if (parts.length !== 5) {
        return null;
    }

    const [minute, hour] = parts.map(Number);

    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Set to next occurrence
    if (minute === '*' || now.getMinutes() >= minute) {
        next.setMinutes(0);
        if (hour === '*' || now.getHours() >= hour) {
            next.setHours(0);
            next.setDate(next.getDate() + 1);
        } else {
            next.setHours(hour);
        }
    }
    next.setMinutes(minute === '*' ? 0 : minute);

    return next.toISOString();
}

module.exports = { router: router };