/**
 * Admin Reviews API
 *
 * Provides endpoints for viewing and managing pending game reviews.
 * GC-3.1: Admin Review Queue API
 */

const express = require('express');
const queueService = require('../../services/game-creator/queueService');
const storageService = require('../../services/game-creator/storage');
const imagesService = require('../../services/game-creator/images');

const router = express.Router();

// All routes require admin authentication
const adminAuth = require('../../middleware/adminAuth').adminAuth;
router.use(adminAuth.requireAdmin.bind(adminAuth));

/**
 * GET /api/admin/pending-reviews
 * Returns list of submissions needing review
 */
router.get('/pending-reviews', async (req, res) => {
    try {
        const submissions = await queueService.getSubmissionsNeedingReview();

        // Enrich with submission details
        const enrichedSubmissions = await Promise.all(
            submissions.map(async (submission) => {
                // Try to load draft data if it exists
                let draftData = null;
                if (submission.processorStatus?.draftPath) {
                    try {
                        const fs = require('fs').promises;
                        const draftContent = await fs.readFile(submission.processorStatus.draftPath, 'utf8');
                        draftData = JSON.parse(draftContent);
                    } catch (error) {
                        // Draft file might not exist yet
                    }
                }

                return {
                    id: submission.id,
                    title: submission.title,
                    submittedAt: submission.submittedAt,
                    needsReviewAt: submission.processorStatus?.needsReviewAt,
                    confidenceScore: submission.processorStatus?.confidenceScore,
                    issues: submission.processorStatus?.issues || [],
                    draftPath: submission.processorStatus?.draftPath,
                    draftData
                };
            })
        );

        res.json({
            count: enrichedSubmissions.length,
            submissions: enrichedSubmissions
        });

    } catch (error) {
        console.error('[AdminReviews] Error fetching pending reviews:', error.message);
        res.status(500).json({ error: 'Failed to fetch pending reviews' });
    }
});

/**
 * GET /api/admin/pending-reviews/:id
 * Returns details of a specific submission needing review
 */
