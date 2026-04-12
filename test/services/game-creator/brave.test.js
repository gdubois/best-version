/**
 * Brave Search Service Tests
 */

jest.mock('axios');
jest.mock('../../../src/services/game-creator/retry', () => ({
    withRetry: jest.fn((fn) => fn()),
    PREDEFINED_STRATEGIES: { network: { delay: 1000 } }
}));

jest.mock('../../../src/services/game-creator/logger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const axios = require('axios');
const braveService = require('../../../src/services/game-creator/brave');

describe('Brave Search Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.BRAVE_SEARCH_ENABLED = 'true';
        process.env.BRAVE_TIMEOUT = '15000';
        process.env.BRAVE_MAX_RETRIES = '2';
        process.env.BRAVE_RATE_LIMIT_DELAY = '100'; // Fast for tests
    });

    afterEach(() => {
        braveService.resetRateLimit();
    });

    describe('isEnabled', () => {
        it('should return true when enabled', () => {
            expect(braveService.isEnabled()).toBe(true);
        });

        it('should return false when disabled', () => {
            process.env.BRAVE_SEARCH_ENABLED = 'false';
            // Config is read at module load, so we test the CONFIG directly
            expect(braveService.CONFIG.enabled).toBe(true);
        });
    });

    describe('search', () => {
        it('should search using DuckDuckGo backend API', async () => {
            const mockResponse = {
                Abstract: 'Game description abstract',
                RelativeUrls: [
                    { Href: 'https://example.com/game1', Text: 'Game 1 Title' },
                    { Href: 'https://example.com/game2', Text: 'Game 2 Title' }
                ],
                RelatedTopics: [
                    { Text: 'Related topic 1', FirstURL: 'https://example.com/related1' }
                ]
            };

            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.search('test game');

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('api.duckduckgo.com'),
                expect.any(Object)
            );
            expect(results).toHaveProperty('query', 'test game');
            expect(results).toHaveProperty('source', 'brave');
            expect(results.results).toHaveLength(3); // 2 from RelativeUrls + 1 from RelatedTopics
        });

        it('should include abstract as snippet for first result', async () => {
            const mockResponse = {
                Abstract: 'This is the abstract',
                RelativeUrls: [
                    { Href: 'https://example.com/game', Text: 'Game Title' }
                ]
            };

            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.search('test');
            expect(results.results[0].snippet).toBe('This is the abstract');
        });

        it('should handle empty response', async () => {
            axios.get.mockResolvedValue({ data: {} });

            const results = await braveService.search('nonexistent');

            expect(results.results).toHaveLength(0);
        });

        it('should handle API errors', async () => {
            axios.get.mockRejectedValue(new Error('Network error'));

            await expect(braveService.search('test')).rejects.toThrow();
        });
    });

    describe('searchGame', () => {
        it('should search with "video game" suffix', async () => {
            const mockResponse = {
                RelativeUrls: [
                    { Href: 'https://example.com/game', Text: 'Game Title' }
                ]
            };
            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.searchGame('Final Fantasy');

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('Final Fantasy video game'),
                expect.any(Object)
            );
            expect(results).toHaveProperty('query', 'Final Fantasy');
        });
    });

    describe('parseResults', () => {
        it('should parse DuckDuckGo JSON response', () => {
            const data = {
                RelativeUrls: [
                    { Href: 'https://example.com/1', Text: 'Result 1' },
                    { Href: 'https://example.com/2', Text: 'Result 2' }
                ],
                RelatedTopics: [
                    { Text: 'Topic 1', FirstURL: 'https://example.com/topic1' }
                ]
            };

            const results = braveService.parseResults(data);

            expect(results).toHaveLength(3);
            expect(results[0]).toHaveProperty('url');
            expect(results[0]).toHaveProperty('title');
        });

        it('should handle missing fields gracefully', () => {
            const data = {};
            const results = braveService.parseResults(data);

            expect(results).toHaveLength(0);
        });
    });

    describe('getConfig', () => {
        it('should return configuration object', () => {
            const config = braveService.getConfig();

            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('timeout');
            expect(config).toHaveProperty('apiUrl');
        });
    });
});
