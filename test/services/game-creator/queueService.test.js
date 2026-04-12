/**
 * Queue Service Tests
 *
 * Tests for the Game Submission Queue Service
 */

// Mock proper-lockfile before importing the service
jest.mock('proper-lockfile', () => ({
    lock: jest.fn().mockResolvedValue(() => {})
}));

// Mock fs module (source uses require('fs').promises)
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn().mockResolvedValue(),
        access: jest.fn().mockResolvedValue(),
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

// Import after mocking
const queueService = require('../../../src/services/game-creator/queueService');
const fs = require('fs').promises;

describe('Queue Service', () => {
    const mockSubmissionsIndex = {
        submissions: [
            {
                id: 'sub-001',
                title: 'Final Fantasy VII',
                status: 'pending',
                submittedAt: '2026-04-01T10:00:00Z'
            },
            {
                id: 'sub-002',
                title: 'Chrono Trigger',
                status: 'pending',
                submittedAt: '2026-04-02T10:00:00Z'
            },
            {
                id: 'sub-003',
                title: 'Already Exists Game',
                status: 'pending',
                submittedAt: '2026-04-03T10:00:00Z'
            },
            {
                id: 'sub-004',
                title: 'Completed Game',
                status: 'completed',
                submittedAt: '2026-04-04T10:00:00Z'
            },
            {
                id: 'sub-005',
                title: 'Failed Game',
                status: 'failed',
                submittedAt: '2026-04-05T10:00:00Z'
            },
            {
                id: 'sub-006',
                title: 'Needs Review Game',
                status: 'needs_review',
                submittedAt: '2026-04-06T10:00:00Z',
                processorStatus: {
                    needsReviewAt: '2026-04-06T12:00:00Z',
                    confidenceScore: 0.65,
                    issues: ['missing_platforms']
                }
            }
        ]
    };

    const mockGamesIndex = {
        games: [
            {
                title: 'Already Exists Game',
                slug: 'already-exists-game',
                alternativeNames: []
            }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        fs.readFile.mockReset();
        fs.writeFile.mockReset();
        fs.access.mockReset();
        fs.mkdir.mockResolvedValue();
        fs.access.mockResolvedValue();
        // Reset queue state between tests
        queueService.queueState.inProgress = new Map();
        queueService.queueState.processed = new Set();
    });

    describe('getNextPendingSubmission', () => {
        it('should return the first pending submission', async () => {
            // First read: submissions index, then games index for each pending submission check
            fs.readFile
                .mockResolvedValueOnce(JSON.stringify(mockSubmissionsIndex))
                .mockResolvedValueOnce(JSON.stringify(mockGamesIndex));

            const result = await queueService.getNextPendingSubmission();

            expect(result.id).toBe('sub-001');
            expect(result.title).toBe('Final Fantasy VII');
        });

        it('should skip submissions that are not pending', async () => {
            const indexWithoutFirst = {
                ...mockSubmissionsIndex,
                submissions: mockSubmissionsIndex.submissions.slice(1)
            };

            // Read submissions, then games for sub-002 check
            fs.readFile
                .mockResolvedValueOnce(JSON.stringify(indexWithoutFirst))
                .mockResolvedValueOnce(JSON.stringify(mockGamesIndex));

            const result = await queueService.getNextPendingSubmission();

            // Should skip sub-003 (exists in games), sub-004 (completed), sub-005 (failed), sub-006 (needs_review)
            expect(result.id).toBe('sub-002');
            expect(result.title).toBe('Chrono Trigger');
        });

        it('should skip games that already exist in the library', async () => {
            const indexWithExistingGame = {
                ...mockSubmissionsIndex,
                submissions: [mockSubmissionsIndex.submissions.find(s => s.id === 'sub-003')]
            };

            // Read submissions, then games for sub-003 check, then submissions again for update
            fs.readFile
                .mockResolvedValueOnce(JSON.stringify(indexWithExistingGame))
                .mockResolvedValueOnce(JSON.stringify(mockGamesIndex))
                .mockResolvedValueOnce(JSON.stringify(indexWithExistingGame));

            const result = await queueService.getNextPendingSubmission();

            expect(result).toBeNull();
            // Should have marked the submission as completed
            expect(fs.writeFile).toHaveBeenCalled();
        });

        it('should return null when no pending submissions exist', async () => {
            const emptyIndex = { submissions: [] };

            fs.readFile.mockResolvedValueOnce(JSON.stringify(emptyIndex));

            const result = await queueService.getNextPendingSubmission();

            expect(result).toBeNull();
        });

        it('should handle missing submissions index file', async () => {
            fs.readFile.mockRejectedValueOnce({ code: 'ENOENT' });

            const result = await queueService.getNextPendingSubmission();

            expect(result).toBeNull();
        });
    });

     describe('markInProgress', () => {
        it('should mark a submission as in progress', async () => {
            const mockData = JSON.stringify(mockSubmissionsIndex);
            fs.readFile.mockResolvedValue(mockData);

            const result = await queueService.markInProgress('sub-001');

            expect(result).toBe(true);
            // JSON.stringify uses pretty-print by default (2 spaces), so check for the status in the pretty output
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('"status": "in_progress"'),
                'utf8'
            );
        });

        it('should return false if submission is already in progress', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));
            // First call marks it in progress
            const result1 = await queueService.markInProgress('sub-001');
            expect(result1).toBe(true);

            // Second call should fail (in-memory state check)
            const result2 = await queueService.markInProgress('sub-001');
            expect(result2).toBe(false);
        });

        it('should throw error if submission not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify({ submissions: [] }));

            await expect(queueService.markInProgress('nonexistent')).rejects.toThrow('not found');
        });
    });

    describe('markCompleted', () => {
        it('should mark a submission as completed', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await queueService.markCompleted('sub-001', {
                gameSlug: '/games/final-fantasy-vii',
                confidenceScore: 0.95
            });

            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('"status": "completed"'),
                'utf8'
            );
        });

        it('should store game slug and confidence score', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await queueService.markCompleted('sub-001', {
                gameSlug: '/games/test-game',
                confidenceScore: 0.88
            });

            const writeCall = fs.writeFile.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1]);
            const submission = writtenData.submissions.find(s => s.id === 'sub-001');

            expect(submission.processorStatus.gameSlug).toBe('/games/test-game');
            expect(submission.processorStatus.confidenceScore).toBe(0.88);
        });
    });

    describe('markFailed', () => {
        it('should mark a submission as failed with reason', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await queueService.markFailed('sub-001', 'Game not found in search results');

            expect(fs.writeFile).toHaveBeenCalled();

            const writeCall = fs.writeFile.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1]);
            const submission = writtenData.submissions.find(s => s.id === 'sub-001');

            expect(submission.status).toBe('failed');
            expect(submission.processorStatus.failureReason).toBe('Game not found in search results');
        });

        it('should support skipUntil for retry scheduling', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            const skipUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

            await queueService.markFailed('sub-001', 'API rate limit', {
                skipUntil
            });

            const writeCall = fs.writeFile.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1]);
            const submission = writtenData.submissions.find(s => s.id === 'sub-001');

            expect(submission.processorStatus.skipUntil).toBe(skipUntil);
        });
    });

    describe('markForReview', () => {
        it('should mark a submission for review', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await queueService.markForReview('sub-001', {
                confidenceScore: 0.65,
                issues: ['missing_platforms', 'incomplete_description'],
                draftPath: './submissions/sub-001/draft.json'
            });

            const writeCall = fs.writeFile.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1]);
            const submission = writtenData.submissions.find(s => s.id === 'sub-001');

            expect(submission.status).toBe('needs_review');
            expect(submission.processorStatus.confidenceScore).toBe(0.65);
            expect(submission.processorStatus.issues).toEqual(['missing_platforms', 'incomplete_description']);
            expect(submission.processorStatus.draftPath).toBe('./submissions/sub-001/draft.json');
        });
    });

    describe('getFailedSubmissions', () => {
        it('should return all failed submissions sorted by oldest first', async () => {
            const indexWithMultipleFailed = {
                submissions: [
                    { id: 'sub-005', status: 'failed', submittedAt: '2026-04-05T10:00:00Z', processorStatus: { lastAttempt: '2026-04-06T10:00:00Z' } },
                    { id: 'sub-007', status: 'failed', submittedAt: '2026-04-01T10:00:00Z', processorStatus: { lastAttempt: '2026-04-02T10:00:00Z' } }
                ]
            };

            fs.readFile.mockResolvedValue(JSON.stringify(indexWithMultipleFailed));

            const result = await queueService.getFailedSubmissions();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('sub-007'); // Older lastAttempt
            expect(result[1].id).toBe('sub-005');
        });
    });

    describe('getSubmissionsNeedingReview', () => {
        it('should return all submissions needing review', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            const result = await queueService.getSubmissionsNeedingReview();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('sub-006');
        });
    });

    describe('getQueueStats', () => {
        it('should return accurate queue statistics', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            const stats = await queueService.getQueueStats();

            expect(stats).toEqual({
                total: 6,
                pending: 3,
                inProgress: 0,
                completed: 1,
                failed: 1,
                needsReview: 1
            });
        });
    });

    describe('retrySubmission', () => {
        it('should reset a failed submission to pending', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await queueService.retrySubmission('sub-005');

            const writeCall = fs.writeFile.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1]);
            const submission = writtenData.submissions.find(s => s.id === 'sub-005');

            expect(submission.status).toBe('pending');
            expect(submission.processorStatus.skipUntil).toBeNull();
        });

        it('should throw error if submission is not in failed status', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify(mockSubmissionsIndex));

            await expect(queueService.retrySubmission('sub-001')).rejects.toThrow('not in failed status');
        });

        it('should throw error if submission not found', async () => {
            fs.readFile.mockResolvedValue(JSON.stringify({ submissions: [] }));

            await expect(queueService.retrySubmission('nonexistent')).rejects.toThrow('not found');
        });
    });
});
