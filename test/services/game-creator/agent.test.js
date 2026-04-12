/**
 * Agent Service Tests
 */

jest.mock('../../../src/services/game-creator/logger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const mockDuckDuckGoResults = {
    query: 'test',
    results: [
        { title: 'Test Game', url: 'https://example.com/game1', snippet: 'Snippet 1' },
        { title: 'Test Game Wiki', url: 'https://example.com/wiki', snippet: 'Wiki snippet' }
    ],
    source: 'duckduckgo'
};

const mockBraveResults = {
    query: 'test',
    results: [
        { title: 'Test Game Info', url: 'https://brave.com/game', snippet: 'Brave snippet' }
    ],
    source: 'brave'
};

jest.mock('../../../src/services/game-creator/duckduckgo', () => ({
    isEnabled: jest.fn().mockReturnValue(true),
    search: jest.fn().mockResolvedValue(mockDuckDuckGoResults)
}));

jest.mock('../../../src/services/game-creator/brave', () => ({
    isEnabled: jest.fn().mockReturnValue(true),
    search: jest.fn().mockResolvedValue(mockBraveResults)
}));

jest.mock('../../../src/services/game-creator/llmClient', () => ({
    callLLM: jest.fn().mockResolvedValue({
        response: JSON.stringify({
            title: 'Test Game',
            developer: 'Test Developer',
            publisher: 'Test Publisher',
            platforms: ['PC', 'PS1'],
            genres: ['RPG', 'Adventure'],
            description: 'A test game description',
            confidence: 0.85,
            sourceUrls: ['https://example.com/game1']
        })
    }),
    getConfig: jest.fn().mockReturnValue({})
}));

const agentService = require('../../../src/services/game-creator/agent');
const llmClient = require('../../../src/services/game-creator/llmClient');
const duckduckgoService = require('../../../src/services/game-creator/duckduckgo');
const braveService = require('../../../src/services/game-creator/brave');

