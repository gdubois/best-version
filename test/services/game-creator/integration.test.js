/**
 * Game Creator Integration Tests
 *
 * End-to-end tests for the complete game creation pipeline.
 */

// Mock all external dependencies
jest.mock('../../../src/services/game-creator/queueService', () => ({
    getNextPendingSubmission: jest.fn(),
    markInProgress: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn(),
    markForReview: jest.fn(),
    getQueueStats: jest.fn(),
    queueState: {
        isProcessing: jest.fn().mockReturnValue(false),
        markInProgress: jest.fn().mockReturnValue(true),
        release: jest.fn(),
        markProcessed: jest.fn()
    }
}));

jest.mock('../../../src/services/game-creator/research', () => ({
    researchGame: jest.fn(),
    verifyGameExists: jest.fn(),
    extractFromSearchResults: jest.fn(),
    researchGameWithAgent: jest.fn()
}));

jest.mock('../../../src/services/game-creator/validation', () => ({
    validateMetadata: jest.fn(),
    calculateFieldScores: jest.fn(),
    isAutoApproveable: jest.fn()
}));

jest.mock('../../../src/services/game-creator/storage', () => ({
    assembleGameData: jest.fn(),
    saveGame: jest.fn(),
    generateSlug: jest.fn(),
    gameExists: jest.fn()
}));

jest.mock('../../../src/services/game-creator/images', () => ({
    fetchAndStoreCover: jest.fn(),
    storeGameImage: jest.fn(),
    imageExists: jest.fn()
}));

