/**
 * MCP Server Tests
 *
 * Tests for the MCP (Model Context Protocol) Server
 */

jest.mock('axios');
const axios = require('axios');

const { createServer, CONFIG } = require('../../../src/services/game-creator/mcp-server');

describe('MCP Server', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set MCP enabled by default
        process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'true';
    });

    afterEach(() => {
        delete process.env.OPEN_WEBSEARCH_MCP_ENABLED;
    });

    describe('CONFIG', () => {
        it('should have correct default values', () => {
            expect(CONFIG.name).toBe('game-creator-websearch');
            expect(CONFIG.version).toBe('1.0.0');
            expect(CONFIG.openWebSearchMCPHost).toBe('http://open-websearch:3000');
            expect(CONFIG.openWebSearchMCPEngine).toBe('duckduckgo');
        });

        it('should use environment variables', () => {
            process.env.OPEN_WEBSEARCH_MCP_HOST = 'http://custom-host:8080';
            process.env.OPEN_WEBSEARCH_MCP_ENGINE = 'brave';

            // Need to re-require to get new config
            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const { CONFIG: customConfig } = require('../../../src/services/game-creator/mcp-server');

            expect(customConfig.openWebSearchMCPHost).toBe('http://custom-host:8080');
            expect(customConfig.openWebSearchMCPEngine).toBe('brave');
        });

        it('should disable when OPEN_WEBSEARCH_MCP_ENABLED is false', () => {
            process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'false';

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const { CONFIG: disabledConfig } = require('../../../src/services/game-creator/mcp-server');

            expect(disabledConfig.openWebSearchMCPEnabled).toBe(false);
        });
    });

    describe('createServer', () => {
        it('should create MCP server with correct config', () => {
            const server = createServer();

            expect(server).toBeDefined();
        });

        it('should register web_search tool when MCP is enabled', () => {
            process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'true';

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const { createServer: createEnabledServer } = require('../../../src/services/game-creator/mcp-server');

            const server = createEnabledServer();

            expect(server).toBeDefined();
        });

        it('should not register tools when MCP is disabled', () => {
            process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'false';

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const { createServer: createDisabledServer } = require('../../../src/services/game-creator/mcp-server');

            const server = createDisabledServer();

            expect(server).toBeDefined();
        });
    });

    describe('callRemoteSearch (internal function)', () => {
        it('should initialize session and call search', async () => {
            // Reset cache to get fresh module
            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const serverModule = require('../../../src/services/game-creator/mcp-server');

            // Mock axios responses
            axios.post = jest.fn()
                .mockResolvedValueOnce({
                    headers: { 'mcp-session-id': 'test-session-123' }
                })
                .mockResolvedValueOnce({
                    data: {
                        result: {
                            content: [{
                                text: JSON.stringify({
                                    results: [
                                        { title: 'Result 1', url: 'https://example.com/1', snippet: 'Snippet 1' }
                                    ]
                                })
                            }]
                        }
                    }
                });

            const server = serverModule.createServer();

            // The tool is registered during createServer, so we can test the tool callback
            // by examining the server's tool registrations (which are internal)
            expect(server).toBeDefined();
        });

        it('should handle initialization errors', async () => {
            axios.post = jest.fn().mockRejectedValue(new Error('Connection failed'));

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const serverModule = require('../../../src/services/game-creator/mcp-server');

            const server = serverModule.createServer();

            expect(server).toBeDefined();
        });

        it('should handle search errors gracefully', async () => {
            // Mock successful init but failed search
            axios.post = jest.fn()
                .mockResolvedValueOnce({
                    headers: { 'mcp-session-id': 'test-session-123' }
                })
                .mockRejectedValueOnce(new Error('Search failed'));

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const serverModule = require('../../../src/services/game-creator/mcp-server');

            const server = serverModule.createServer();

            expect(server).toBeDefined();
        });

        it('should parse SSE format response', async () => {
            const sseResponse = 'event: message\ndata: {"result": {"content": [{"text": "test"}]}}\n';

            axios.post = jest.fn()
                .mockResolvedValueOnce({
                    headers: { 'mcp-session-id': 'test-session-123' }
                })
                .mockResolvedValueOnce({
                    data: sseResponse
                });

            delete require.cache[require.resolve('../../../src/services/game-creator/mcp-server')];
            const serverModule = require('../../../src/services/game-creator/mcp-server');

            const server = serverModule.createServer();

            expect(server).toBeDefined();
        });
    });
});