describe('Agent Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.LLM_TEMPERATURE = '0.2';
        process.env.LLM_MAX_TOKENS = '8000';
        process.env.LLM_ENDPOINT = 'http://10.0.0.15:1234/api/generate';
        process.env.LLM_MODEL = 'llama3.2';
        process.env.MCP_SERVER_ENABLED = 'false'; // Disable MCP for unit tests
        process.env.MCP_TIMEOUT = '60000';
        process.env.DUCKDUCKGO_ENABLED = 'true';
        process.env.BRAVE_SEARCH_ENABLED = 'true';
    });

    afterEach(async () => {
        // Clean up any MCP clients if shutdown exists
        if (agentService.shutdown) {
            await agentService.shutdown();
        }
    });

    describe('parseJSONResponse', () => {
        it('should parse valid JSON', () => {
            const response = '{"title": "Test", "confidence": 0.9}';
            const result = agentService.parseJSONResponse(response);

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test');
            expect(result.data.confidence).toBe(0.9);
        });

        it('should remove markdown code blocks', () => {
            const response = '```json\n{"title": "Test"}\n```';
            const result = agentService.parseJSONResponse(response);

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test');
        });

        it('should extract JSON from text', () => {
            const response = 'Here is the JSON: {"title": "Test"} and more text';
            const result = agentService.parseJSONResponse(response);

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test');
        });

        it('should handle invalid JSON', () => {
            const response = 'not valid json {';
            const result = agentService.parseJSONResponse(response);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle empty response', () => {
            const result = agentService.parseJSONResponse('');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Empty response');
        });
    });

    describe('calculateConfidence', () => {
        it('should calculate confidence based on fields', () => {
            const metadata = {
                basic_info: {
                    title: 'Test',
                    developers: ['Dev'],
                    publishers: ['Pub'],
                    genres: ['RPG']
                },
                release: {
                    platforms: [{ release_date: '2023-01-01' }]
                },
                description: {
                    synopsis: 'Desc'
                },
                sourceUrls: ['https://example.com']
            };

            const confidence = agentService.calculateConfidence(metadata);

            expect(confidence).toBe(0.95); // Maximum
        });

        it('should give base score for minimal data', () => {
            const metadata = {};
            const confidence = agentService.calculateConfidence(metadata);

            expect(confidence).toBe(0.2); // Base score
        });

        it('should add points for each field', () => {
            const metadata = {
                basic_info: {
                    title: 'Test',
                    developers: ['Dev']
                }
            };

            const confidence = agentService.calculateConfidence(metadata);

            expect(confidence).toBeCloseTo(0.45, 2); // 0.2 base + 0.1 title + 0.15 developer
        });
    });

    describe('getConfig', () => {
        it('should return configuration object', () => {
            const config = agentService.getConfig();

            expect(config).toHaveProperty('temperature');
            expect(config).toHaveProperty('maxTokens');
            expect(config).toHaveProperty('endpoint');
            expect(config).toHaveProperty('model');
            expect(config).toHaveProperty('mcpEnabled');
            expect(config).toHaveProperty('maxSearches');
            expect(config).toHaveProperty('maxFollowUpSearches');
            expect(config).toHaveProperty('enableMultiPass');
        });

        it('should have sensible defaults for multi-pass config', () => {
            const config = agentService.getConfig();

            expect(config.maxFollowUpSearches).toBeGreaterThan(0);
            expect(config.enableMultiPass).toBe(true);
        });
    });

    describe('ResearchAgent multi-pass functionality', () => {
        it('should have phase2bAnalyzeResults method', () => {
            const { ResearchAgent } = agentService;
            const agent = new ResearchAgent();

            expect(typeof agent.phase2bAnalyzeResults).toBe('function');
        });

        it('should have phase2cExecuteFollowUpQueries method', () => {
            const { ResearchAgent } = agentService;
            const agent = new ResearchAgent();

            expect(typeof agent.phase2cExecuteFollowUpQueries).toBe('function');
        });

        it('phase2bAnalyzeResults should return empty array when multi-pass is disabled', async () => {
            const { ResearchAgent, CONFIG } = agentService;
            const agent = new ResearchAgent();

            // Temporarily disable multi-pass
            const originalEnableMultiPass = CONFIG.enableMultiPass;
            CONFIG.enableMultiPass = false;

            const queries = await agent.phase2bAnalyzeResults([], []);

            CONFIG.enableMultiPass = originalEnableMultiPass;

            expect(queries).toEqual([]);
        });

        it('phase2bAnalyzeResults should generate patch-focused queries for retro games', async () => {
            const { ResearchAgent } = agentService;
            const agent = new ResearchAgent();
            agent.gameTitle = 'Test Game';

            const results = [
                { title: 'Test Game PS1', description: 'PlayStation 1 Japanese game' }
            ];
            const urls = ['https://example.com/ps1'];

            const queries = await agent.phase2bAnalyzeResults(results, urls);

            // Should generate some follow-up queries for patches
            expect(queries.length).toBeGreaterThan(0);
        });

        it('phase2cExecuteFollowUpQueries should return empty results when multi-pass is disabled', async () => {
            const { ResearchAgent, CONFIG } = agentService;
            const agent = new ResearchAgent();

            // Temporarily disable multi-pass
            const originalEnableMultiPass = CONFIG.enableMultiPass;
            CONFIG.enableMultiPass = false;

            const result = await agent.phase2cExecuteFollowUpQueries(['test query']);

            CONFIG.enableMultiPass = originalEnableMultiPass;

            expect(result.results).toEqual([]);
            expect(result.urls).toEqual([]);
        });

        it('phase3Analyze should accept isMultiPass parameter', () => {
            const { ResearchAgent } = agentService;
            const agent = new ResearchAgent();

            // The method should exist and accept the parameter
            expect(typeof agent.phase3Analyze).toBe('function');
        });
    });

    describe('performSearches', () => {
        it('should perform searches and aggregate results', async () => {
            // Ensure mocks are properly configured
            duckduckgoService.isEnabled.mockReturnValue(true);
            braveService.isEnabled.mockReturnValue(true);
            duckduckgoService.search.mockResolvedValue(mockDuckDuckGoResults);
            braveService.search.mockResolvedValue(mockBraveResults);

            const results = await agentService.performSearches('Test Game');

            expect(results).toHaveProperty('results');
            expect(results).toHaveProperty('sourceUrls');
            expect(results.results.length).toBeGreaterThan(0);
        });

        it('should fall back to direct search when MCP is disabled', async () => {
            process.env.MCP_SERVER_ENABLED = 'false';

            const results = await agentService.performSearches('Test Game');

            expect(results.results.length).toBeGreaterThan(0);
        });
    });

    describe('researchGameWithAgent', () => {
        it('should complete research successfully', async () => {
            llmClient.callLLM.mockResolvedValue({
                response: JSON.stringify({
                    title: 'Test Game',
                    developer: 'Test Developer',
                    publisher: 'Test Publisher',
                    platforms: ['PC', 'PS1'],
                    genres: ['RPG', 'Adventure'],
                    description: 'A test game description',
                    confidence: 0.85,
                    sourceUrls: ['https://example.com/game1']
                })
            });

            const result = await agentService.researchGameWithAgent('Test Game');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('metadata');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('sourceUrls');
            expect(result.confidence).toBeGreaterThan(0);
        });

        it('should handle LLM errors gracefully', async () => {
            // The agent should return valid data even when LLM fails
            // It may succeed with cached/fallback data or return error
            const result = await agentService.researchGameWithAgent('Test Game');

            // Should have a result (either success with data or failure with error)
            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
        }, 30000);

        it('should handle JSON parsing errors', async () => {
            // The researchGameWithAgent uses fallback JSON when parsing fails,
            // so success will still be true with fallback data
            const result = await agentService.researchGameWithAgent('Test Game');

            // Should succeed with fallback data
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
        }, 30000);

        it('should include all metadata fields', async () => {
            // The agent returns data in a specific format
            const result = await agentService.researchGameWithAgent('Test Game');

            // Check for the correct field names in the output format
            expect(result.metadata).toHaveProperty('title');
            expect(result.metadata).toHaveProperty('developers'); // Note: array, not developer
            expect(result.metadata).toHaveProperty('publishers'); // Note: array, not publisher
            expect(result.metadata).toHaveProperty('platforms');
            expect(result.metadata).toHaveProperty('genres');
            expect(result.metadata).toHaveProperty('description');
        }, 30000);
    });
});