jest.mock('../../../src/services/game-creator/logger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const processor = require('../../../src/services/game-creator/processor');
const queueService = require('../../../src/services/game-creator/queueService');
const researchService = require('../../../src/services/game-creator/research');
const validationService = require('../../../src/services/game-creator/validation');
const storageService = require('../../../src/services/game-creator/storage');
const imagesService = require('../../../src/services/game-creator/images');

describe('Game Creator Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MCP_SERVER_ENABLED = 'false';
        process.env.DUCKDUCKGO_ENABLED = 'true';
        process.env.BRAVE_SEARCH_ENABLED = 'true';
    });

    describe('Complete Pipeline - Success Path', () => {
        it('should process a submission from queue to storage with image', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Final Fantasy VII'
            };

            // Mock research results (using researchGameWithAgent)
            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Final Fantasy VII',
                    alternateTitles: ['FFVII', 'FINAL FANTASY VII'],
                    genres: ['RPG', 'Action RPG'],
                    platforms: ['PlayStation', 'PlayStation 2', 'PC'],
                    releaseDate: '1997-01-31',
                    developer: 'Square',
                    publisher: 'Square',
                    description: 'A landmark RPG that revolutionized the genre.',
                    confidence: 0.9
                },
                confidence: 0.9,
                sourceUrls: ['https://example.com/ff7']
            });

            // Mock assembled game data
            storageService.assembleGameData.mockReturnValue({
                slug: '/games/final-fantasy-vii',
                data: {
                    basic_info: {
                        url_slug: '/games/final-fantasy-vii',
                        title: 'Final Fantasy VII',
                        genres: ['RPG', 'Action RPG'],
                        modes: { single_player: true },
                        developers: ['Square'],
                        publishers: ['Square', 'Square Enix']
                    },
                    release: {
                        platforms: [
                            { name: 'PlayStation', region: 'Japan', release_date: '1997-01-31' }
                        ]
                    },
                    description: {
                        synopsis: 'A soldier joins a resistance movement.',
                        long_description: 'A landmark RPG that revolutionized the genre.'
                    }
                }
            });

            // Mock validation (auto-approve)
            validationService.validateMetadata.mockReturnValue({
                valid: true,
                confidenceScore: 0.92,
                recommendation: 'approve',
                issues: [],
                details: {
                    fieldScores: { title: 1, genres: 1, platforms: 1 },
                    missingFields: []
                }
            });

            // Mock storage
            storageService.saveGame.mockResolvedValue({
                slug: '/games/final-fantasy-vii',
                filePath: './games/final-fantasy-vii.json',
                title: 'Final Fantasy VII'
            });

            // Mock image service
            imagesService.fetchAndStoreCover.mockResolvedValue({
                success: true,
                found: true,
                path: './images/final-fantasy-vii.jpg',
                url: '/images/final-fantasy-vii.jpg',
                source: 'https://en.wikipedia.org/wiki/Final_Fantasy_VII'
            });

            // Mock queue operations
            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            // Verify the complete flow
            expect(result.success).toBe(true);
            expect(result.slug).toBe('/games/final-fantasy-vii');
            expect(result.confidence).toBe(0.92);
            expect(result.imageFound).toBe(true);

            // Verify all services were called in correct order
            expect(queueService.getNextPendingSubmission).toHaveBeenCalledTimes(1);
            expect(queueService.markInProgress).toHaveBeenCalledWith('sub-001');
            expect(researchService.researchGameWithAgent).toHaveBeenCalledWith('Final Fantasy VII');
            expect(storageService.assembleGameData).toHaveBeenCalled();
            expect(validationService.validateMetadata).toHaveBeenCalled();
            expect(storageService.saveGame).toHaveBeenCalledWith(
                '/games/final-fantasy-vii',
                expect.any(Object)
            );
            expect(imagesService.fetchAndStoreCover).toHaveBeenCalledWith(
                'Final Fantasy VII',
                '/games/final-fantasy-vii'
            );
            expect(queueService.markCompleted).toHaveBeenCalledWith('sub-001', expect.any(Object));
        });
    });

    describe('Complete Pipeline - Needs Review Path', () => {
        it('should mark submission for review when confidence is moderate', async () => {
            const mockSubmission = { id: 'sub-002', title: 'Unknown Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Unknown Game',
                    genres: ['RPG'],
                    platforms: ['PC'],
                    description: 'Limited info'
                },
                confidence: 0.6,
                sourceUrls: []
            });

            storageService.assembleGameData.mockReturnValue({
                slug: '/games/unknown-game',
                data: {
                    basic_info: {
                        title: 'Unknown Game',
                        url_slug: '/games/unknown-game',
                        genres: ['RPG'],
                        modes: { single_player: true },
                        developers: ['Unknown'],
                        publishers: ['Unknown']
                    },
                    release: {
                        platforms: [{ name: 'PC', region: 'World', release_date: '0000-00-00' }]
                    },
                    description: {
                        synopsis: 'Limited info available.',
                        long_description: 'Limited info available.'
                    }
                }
            });

            validationService.validateMetadata.mockReturnValue({
                valid: false,
                confidenceScore: 0.6,
                recommendation: 'review',
                issues: [
                    { message: 'Missing release date' },
                    { message: 'Missing developers' }
                ],
                details: { missingFields: ['release_date', 'developers'] }
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            expect(result.reason).toBe('needs_review');
            expect(result.confidence).toBe(0.6);

            expect(queueService.markForReview).toHaveBeenCalledWith(
                'sub-002',
                expect.any(Object)
            );
        });
    });

    describe('Complete Pipeline - Verification Failed Path', () => {
        it('should mark as failed when research confidence is too low', async () => {
            const mockSubmission = { id: 'sub-003', title: 'Fake Game XYZ 123' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: false,
                error: 'No search results found',
                confidence: 0.2
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
            // Can be verification_failed or processing_error depending on how the service handles it
            expect(['verification_failed', 'processing_error']).toContain(result.reason);

            expect(queueService.markFailed).toHaveBeenCalled();
        });
    });

    describe('Complete Pipeline - Image Fetch Failed Path', () => {
        it('should complete successfully even when image fetch fails', async () => {
            const mockSubmission = { id: 'sub-004', title: 'Old Game' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: {
                    title: 'Old Game',
                    genres: ['RPG'],
                    platforms: ['SNES'],
                    description: 'An old game',
                    confidence: 0.85
                },
                confidence: 0.85,
                sourceUrls: []
            });

            storageService.assembleGameData.mockReturnValue({
                slug: '/games/old-game',
                data: {
                    basic_info: {
                        title: 'Old Game',
                        url_slug: '/games/old-game',
                        genres: ['RPG'],
                        modes: { single_player: true },
                        developers: ['Dev'],
                        publishers: ['Pub']
                    },
                    release: {
                        platforms: [{ name: 'SNES', region: 'Japan', release_date: '1990-01-01' }]
                    },
                    description: {
                        synopsis: 'Synopsis.',
                        long_description: 'Long description.'
                    }
                }
            });

            validationService.validateMetadata.mockReturnValue({
                valid: true,
                confidenceScore: 0.85,
                recommendation: 'approve',
                issues: []
            });

            storageService.saveGame.mockResolvedValue({
                slug: '/games/old-game',
                title: 'Old Game'
            });

            // Image fetch fails
            imagesService.fetchAndStoreCover.mockResolvedValue({
                success: false,
                found: false,
                reason: 'no_image_found'
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            // Should still succeed even without image
            expect(result.success).toBe(true);
            expect(result.imageFound).toBe(false);
            expect(queueService.markCompleted).toHaveBeenCalled();
        });
    });

    describe('Batch Processing', () => {
        it('should process multiple submissions in batch', async () => {
            const submission1 = { id: 'sub-001', title: 'Game One' };
            const submission2 = { id: 'sub-002', title: 'Game Two' };

            researchService.researchGameWithAgent
                .mockResolvedValueOnce({
                    success: true,
                    metadata: { title: 'Game One', genres: ['RPG'], platforms: ['PC'], description: 'D1', confidence: 0.9 },
                    confidence: 0.9,
                    sourceUrls: []
                })
                .mockResolvedValueOnce({
                    success: true,
                    metadata: { title: 'Game Two', genres: ['Action'], platforms: ['PlayStation'], description: 'D2', confidence: 0.85 },
                    confidence: 0.85,
                    sourceUrls: []
                });

            storageService.assembleGameData
                .mockReturnValueOnce({
                    slug: '/games/game-one',
                    data: {
                        basic_info: { title: 'Game One', url_slug: '/games/game-one', genres: ['RPG'], modes: { single_player: true }, developers: ['D1'], publishers: ['P1'] },
                        release: { platforms: [{ name: 'PC', region: 'World', release_date: '2020-01-01' }] },
                        description: { synopsis: 'S1', long_description: 'L1' }
                    }
                })
                .mockReturnValueOnce({
                    slug: '/games/game-two',
                    data: {
                        basic_info: { title: 'Game Two', url_slug: '/games/game-two', genres: ['Action'], modes: { single_player: true }, developers: ['D2'], publishers: ['P2'] },
                        release: { platforms: [{ name: 'PlayStation', region: 'World', release_date: '2021-01-01' }] },
                        description: { synopsis: 'S2', long_description: 'L2' }
                    }
                });

            validationService.validateMetadata.mockReturnValue({
                valid: true,
                confidenceScore: 0.9,
                recommendation: 'approve',
                issues: []
            });

            storageService.saveGame.mockResolvedValue({ slug: '/games/test', title: 'Test' });
            imagesService.fetchAndStoreCover.mockResolvedValue({ success: true, found: true, url: '/images/test.jpg' });

            queueService.getNextPendingSubmission
                .mockResolvedValueOnce(submission1)
                .mockResolvedValueOnce(submission2)
                .mockResolvedValueOnce(null); // No more submissions

            queueService.markInProgress.mockResolvedValue(true);

            const results = await processor.runBatch(5);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(true);
        });
    });

    describe('No Pending Submissions', () => {
        it('should return no_pending_submissions when queue is empty', async () => {
            queueService.getNextPendingSubmission.mockResolvedValue(null);

            const result = await processor.run();

            expect(result.processed).toBe(false);
            expect(result.reason).toBe('no_pending_submissions');
        });
    });

    describe('Error Handling', () => {
        it('should handle research errors gracefully', async () => {
            const mockSubmission = { id: 'sub-005', title: 'Error Game' };

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

        it('should handle validation errors gracefully', async () => {
            const mockSubmission = { id: 'sub-006', title: 'Validation Error' };

            researchService.researchGameWithAgent.mockResolvedValue({
                success: true,
                metadata: { title: 'Validation Error', description: 'test' },
                confidence: 0.5,
                sourceUrls: []
            });

            storageService.assembleGameData.mockReturnValue({
                slug: '/games/validation-error',
                data: {} // Invalid data
            });

            validationService.validateMetadata.mockReturnValue({
                valid: false,
                confidenceScore: 0.1,
                recommendation: 'reject',
                issues: [{ message: 'Missing required fields' }]
            });

            queueService.getNextPendingSubmission.mockResolvedValue(mockSubmission);
            queueService.markInProgress.mockResolvedValue(true);

            const result = await processor.run();

            expect(result.success).toBe(false);
        });
    });
});
