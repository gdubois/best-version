/**
 * MobyGames Service Tests
 */

jest.mock('../../../src/services/game-creator/wikipedia', () => ({
    searchWikipedia: jest.fn(),
    findGameCover: jest.fn()
}));

jest.mock('../../../src/services/game-creator/logger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const wikipediaService = require('../../../src/services/game-creator/wikipedia');
const mobygamesService = require('../../../src/services/game-creator/mobygames');

describe('MobyGames Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        mobygamesService.resetRateLimit();
    });

    describe('searchMobyGames', () => {
        it('should search and return game articles', async () => {
            const mockWikipediaResults = [
                {
                    title: 'Super Mario Bros.',
                    snippet: 'Super Mario Bros. is a 1985 platform game developed and published by Nintendo for the Nintendo Entertainment System (NES).'
                },
                {
                    title: 'Mario Bros.',
                    snippet: 'Mario Bros. is a 1983 platform game developed and published by Nintendo for the arcade.'
                }
            ];

            wikipediaService.searchWikipedia.mockResolvedValue(mockWikipediaResults);

            const results = await mobygamesService.searchMobyGames('Super Mario');

            expect(results.found).toBe(true);
            expect(results.games).toHaveLength(2);
            expect(results.games[0].title).toBe('Super Mario Bros.');
            expect(results.games[0].wikipediaUrl).toContain('Super Mario Bros.');
        });

        it('should return empty results when no games found', async () => {
            wikipediaService.searchWikipedia.mockResolvedValue([]);

            const results = await mobygamesService.searchMobyGames('Nonexistent Game XZY');

            expect(results.found).toBe(false);
            expect(results.games).toHaveLength(0);
        });

        it('should filter out non-game articles', async () => {
            const mockWikipediaResults = [
                {
                    title: 'Super Mario (album)',
                    snippet: 'Super Mario is a music album by various artists.'
                },
                {
                    title: 'Mario (character)',
                    snippet: 'Mario is a fictional character in video games.'
                }
            ];

            wikipediaService.searchWikipedia.mockResolvedValue(mockWikipediaResults);

            const results = await mobygamesService.searchMobyGames('Mario');

            // Should filter out non-game articles
            expect(results.games.length).toBeLessThan(mockWikipediaResults.length);
        });

        it('should handle search errors gracefully', async () => {
            wikipediaService.searchWikipedia.mockRejectedValue(new Error('API error'));

            const results = await mobygamesService.searchMobyGames('Test Game');

            expect(results.found).toBe(false);
            expect(results.games).toHaveLength(0);
            expect(results.error).toBe('API error');
        });
    });

    describe('findGameCover', () => {
        it('should find cover image via MobyGames/Wikipedia', async () => {
            const mockCoverInfo = {
                found: true,
                imageUrl: 'https://upload.wikimedia.org/wikipedia/thumb.jpg',
                thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/thumb2.jpg',
                source: 'https://en.wikipedia.org/wiki/The_Legend_of_Zelda',
                width: 600,
                height: 800
            };

            wikipediaService.searchWikipedia.mockResolvedValue([
                {
                    title: 'The Legend of Zelda',
                    snippet: 'The Legend of Zelda is an action-adventure game developed by Nintendo'
                }
            ]);
            wikipediaService.findGameCover.mockResolvedValue(mockCoverInfo);

            const result = await mobygamesService.findGameCover('The Legend of Zelda', 600);

            expect(result.found).toBe(true);
            expect(result.imageUrl).toBe(mockCoverInfo.imageUrl);
            expect(result.source).toBe(mockCoverInfo.source);
            expect(result.width).toBe(600);
        });

        it('should return not found when no image exists', async () => {
            const mockNoCover = {
                found: false,
                imageUrl: null,
                source: null,
                reason: 'no_image_found'
            };

            wikipediaService.searchWikipedia.mockResolvedValue([
                {
                    title: 'Obscure Game',
                    snippet: 'A very obscure game'
                }
            ]);
            wikipediaService.findGameCover.mockResolvedValue(mockNoCover);

            const result = await mobygamesService.findGameCover('Obscure Game', 600);

            expect(result.found).toBe(false);
            expect(result.imageUrl).toBe(null);
        });

        it('should return not found when game not found', async () => {
            wikipediaService.searchWikipedia.mockResolvedValue([]);

            const result = await mobygamesService.findGameCover('Nonexistent Game XZY', 600);

            expect(result.found).toBe(false);
            expect(result.reason).toBe('game_not_found');
        });

        it('should use maxWidth parameter', async () => {
            const mockCoverInfo = {
                found: true,
                imageUrl: 'https://example.com/image.jpg',
                source: 'https://example.com',
                width: 300
            };

            wikipediaService.searchWikipedia.mockResolvedValue([
                {
                    title: 'Test Game',
                    snippet: 'A test game'
                }
            ]);
            wikipediaService.findGameCover.mockResolvedValue(mockCoverInfo);

            await mobygamesService.findGameCover('Test Game', 300);

            // The findGameCover is called with maxWidth
            expect(wikipediaService.findGameCover).toHaveBeenCalled();
        });
    });

    describe('getGameMetadata', () => {
        it('should return game metadata', async () => {
            wikipediaService.searchWikipedia.mockResolvedValue([
                {
                    title: 'Final Fantasy VII',
                    snippet: 'Final Fantasy VII is a 1997 role-playing game developed by Square'
                }
            ]);

            const result = await mobygamesService.getGameMetadata('Final Fantasy VII');

            expect(result.found).toBe(true);
            expect(result.metadata.title).toBe('Final Fantasy VII');
            expect(result.metadata.wikipediaUrl).toContain('Final Fantasy VII');
            expect(result.metadata.snippet).toContain('role-playing game');
        });

        it('should return not found when no metadata available', async () => {
            wikipediaService.searchWikipedia.mockResolvedValue([]);

            const result = await mobygamesService.getGameMetadata('Nonexistent Game');

            expect(result.found).toBe(false);
            expect(result.metadata).toBe(null);
        });
    });

    describe('getStats', () => {
        it('should return service statistics', () => {
            const stats = mobygamesService.getStats();

            expect(stats).toHaveProperty('lastRequestTime');
            expect(stats).toHaveProperty('rateLimitDelay');
            expect(stats).toHaveProperty('sources');
            expect(stats.rateLimitDelay).toBe(3000);
        });
    });

    describe('resetRateLimit', () => {
        it('should reset the rate limit timer', () => {
            // Make a request to set the timer
            mobygamesService.enforceRateLimit();

            // Reset it
            mobygamesService.resetRateLimit();

            // Should be back to 0
            const stats = mobygamesService.getStats();
            expect(stats.lastRequestTime).toBe(0);
        });
    });
});