router.get('/pending-reviews/:id', async (req, res) => {
    try {
        const submissions = await queueService.getSubmissionsNeedingReview();
        const submission = submissions.find(s => s.id === req.params.id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Load draft data if available
        let draftData = null;
        if (submission.processorStatus?.draftPath) {
            try {
                const fs = require('fs').promises;
                const draftContent = await fs.readFile(submission.processorStatus.draftPath, 'utf8');
                draftData = JSON.parse(draftContent);
            } catch (error) {
                // Draft file might not exist
            }
        }

        res.json({
            id: submission.id,
            title: submission.title,
            submittedAt: submission.submittedAt,
            needsReviewAt: submission.processorStatus?.needsReviewAt,
            confidenceScore: submission.processorStatus?.confidenceScore,
            issues: submission.processorStatus?.issues || [],
            draftPath: submission.processorStatus?.draftPath,
            draftData
        });

    } catch (error) {
        console.error('[AdminReviews] Error fetching submission:', error.message);
        res.status(500).json({ error: 'Failed to fetch submission details' });
    }
});

/**
 * POST /api/admin/pending-reviews/:id/approve
 * Approve a submission and save it to the games library
 */
router.post('/pending-reviews/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { gameData } = req.body;

        // Get the submission
        const submissions = await queueService.getSubmissionsNeedingReview();
        const submission = submissions.find(s => s.id === id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Use provided game data or load from draft
        let dataToSave = gameData;
        if (!dataToSave && submission.processorStatus?.draftPath) {
            try {
                const fs = require('fs').promises;
                const draftContent = await fs.readFile(submission.processorStatus.draftPath, 'utf8');
                dataToSave = JSON.parse(draftContent);
            } catch (error) {
                return res.status(400).json({ error: 'No game data available to approve' });
            }
        }

        if (!dataToSave) {
            return res.status(400).json({ error: 'No game data provided' });
        }

        // Save the game
        const slug = dataToSave.basic_info?.url_slug || `/games/${submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        try {
            const saveResult = await storageService.saveGame(slug, dataToSave);

            // Try to fetch cover image
            try {
                await imagesService.fetchAndStoreCover(submission.title, slug);
            } catch (imageError) {
                console.log('[AdminReviews] Image fetch failed (non-fatal):', imageError.message);
            }

            // Mark submission as completed
            await queueService.markCompleted(id, {
                gameSlug: slug,
                confidenceScore: 1.0 // Admin approved
            });

            res.json({
                success: true,
                slug: saveResult.slug,
                message: 'Game approved and saved successfully'
            });

        } catch (saveError) {
            if (saveError.message.includes('already exists')) {
                // Game already exists, mark as completed
                await queueService.markCompleted(id, {
                    gameSlug: slug,
                    confidenceScore: 1.0
                });
                res.json({
                    success: true,
                    slug,
                    message: 'Game already exists in library'
                });
            } else {
                throw saveError;
            }
        }

    } catch (error) {
        console.error('[AdminReviews] Error approving submission:', error.message);
        res.status(500).json({ error: 'Failed to approve submission' });
    }
});

/**
 * POST /api/admin/pending-reviews/:id/reject
 * Reject a submission and mark it as failed
 */
router.post('/pending-reviews/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const submissions = await queueService.getSubmissionsNeedingReview();
        const submission = submissions.find(s => s.id === id);

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Mark as failed with rejection reason
        await queueService.markFailed(
            id,
            reason || 'Rejected by administrator during review'
        );

        res.json({
            success: true,
            message: 'Submission rejected successfully'
        });

    } catch (error) {
        console.error('[AdminReviews] Error rejecting submission:', error.message);
        res.status(500).json({ error: 'Failed to reject submission' });
    }
});

/**
 * POST /api/admin/pending-reviews/:id/save-draft
 * Save draft data for a submission without approving
 */
router.post('/pending-reviews/:id/save-draft', async (req, res) => {
    try {
        const { id } = req.params;
        const { gameData } = req.body;

        if (!gameData) {
            return res.status(400).json({ error: 'No game data provided' });
        }

        // Ensure submissions directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const submissionsDir = path.join(__dirname, '../../../submissions');
        const draftDir = path.join(submissionsDir, id);

        try {
            await fs.access(draftDir);
        } catch {
            await fs.mkdir(draftDir, { recursive: true });
        }

        // Save draft
        const draftPath = path.join(draftDir, 'draft.json');
        await fs.writeFile(draftPath, JSON.stringify(gameData, null, 2), 'utf8');

        // Update submission to include draft path in processorStatus
        const index = await queueService._loadSubmissionsIndex();
        const submission = index.submissions.find(s => s.id === id);
        if (submission) {
            if (!submission.processorStatus) {
                submission.processorStatus = {};
            }
            submission.processorStatus.draftPath = draftPath;
            await queueService._saveSubmissionsIndex(index);
        }

        res.json({
            success: true,
            draftPath,
            message: 'Draft saved successfully'
        });

    } catch (error) {
        console.error('[AdminReviews] Error saving draft:', error.message);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

/**
 * GET /api/admin/failed-submissions
 * Returns list of failed submissions for review
 */
router.get('/failed-submissions', async (req, res) => {
    try {
        const submissions = await queueService.getFailedSubmissions();

        res.json({
            count: submissions.length,
            submissions: submissions.map(s => ({
                id: s.id,
                title: s.title,
                submittedAt: s.submittedAt,
                failureReason: s.processorStatus?.failureReason,
                failedAt: s.processorStatus?.failedAt,
                attemptCount: s.processorStatus?.attemptCount,
                skipUntil: s.processorStatus?.skipUntil
            }))
        });

    } catch (error) {
        console.error('[AdminReviews] Error fetching failed submissions:', error.message);
        res.status(500).json({ error: 'Failed to fetch failed submissions' });
    }
});

/**
 * POST /api/admin/failed-submissions/:id/retry
 * Retry a failed submission
 */
router.post('/failed-submissions/:id/retry', async (req, res) => {
    try {
        const { id } = req.params;

        await queueService.retrySubmission(id);

        res.json({
            success: true,
            message: 'Submission queued for retry'
        });

    } catch (error) {
        console.error('[AdminReviews] Error retrying submission:', error.message);
        res.status(500).json({ error: 'Failed to retry submission' });
    }
});

module.exports = { router: router };
