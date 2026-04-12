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

// Set env vars before module load
process.env.BRAVE_SEARCH_ENABLED = 'true';
process.env.BRAVE_SEARCH_API_KEY = 'test-api-key-123';
process.env.BRAVE_TIMEOUT = '15000';
process.env.BRAVE_MAX_RETRIES = '2';
process.env.BRAVE_RATE_LIMIT_DELAY = '100';

const axios = require('axios');
const braveService = require('../../../src/services/game-creator/brave');

describe('Brave Search Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        braveService.resetRateLimit && braveService.resetRateLimit();
    });

    describe('isEnabled', () => {
        it('should return true when enabled with API key', () => {
            expect(braveService.isEnabled()).toBe(true);
        });

        it('should have correct config values', () => {
            expect(braveService.CONFIG.enabled).toBe(true);
            expect(braveService.CONFIG.apiKey).toBe('test-api-key-123');
            expect(braveService.CONFIG.timeout).toBe(15000);
        });
    });

    describe('search', () => {
        it('should search using Brave Search API', async () => {
            const mockResponse = {
                web: {
                    results: [
                        {
                            title: 'Game 1 Title',
                            url: 'https://example.com/game1',
                            description: 'Game 1 description'
                        },
                        {
                            title: 'Game 2 Title',
                            url: 'https://example.com/game2',
                            description: 'Game 2 description'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.search('test game');

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('api.search.brave.com'),
                expect.any(Object)
            );
            expect(results).toHaveProperty('query', 'test game');
            expect(results).toHaveProperty('source', 'brave');
            expect(results.results).toHaveLength(2);
        });

        it('should include description as snippet', async () => {
            const mockResponse = {
                web: {
                    results: [
                        {
                            title: 'Game Title',
                            url: 'https://example.com/game',
                            description: 'This is the description'
                        }
                    ]
                }
            };

            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.search('test');
            expect(results.results[0].snippet).toBe('This is the description');
        });

        it('should handle empty response', async () => {
            axios.get.mockResolvedValue({ data: { web: { results: [] } } });

            const results = await braveService.search('nonexistent');

            expect(results.results).toHaveLength(0);
        });
    });

    describe('searchGame', () => {
        it('should search with "video game" suffix', async () => {
            const mockResponse = {
                web: {
                    results: [
                        {
                            title: 'Game Title',
                            url: 'https://example.com/game',
                            description: 'Game description'
                        }
                    ]
                }
            };
            axios.get.mockResolvedValue({ data: mockResponse });

            const results = await braveService.searchGame('Final Fantasy');

            // Check that the call was made with correct params
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('api.search.brave.com'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'Final Fantasy video game'
                    })
                })
            );
            expect(results).toHaveProperty('query', 'Final Fantasy');
        });
    });

    describe('parseResults', () => {
        it('should parse Brave Search API response', () => {
            const data = {
                web: {
                    results: [
                        {
                            title: 'Result 1',
                            url: 'https://example.com/1',
                            description: 'Description 1'
                        },
                        {
                            title: 'Result 2',
                            url: 'https://example.com/2',
                            description: 'Description 2'
                        },
                        {
                            title: 'Result 3',
                            url: 'https://example.com/3',
                            description: 'Description 3'
                        }
                    ]
                }
            };

            const results = braveService.parseResults(data);

            expect(results).toHaveLength(3);
            expect(results[0]).toHaveProperty('url');
            expect(results[0]).toHaveProperty('title');
            expect(results[0]).toHaveProperty('snippet');
        });

        it('should handle missing fields gracefully', () => {
            const data = {};
            const results = braveService.parseResults(data);

            expect(results).toHaveLength(0);
        });

        it('should handle missing web results', () => {
            const data = { web: {} };
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
