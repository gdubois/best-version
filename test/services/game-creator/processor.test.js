/**
 * Processor Service Tests
 */

// Mock dependencies
jest.mock('../../../src/services/game-creator/queueService', () => ({
    getNextPendingSubmission: jest.fn(),
    markInProgress: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn(),
    markForReview: jest.fn()
}));

jest.mock('../../../src/services/game-creator/research', () => ({
    researchGame: jest.fn(),
    researchGameWithAgent: jest.fn()
}));

jest.mock('../../../src/services/game-creator/validation', () => ({
    validateMetadata: jest.fn()
}));

jest.mock('../../../src/services/game-creator/storage', () => ({
    assembleGameData: jest.fn(),
    saveGame: jest.fn()
}));

jest.mock('../../../src/services/game-creator/images', () => ({
    fetchAndStoreCover: jest.fn()
}));

const processor = require('../../../src/services/game-creator/processor');
const queueService = require('../../../src/services/game-creator/queueService');
const researchService = require('../../../src/services/game-creator/research');
const validationService = require('../../../src/services/game-creator/validation');
const storageService = require('../../../src/services/game-creator/storage');
const imagesService = require('../../../src/services/game-creator/images');

describe('Processor Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('run', () => {
        it('should return no_pending_submissions when queue is empty', async () => {
            queueService.getNextPendingSubmission.mockResolvedValue(null);

            const result = await processor.run();

            expect(result.processed).toBe(false);
            expect(result.reason).toBe('no_pending_submissions');
        });

        it('should process a submission successfully', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Final Fantasy VII'
            };

            // Mock research
            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Final Fantasy VII',
                    genres: ['RPG'],
                    platforms: ['PlayStation'],
                    developer: 'Square',
                    publisher: 'Square',
                    description: 'A test RPG game'
                },
                confidence: 0.9,
                sourceUrls: []
            });

            // Mock storage
            storageService.assembleGameData.mockReturnValue({
                slug: '/games/final-fantasy-vii',
                data: {
                    basic_info: { title: 'Final Fantasy VII', url_slug: '/games/final-fantasy-vii' },
                    release: { platforms: [] },
                    description: { synopsis: 'Test', long_description: 'Test' }
                }
            });

            // Mock validation (auto-approve)
            validationService.validateMetadata.mockReturnValue({
                valid: true,
                confidenceScore: 0.9,
                recommendation: 'approve',
                issues: []
            });

            // Mock queue operations
            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);
            storageService.saveGame.mockResolvedValue({
                slug: '/games/final-fantasy-vii',
                title: 'Final Fantasy VII'
            });

            // Mock image fetch
            imagesService.fetchAndStoreCover.mockResolvedValue({
                success: true,
                found: true,
                url: '/images/final-fantasy-vii.jpg'
            });

            const result = await processor.run();

            expect(result.success).toBe(true);
            expect(result.slug).toBe('/games/final-fantasy-vii');
            expect(queueService.markCompleted).toHaveBeenCalled();
        });

        it('should mark for review when validation recommends review', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Test Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Test Game',
                    description: 'A test game'
                },
                confidence: 0.6,
                sourceUrls: []
            });

            storageService.assembleGameData.mockReturnValue({
                slug: '/games/test-game',
                data: {
                    basic_info: { title: 'Test Game', url_slug: '/games/test-game' },
                    release: { platforms: [] },
                    description: { synopsis: 'Test', long_description: 'Test' }
                }
            });

            validationService.validateMetadata.mockReturnValue({
                valid: false,
                confidenceScore: 0.6,
                recommendation: 'review',
                issues: [{ message: 'Missing platforms' }]
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            expect(result.reason).toBe('needs_review');
            expect(queueService.markForReview).toHaveBeenCalled();
        });

        it('should mark as failed when research returns an error', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Unknown Game XYZ' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: false,
                error: 'No search results found',
                confidence: 0.5
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            expect(result.reason).toBe('processing_error');
            expect(queueService.markFailed).toHaveBeenCalled();
        });

        it('should mark as verification_failed when research confidence is too low', async () => {
            const mockSubmission = { id: 'sub-002', title: 'Obscure Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Obscure Game',
                    description: 'Some description'
                },
                confidence: 0.2,
                sourceUrls: []
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            expect(result.reason).toBe('verification_failed');
            expect(queueService.markFailed).toHaveBeenCalled();
        });

        it('should mark as failed when research throws error', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Test Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: false,
                error: 'API rate limit exceeded'
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            expect(queueService.markFailed).toHaveBeenCalled();
        });
    });

    describe('runBatch', () => {
        it('should process multiple submissions', async () => {
            const mockSubmission = { id: 'sub-001', title: 'Test Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Test Game',
                    description: 'A test game'
                },
                confidence: 0.9,
                sourceUrls: []
            });

            storageService.assembleGameData.mockReturnValue({
                slug: '/games/test-game',
                data: {
                    basic_info: { title: 'Test Game', url_slug: '/games/test-game' },
                    release: { platforms: [] },
                    description: { synopsis: 'Test', long_description: 'Test' }
                }
            });

            validationService.validateMetadata.mockReturnValue({
                valid: true,
                confidenceScore: 0.9,
                recommendation: 'approve',
                issues: []
            });

            storageService.saveGame.mockResolvedValue({
                slug: '/games/test-game',
                title: 'Test Game'
            });

            imagesService.fetchAndStoreCover.mockResolvedValue({
                success: true,
                found: true,
                url: '/images/test-game.jpg'
            });

            // First call returns submission, second returns null
            queueService.getNextPendingSubmission
                .mockResolvedValueOnce(mockSubmission)
                .mockResolvedValueOnce(null);

            queueService.markInProgress.mockResolvedValue(true);

            const results = await processor.runBatch(5);

            expect(results).toHaveLength(1);
        });
    });
});
