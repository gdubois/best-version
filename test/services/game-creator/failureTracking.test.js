/**
 * Failure Tracking Service Tests
 *
 * Tests for failure recovery and dead letter queue functionality.
 * GC-4.4: Failure Recovery and Dead Letter Queue
 */

const failureService = require('../../../src/services/game-creator/failureTracking');

const {
    getFailureDetails,
    getAllFailures,
    getFailuresByReason,
    retryFailedSubmission,
    markPermanentlyFailed,
    checkAutoRetryEligible,
    processAutoRetry,
    getFailureStats,
    categorizeFailureReason,
    FailureReasons,
    CONFIG
} = failureService;

// Mock queueService
jest.mock('../../../src/services/game-creator/queueService', () => ({
    getFailedSubmissions: jest.fn(),
    retrySubmission: jest.fn(),
    _loadSubmissionsIndex: jest.fn(),
    _saveSubmissionsIndex: jest.fn()
}));

const queueService = require('../../../src/services/game-creator/queueService');

describe('Failure Tracking Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CONFIG', () => {
        it('should have correct default configuration', () => {
            expect(CONFIG.autoRetryEnabled).toBe(true);
            expect(CONFIG.autoRetryCooldown).toBe(24 * 60 * 60 * 1000); // 24 hours
            expect(CONFIG.maxRetryAttempts).toBe(3);
        });
    });

    describe('FailureReasons', () => {
        it('should have all expected failure categories', () => {
            expect(FailureReasons.VERIFICATION_FAILED).toBe('verification_failed');
            expect(FailureReasons.VALIDATION_FAILED).toBe('validation_failed');
            expect(FailureReasons.PROCESSING_ERROR).toBe('processing_error');
            expect(FailureReasons.API_ERROR).toBe('api_error');
            expect(FailureReasons.RATE_LIMITED).toBe('rate_limited');
            expect(FailureReasons.TIMEOUT).toBe('timeout');
            expect(FailureReasons.REJECTED).toBe('rejected');
            expect(FailureReasons.UNKNOWN).toBe('unknown');
        });
    });

    describe('categorizeFailureReason', () => {
        it('should categorize verification failures', () => {
            expect(categorizeFailureReason('verification failed - low confidence')).toBe(FailureReasons.VERIFICATION_FAILED);
            expect(categorizeFailureReason('Game verification failed')).toBe(FailureReasons.VERIFICATION_FAILED);
        });

        it('should categorize validation failures', () => {
            expect(categorizeFailureReason('validation failed - missing fields')).toBe(FailureReasons.VALIDATION_FAILED);
            expect(categorizeFailureReason('Validation error')).toBe(FailureReasons.VALIDATION_FAILED);
        });

        it('should categorize rate limit errors', () => {
            expect(categorizeFailureReason('rate limit exceeded')).toBe(FailureReasons.RATE_LIMITED);
            expect(categorizeFailureReason('API rate limited')).toBe(FailureReasons.RATE_LIMITED);
        });

        it('should categorize timeouts', () => {
            expect(categorizeFailureReason('request timeout')).toBe(FailureReasons.TIMEOUT);
            expect(categorizeFailureReason('timed out waiting for response')).toBe(FailureReasons.TIMEOUT);
        });

        it('should categorize rejections', () => {
            expect(categorizeFailureReason('rejected by administrator')).toBe(FailureReasons.REJECTED);
            expect(categorizeFailureReason('Submission rejected')).toBe(FailureReasons.REJECTED);
        });

        it('should categorize API errors', () => {
            expect(categorizeFailureReason('HTTP 500 error')).toBe(FailureReasons.API_ERROR);
            expect(categorizeFailureReason('API connection failed')).toBe(FailureReasons.API_ERROR);
        });

        it('should default to processing error for unknown reasons', () => {
            expect(categorizeFailureReason('some random error')).toBe(FailureReasons.PROCESSING_ERROR);
            expect(categorizeFailureReason('')).toBe(FailureReasons.UNKNOWN);
            expect(categorizeFailureReason(null)).toBe(FailureReasons.UNKNOWN);
        });
    });

    describe('getFailureDetails', () => {
        it('should return null for non-existent submission', async () => {
            queueService.getFailedSubmissions.mockResolvedValue([]);

            const result = await getFailureDetails('nonexistent-id');

            expect(result).toBeNull();
        });

        it('should return failure details for existing submission', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Test Game',
                submittedAt: '2026-04-10T10:00:00Z',
                status: 'failed',
                processorStatus: {
                    failureReason: 'API error occurred',
                    failedAt: '2026-04-10T11:00:00Z',
                    lastAttempt: '2026-04-10T11:00:00Z',
                    attemptCount: 2,
                    confidenceScore: 0.5
                }
            };

            queueService.getFailedSubmissions.mockResolvedValue([mockSubmission]);

            const result = await getFailureDetails('sub-001');

            expect(result).toBeDefined();
            expect(result.submissionId).toBe('sub-001');
            expect(result.title).toBe('Test Game');
            expect(result.failureReason).toBe(FailureReasons.API_ERROR);
            expect(result.attemptCount).toBe(2);
            expect(result.metadata.confidenceScore).toBe(0.5);
        });

        it('should calculate canAutoRetry correctly', async () => {
            const now = Date.now();
            const pastSkipUntil = new Date(now - 1000).toISOString(); // 1 second ago

            const mockSubmission = {
                id: 'sub-001',
                title: 'Test Game',
                submittedAt: '2026-04-10T10:00:00Z',
                status: 'failed',
                processorStatus: {
                    failureReason: 'Test error',
                    skipUntil: pastSkipUntil
                }
            };

            queueService.getFailedSubmissions.mockResolvedValue([mockSubmission]);

            const result = await getFailureDetails('sub-001');

            expect(result.canAutoRetry).toBe(true);
            expect(result.timeUntilRetryMs).toBe(0);
        });
    });

    describe('getAllFailures', () => {
        it('should return all failed submissions with details', async () => {
            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Game One',
                    submittedAt: '2026-04-10T10:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'API error' }
                },
                {
                    id: 'sub-002',
                    title: 'Game Two',
                    submittedAt: '2026-04-10T11:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'Validation failed' }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);

            const result = await getAllFailures();

            expect(result).toHaveLength(2);
            expect(result[0].submissionId).toBe('sub-001');
            expect(result[1].submissionId).toBe('sub-002');
        });

        it('should return empty array when no failures', async () => {
            queueService.getFailedSubmissions.mockResolvedValue([]);

            const result = await getAllFailures();

            expect(result).toHaveLength(0);
        });
    });

    describe('getFailuresByReason', () => {
        it('should filter failures by reason', async () => {
            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Game One',
                    submittedAt: '2026-04-10T10:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'API error occurred' }
                },
                {
                    id: 'sub-002',
                    title: 'Game Two',
                    submittedAt: '2026-04-10T11:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'Validation failed' }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);

            const result = await getFailuresByReason(FailureReasons.API_ERROR);

            expect(result).toHaveLength(1);
            expect(result[0].submissionId).toBe('sub-001');
        });
    });

    describe('retryFailedSubmission', () => {
        it('should retry a failed submission', async () => {
            queueService.retrySubmission.mockResolvedValue();

            const result = await retryFailedSubmission('sub-001');

            expect(result.success).toBe(true);
            expect(result.submissionId).toBe('sub-001');
            expect(queueService.retrySubmission).toHaveBeenCalledWith('sub-001');
        });

        it('should handle retry errors gracefully', async () => {
            queueService.retrySubmission.mockRejectedValue(new Error('Submission not found'));

            const result = await retryFailedSubmission('nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Submission not found');
        });
    });

    describe('markPermanentlyFailed', () => {
        it('should mark submission as permanently failed', async () => {
            const mockIndex = {
                submissions: [{
                    id: 'sub-001',
                    title: 'Test Game',
                    status: 'failed',
                    processorStatus: { failureReason: 'Original error' }
                }]
            };

            queueService.loadSubmissionsIndex.mockResolvedValue(mockIndex);
            queueService.saveSubmissionsIndex.mockResolvedValue();

            await markPermanentlyFailed('sub-001', 'User marked as permanently failed');

            expect(queueService.saveSubmissionsIndex).toHaveBeenCalledWith(mockIndex);
            expect(mockIndex.submissions[0].processorStatus.permanent).toBe(true);
            expect(mockIndex.submissions[0].processorStatus.failureReason).toBe('User marked as permanently failed');
        });

        it('should throw error for non-existent submission', async () => {
            queueService.loadSubmissionsIndex.mockResolvedValue({ submissions: [] });

            await expect(markPermanentlyFailed('nonexistent', 'error')).rejects.toThrow('not found');
        });
    });

    describe('checkAutoRetryEligible', () => {
        it('should return submissions eligible for auto-retry', async () => {
            const now = Date.now();
            const pastSkipUntil = new Date(now - 1000).toISOString();
            const futureSkipUntil = new Date(now + 3600000).toISOString();

            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Game One',
                    status: 'failed',
                    processorStatus: {
                        failureReason: 'API error',
                        skipUntil: pastSkipUntil,
                        permanent: false
                    }
                },
                {
                    id: 'sub-002',
                    title: 'Game Two',
                    status: 'failed',
                    processorStatus: {
                        failureReason: 'API error',
                        skipUntil: futureSkipUntil,
                        permanent: false
                    }
                },
                {
                    id: 'sub-003',
                    title: 'Game Three',
                    status: 'failed',
                    processorStatus: {
                        failureReason: 'User rejected',
                        permanent: true
                    }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);

            const result = await checkAutoRetryEligible();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('sub-001');
        });

        it('should exclude permanently failed submissions', async () => {
            const mockSubmissions = [{
                id: 'sub-001',
                title: 'Test Game',
                status: 'failed',
                processorStatus: {
                    failureReason: 'Error',
                    permanent: true
                }
            }];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);

            const result = await checkAutoRetryEligible();

            expect(result).toHaveLength(0);
        });
    });

    describe('processAutoRetry', () => {
        it('should process auto-retry for eligible submissions', async () => {
            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Game One',
                    status: 'failed',
                    processorStatus: {
                        failureReason: 'API error',
                        skipUntil: new Date(Date.now() - 1000).toISOString()
                    }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);
            queueService.retrySubmission.mockResolvedValue();

            const results = await processAutoRetry();

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(queueService.retrySubmission).toHaveBeenCalledWith('sub-001');
        });

        it('should return empty array when auto-retry is disabled', async () => {
            // Temporarily disable auto-retry
            const originalEnabled = CONFIG.autoRetryEnabled;
            CONFIG.autoRetryEnabled = false;

            const results = await processAutoRetry();

            expect(results).toHaveLength(0);

            // Restore
            CONFIG.autoRetryEnabled = originalEnabled;
        });

        it('should handle concurrent processing with limits', async () => {
            const mockSubmissions = [
                { id: 'sub-001', title: 'G1', status: 'failed', processorStatus: { failureReason: 'E', skipUntil: new Date(Date.now() - 1000).toISOString() } },
                { id: 'sub-002', title: 'G2', status: 'failed', processorStatus: { failureReason: 'E', skipUntil: new Date(Date.now() - 1000).toISOString() } },
                { id: 'sub-003', title: 'G3', status: 'failed', processorStatus: { failureReason: 'E', skipUntil: new Date(Date.now() - 1000).toISOString() } }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);
            queueService.retrySubmission.mockResolvedValue();

            const results = await processAutoRetry(2); // Max 2 concurrent

            expect(results).toHaveLength(3);
            expect(results.filter(r => r.success).length).toBe(3);
        });
    });

    describe('getFailureStats', () => {
        it('should return failure statistics', async () => {
            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Game One',
                    submittedAt: '2026-04-10T10:00:00Z',
                    failedAt: '2026-04-10T11:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'API error', skipUntil: null }
                },
                {
                    id: 'sub-002',
                    title: 'Game Two',
                    submittedAt: '2026-04-10T11:00:00Z',
                    failedAt: '2026-04-10T12:00:00Z',
                    status: 'failed',
                    processorStatus: { failureReason: 'Validation failed', skipUntil: new Date(Date.now() + 10000).toISOString() }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockSubmissions);

            const stats = await getFailureStats();

            expect(stats.totalFailures).toBe(2);
            expect(stats.byReason).toHaveProperty('api_error', 1);
            expect(stats.byReason).toHaveProperty('validation_failed', 1);
            expect(stats.categories).toHaveLength(Object.keys(FailureReasons).length);
        });
    });
});
