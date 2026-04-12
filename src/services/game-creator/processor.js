/**
 * Game Creator Processor Service
 *
 * Orchestrates the complete game creation pipeline:
 * 1. Fetch next pending submission from queue
 * 2. Research the game using web search
 * 3. Validate generated metadata
 * 4. Assemble and store the game data
 *
 * @module services/game-creator/processor
 */

const queueService = require('./queueService');
const researchService = require('./research');
const validationService = require('./validation');
const storageService = require('./storage');
const imagesService = require('./images');
const { createLogger } = require('./logger');
const {
    recordProcessingComplete,
    startTrackingProcessing,
    recordApiResponse,
    endTrackingProcessing
} = require('./metrics');
const { sendApprovalNotification } = require('./notifications');

/**
 * Logger instance for processor component
 * @private
 */
const logger = createLogger('processor', { redactApiKey: true });

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
 * Process a single game submission
 * @param {Object} submission - The submission to process
 * @returns {Promise<Object>}
 */
async function processSubmission(submission) {
    const { id, title } = submission;
    const startTime = Date.now();

    // Start metrics tracking
    startTrackingProcessing(id, title);

    log(`Starting processing for submission: ${id} - "${title}"`, 'info');

    try {
        // Step 1: Research the game using agent-powered research (with web search)
        log(`Step 1: Researching game "${title}" (Agent + Web Search)`, 'info');
        const researchStart = Date.now();
        const researchResult = await researchService.researchGameWithAgent(title);
        const researchTime = Date.now() - researchStart;

        // Record API response times (if available)
        if (researchResult.apiResponseTimes) {
            if (researchResult.apiResponseTimes.wikipedia) {
                recordApiResponse('wikipedia', researchResult.apiResponseTimes.wikipedia);
            }
        }

        if (researchResult.error) {
            throw new Error(`Research failed: ${researchResult.error}`);
        }

        log(`Research completed`, 'info', {
            confidence: researchResult.confidence,
            time: researchTime
        });

        // Step 2: Verify game exists (from research confidence)
        if (researchResult.confidence < 0.3) {
            log(`Game verification failed - confidence too low`, 'warn', {
                confidence: researchResult.confidence
            });

            await queueService.markFailed(id, 'Game verification failed - low confidence score', {
                skipUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Retry in 24h
            });

            return {
                success: false,
                submissionId: id,
                reason: 'verification_failed',
                confidence: researchResult.confidence
            };
        }

        // Step 3: Assemble game data
        log(`Step 2: Assembling game data`, 'info');
        const { slug, data: gameData } = storageService.assembleGameData(researchResult);

        // Step 4: Validate metadata
        log(`Step 3: Validating metadata`, 'info');
        const validationResult = validationService.validateMetadata(gameData);

        log(`Validation completed`, 'info', {
            confidence: validationResult.confidenceScore,
            recommendation: validationResult.recommendation,
            issues: validationResult.issues.length
        });

        // Step 5: Handle based on validation result
        if (validationResult.recommendation === 'approve') {
            // Auto-approve and save
            log(`Auto-approving and saving game`, 'info');
            const saveResult = await storageService.saveGame(slug, gameData);

            // Step 6: Fetch and store cover image
            log(`Step 4: Fetching cover image`, 'info');
            const imageResult = await imagesService.fetchAndStoreCover(title, slug);

            const processingTime = Date.now() - startTime;

            // Record metrics
            const entry = endTrackingProcessing('auto_approved', validationResult.confidenceScore, {});
            if (entry) {
                recordProcessingComplete(entry);
            }

            await queueService.markCompleted(id, {
                gameSlug: slug,
                confidenceScore: validationResult.confidenceScore
            });

            // Send approval notification
            try {
                await sendApprovalNotification({
                    userEmail: submission.email,
                    gameTitle: title,
                    gameSlug: slug
                });
            } catch (notifyError) {
                log(`Notification failed (non-critical): ${notifyError.message}`, 'warn');
            }

            log(`Game processed and saved successfully`, 'info', {
                slug,
                confidence: validationResult.confidenceScore,
                imageFound: imageResult.found,
                totalTime: processingTime
            });

            return {
                success: true,
                submissionId: id,
                slug: saveResult.slug,
                title: saveResult.title,
                confidence: validationResult.confidenceScore,
                imageFound: imageResult.found,
                processingTime
            };

        } else if (validationResult.recommendation === 'review') {
            // Needs manual review
            const processingTime = Date.now() - startTime;

            // Record metrics
            const entry = endTrackingProcessing('needs_review', validationResult.confidenceScore,
                validationResult.issues.reduce((acc, i) => {
                    acc[i.field] = (acc[i.field] || 0) + 1;
                    return acc;
                }, {})
            );
            if (entry) {
                recordProcessingComplete(entry);
            }

            log(`Marking for manual review`, 'info');

            await queueService.markForReview(id, {
                confidenceScore: validationResult.confidenceScore,
                issues: validationResult.issues,
                draftData: gameData
            });

            log(`Game marked for review`, 'info', {
                issues: validationResult.issues.length,
                confidence: validationResult.confidenceScore,
                totalTime: processingTime
            });

            return {
                success: false,
                submissionId: id,
                reason: 'needs_review',
                confidence: validationResult.confidenceScore,
                issues: validationResult.issues.length,
                processingTime
            };

        } else {
            // Reject - too low quality
            const processingTime = Date.now() - startTime;

            // Record metrics
            const entry = endTrackingProcessing('failed', validationResult.confidenceScore, {});
            if (entry) {
                recordProcessingComplete(entry);
            }

            log(`Rejecting submission - too low quality`, 'warn');

            await queueService.markFailed(id, `Validation failed - confidence ${validationResult.confidenceScore.toFixed(2)} below threshold`, {
                skipUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            return {
                success: false,
                submissionId: id,
                reason: 'validation_failed',
                confidence: validationResult.confidenceScore,
                issues: validationResult.details?.missingFields || validationResult.issues.length,
                processingTime
            };
        }

    } catch (error) {
        const processingTime = Date.now() - startTime;

        // Record metrics for failure
        const entry = endTrackingProcessing('failed', 0, {});
        if (entry) {
            recordProcessingComplete(entry);
        }

        log(`Processing failed: ${error.message}`, 'error', {
            error: error.message,
            totalTime: processingTime
        });

        await queueService.markFailed(id, error.message);

        return {
            success: false,
            submissionId: id,
            reason: 'processing_error',
            error: error.message,
            processingTime
        };
    } finally {
        // Clean up tracking
        endTrackingProcessing('complete', 0, {});
    }
}

/**
 * Run the complete processing pipeline for one game
 * @returns {Promise<Object>}
 */
async function run() {
    log('=== Starting Game Creator Processing Run ===', 'info');

    try {
        // Get next pending submission
        const submission = await queueService.getNextPendingSubmission();

        if (!submission) {
            log('No pending submissions to process', 'info');
            return {
                processed: false,
                reason: 'no_pending_submissions'
            };
        }

        // Mark as in progress
        const marked = await queueService.markInProgress(submission.id);
        if (!marked) {
            log(`Failed to mark submission as in progress`, 'error');
            return {
                processed: false,
                reason: 'failed_to_mark_in_progress'
            };
        }

        // Process the submission
        const result = await processSubmission(submission);

        log('=== Processing Run Complete ===', 'info', result);

        return result;

    } catch (error) {
        log(`Processing run failed: ${error.message}`, 'error');

        return {
            processed: false,
            reason: 'run_error',
            error: error.message
        };
    }
}

/**
 * Process all pending submissions (for batch processing)
 * @param {number} maxGames - Maximum number of games to process (default: 1)
 * @returns {Promise<Array>}
 */
async function runBatch(maxGames = 1) {
    log(`Starting batch processing (max ${maxGames} games)`, 'info');

    const results = [];
    let processed = 0;

    while (processed < maxGames) {
        const result = await run();

        if (result.reason === 'no_pending_submissions') {
            break;
        }

        results.push(result);
        processed++;

        // Small delay between games to avoid rate limits
        if (processed < maxGames) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    log(`Batch processing complete: ${results.length} games processed`, 'info');

    return results;
}

module.exports = {
    processSubmission,
    run,
    runBatch
};
