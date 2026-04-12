/**
 * Admin Reviews API Tests
 */

// Mock dependencies
jest.mock('../../../src/services/game-creator/queueService', () => ({
    getSubmissionsNeedingReview: jest.fn(),
    getFailedSubmissions: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn(),
    retrySubmission: jest.fn()
}));

jest.mock('../../../src/services/game-creator/storage', () => ({
    saveGame: jest.fn()
}));

jest.mock('../../../src/services/game-creator/images', () => ({
    fetchAndStoreCover: jest.fn()
}));

jest.mock('../../../src/middleware/adminAuth', () => ({
    adminAuth: {
        requireAdmin: (req, res, next) => next()
    }
}));

const express = require('express');
const request = require('supertest');
const { router: reviewsRouter } = require('../../../src/api/admin/reviews');

const app = express();
app.use(express.json());
app.use('/', reviewsRouter);

const queueService = require('../../../src/services/game-creator/queueService');
const storageService = require('../../../src/services/game-creator/storage');
const imagesService = require('../../../src/services/game-creator/images');

describe('Admin Reviews API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/pending-reviews', () => {
        it('should return list of pending reviews', async () => {
            const mockSubmissions = [
                {
                    id: 'sub-001',
                    title: 'Test Game',
                    submittedAt: '2026-04-10T10:00:00Z',
                    processorStatus: {
                        needsReviewAt: '2026-04-10T11:00:00Z',
                        confidenceScore: 0.65,
                        issues: ['missing_platforms'],
                        draftPath: null
                    }
                }
            ];

            queueService.getSubmissionsNeedingReview.mockResolvedValue(mockSubmissions);

            const response = await request(app)
                .get('/pending-reviews')
                .expect(200);

            expect(response.body.count).toBe(1);
            expect(response.body.submissions).toHaveLength(1);
            expect(response.body.submissions[0].title).toBe('Test Game');
            expect(response.body.submissions[0].confidenceScore).toBe(0.65);
        });

        it('should return empty list when no pending reviews', async () => {
            queueService.getSubmissionsNeedingReview.mockResolvedValue([]);

            const response = await request(app)
                .get('/pending-reviews')
                .expect(200);

            expect(response.body.count).toBe(0);
            expect(response.body.submissions).toHaveLength(0);
        });
    });

    describe('GET /api/admin/pending-reviews/:id', () => {
        it('should return single submission details', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Test Game',
                submittedAt: '2026-04-10T10:00:00Z',
                processorStatus: {
                    needsReviewAt: '2026-04-10T11:00:00Z',
                    confidenceScore: 0.65,
                    issues: ['missing_platforms']
                }
            };

            queueService.getSubmissionsNeedingReview.mockResolvedValue([mockSubmission]);

            const response = await request(app)
                .get('/pending-reviews/sub-001')
                .expect(200);

            expect(response.body.id).toBe('sub-001');
            expect(response.body.title).toBe('Test Game');
        });

        it('should return 404 when submission not found', async () => {
            queueService.getSubmissionsNeedingReview.mockResolvedValue([]);

            const response = await request(app)
                .get('/pending-reviews/nonexistent')
                .expect(404);

            expect(response.body.error).toBe('Submission not found');
        });
    });

    describe('POST /api/admin/pending-reviews/:id/approve', () => {
        it('should approve submission and save game', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Test Game'
            };

            queueService.getSubmissionsNeedingReview.mockResolvedValue([mockSubmission]);
            storageService.saveGame.mockResolvedValue({
                slug: '/games/test-game',
                filePath: './games/test-game.json',
                title: 'Test Game'
            });
            imagesService.fetchAndStoreCover.mockResolvedValue({ success: true, found: true });

            const response = await request(app)
                .post('/pending-reviews/sub-001/approve')
                .send({
                    gameData: {
                        basic_info: {
                            title: 'Test Game',
                            url_slug: '/games/test-game',
                            genres: ['RPG'],
                            modes: { single_player: true },
                            developers: ['Dev'],
                            publishers: ['Pub']
                        },
                        release: {
                            platforms: [{ name: 'PC', region: 'World', release_date: '2020-01-01' }]
                        },
                        description: {
                            synopsis: 'Synopsis',
                            long_description: 'Description'
                        }
                    }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.slug).toBe('/games/test-game');
            expect(storageService.saveGame).toHaveBeenCalled();
            expect(queueService.markCompleted).toHaveBeenCalled();
        });

        it('should return 404 when submission not found', async () => {
            queueService.getSubmissionsNeedingReview.mockResolvedValue([]);

            const response = await request(app)
                .post('/pending-reviews/nonexistent/approve')
                .send({ gameData: {} })
                .expect(404);

            expect(response.body.error).toBe('Submission not found');
        });

        it('should handle game already exists gracefully', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Existing Game' };
            queueService.getSubmissionsNeedingReview.mockResolvedValue([mockSubmission]);

            storageService.saveGame.mockRejectedValue(
                new Error('Game file already exists: /games/existing-game')
            );

            const response = await request(app)
                .post('/pending-reviews/sub-001/approve')
                .send({
                    gameData: {
                        basic_info: { title: 'Existing Game', url_slug: '/games/existing-game' },
                        release: { platforms: [] },
                        description: { synopsis: 'S', long_description: 'L' }
                    }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(queueService.markCompleted).toHaveBeenCalled();
        });
    });

    describe('POST /api/admin/pending-reviews/:id/reject', () => {
        it('should reject submission', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Test Game' };
            queueService.getSubmissionsNeedingReview.mockResolvedValue([mockSubmission]);

            const response = await request(app)
                .post('/pending-reviews/sub-001/reject')
                .send({ reason: 'Invalid data' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(queueService.markFailed).toHaveBeenCalledWith(
                'sub-001',
                'Invalid data'
            );
        });
    });

    describe('GET /api/admin/failed-submissions', () => {
        it('should return list of failed submissions', async () => {
            const mockFailed = [
                {
                    id: 'sub-001',
                    title: 'Failed Game',
                    submittedAt: '2026-04-10T10:00:00Z',
                    processorStatus: {
                        failureReason: 'API error',
                        failedAt: '2026-04-10T11:00:00Z',
                        attemptCount: 2
                    }
                }
            ];

            queueService.getFailedSubmissions.mockResolvedValue(mockFailed);

            const response = await request(app)
                .get('/failed-submissions')
                .expect(200);

            expect(response.body.count).toBe(1);
            expect(response.body.submissions[0].title).toBe('Failed Game');
            expect(response.body.submissions[0].failureReason).toBe('API error');
        });
    });

    describe('POST /api/admin/failed-submissions/:id/retry', () => {
        it('should retry a failed submission', async () => {
            queueService.retrySubmission.mockResolvedValue();

            const response = await request(app)
                .post('/failed-submissions/sub-001/retry')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(queueService.retrySubmission).toHaveBeenCalledWith('sub-001');
        });
    });
});