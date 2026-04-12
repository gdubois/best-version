/**
 * MCP Client Tests
 *
 * Tests for the MCP (Model Context Protocol) Client
 */

jest.mock('child_process', () => ({
    spawn: jest.fn().mockReturnValue({
        stdin: {
            writable: true,
            write: jest.fn().mockImplementation((data, callback) => {
                if (callback) callback();
                return true;
            })
        },
        stdout: {
            on: jest.fn(),
            once: jest.fn()
        },
        stderr: {
            on: jest.fn(),
            once: jest.fn()
        },
        on: jest.fn(),
        killed: false,
        kill: jest.fn()
    })
}));

const { MCPToolProvider, convertToLangChainTools } = require('../../../src/services/game-creator/mcp-client');

describe('MCPToolProvider', () => {
    let mcpClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mcpClient = new MCPToolProvider();
    });

    afterEach(async () => {
        // Clean up
        if (mcpClient.isServerRunning()) {
            await mcpClient.stop();
        }
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(mcpClient.mcpProcess).toBeNull();
            expect(mcpClient.isRunning).toBe(false);
            expect(mcpClient.tools).toEqual([]);
            expect(mcpClient.writeBuffer).toBe('');
            expect(mcpClient.messageHandlers).toBeInstanceOf(Map);
            expect(mcpClient.nextMessageId).toBe(1);
        });
    });

    describe('start', () => {
        it('should start MCP server process', async () => {
            const { spawn } = require('child_process');

            await mcpClient.start();

            expect(spawn).toHaveBeenCalledWith(
                'node',
                expect.arrayContaining(['mcp-server.js']),
                expect.any(Object)
            );
            expect(mcpClient.isRunning).toBe(true);
        });

        it('should not start if already running', async () => {
            const { spawn } = require('child_process');

            // First start
            await mcpClient.start();

            // Reset mock call count
            spawn.mockClear();

            // Second start should not call spawn again
            await mcpClient.start();

            expect(spawn).not.toHaveBeenCalled();
        });
    });

    describe('isServerRunning', () => {
        it('should return false when not started', () => {
            expect(mcpClient.isServerRunning()).toBe(false);
        });

        it('should return true when running', async () => {
            await mcpClient.start();
            expect(mcpClient.isServerRunning()).toBe(true);
        });

        it('should return false when process is killed', () => {
            mcpClient.isRunning = true;
            mcpClient.mcpProcess = { killed: true };
            expect(mcpClient.isServerRunning()).toBe(false);
        });
    });

    describe('listTools', () => {
        it('should list available tools', async () => {
            // Mock the start and list tools
            mcpClient.isRunning = true;
            mcpClient.tools = [
                { name: 'web_search', description: 'Search the web' },
                { name: 'image_search', description: 'Search for images' }
            ];

            const tools = await mcpClient.listTools();

            expect(tools).toHaveLength(2);
            expect(tools[0].name).toBe('web_search');
        });

        it('should handle errors gracefully', async () => {
            mcpClient.isRunning = false;

            const tools = await mcpClient.listTools();

            expect(tools).toEqual([]);
        });
    });

    describe('callTool', () => {
        it('should call a tool with arguments', async () => {
            mcpClient.isRunning = true;
            mcpClient.mcpProcess.stdin.writable = true;

            // Mock sendRequest to return a result
            const mockResult = {
                content: [{ text: 'Test result' }]
            };
            mcpClient.sendRequest = jest.fn().mockResolvedValue(mockResult);

            const result = await mcpClient.callTool('test_tool', { query: 'test' });

            expect(result).toEqual(mockResult);
        });

        it('should throw error when server not running', async () => {
            mcpClient.isRunning = false;

            await expect(mcpClient.callTool('test_tool', {}))
                .rejects.toThrow('MCP server not running');
        });
    });

    describe('stop', () => {
        it('should stop the MCP server process', async () => {
            await mcpClient.start();

            await mcpClient.stop();

            expect(mcpClient.isRunning).toBe(false);
        });

        it('should not error when already stopped', async () => {
            await expect(mcpClient.stop()).resolves.not.toThrow();
        });
    });

    describe('getTools', () => {
        it('should return available tools', () => {
            mcpClient.tools = [
                { name: 'tool1', description: 'Tool 1' },
                { name: 'tool2', description: 'Tool 2' }
            ];

            const tools = mcpClient.getTools();

            expect(tools).toHaveLength(2);
            expect(tools).not.toBe(mcpClient.tools); // Should return a copy
        });
    });

    describe('getTool', () => {
        it('should return tool by name', () => {
            mcpClient.tools = [
                { name: 'web_search', description: 'Search the web' },
                { name: 'image_search', description: 'Search for images' }
            ];

            const tool = mcpClient.getTool('web_search');

            expect(tool.name).toBe('web_search');
            expect(tool.description).toBe('Search the web');
        });

        it('should return undefined for unknown tool', () => {
            mcpClient.tools = [
                { name: 'web_search', description: 'Search the web' }
            ];

            const tool = mcpClient.getTool('unknown_tool');

            expect(tool).toBeUndefined();
        });
    });

    describe('handleMessage', () => {
        it('should handle notifications', () => {
            const handler = jest.fn();
            mcpClient.messageHandlers.set('test_notification', handler);

            mcpClient.handleMessage({
                method: 'test_notification',
                params: { data: 'test' }
            });

            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should handle responses with result', () => {
            const handler = jest.fn();
            mcpClient.messageHandlers.set('response:1', handler);

            mcpClient.handleMessage({
                id: 1,
                result: { data: 'test' }
            });

            expect(handler).toHaveBeenCalledWith(null, { data: 'test' });
        });

        it('should handle responses with error', () => {
            const handler = jest.fn();
            mcpClient.messageHandlers.set('response:1', handler);

            mcpClient.handleMessage({
                id: 1,
                error: { message: 'Test error' }
            });

            expect(handler).toHaveBeenCalledWith(expect.any(Error), null);
        });
    });

    describe('waitForReady', () => {
        it('should resolve after timeout', async () => {
            jest.useFakeTimers();

            const promise = mcpClient.waitForReady();
            jest.advanceTimersByTime(1000);

            await promise;

            jest.useRealTimers();
        });

        it('should timeout after 10 seconds', async () => {
            jest.useFakeTimers();

            mcpClient.isRunning = false; // Simulate failure

            await expect(mcpClient.waitForReady()).rejects.toThrow('Timeout');

            jest.useRealTimers();
        });
    });
});

describe('convertToLangChainTools', () => {
    let mcpClient;

    beforeEach(() => {
        mcpClient = new MCPToolProvider();
    });

    it('should convert MCP tools to LangChain format', () => {
        mcpClient.tools = [
            {
                name: 'web_search',
                description: 'Search the web',
                inputSchema: { type: 'object' }
            }
        ];

        const langChainTools = convertToLangChainTools(mcpClient);

        expect(langChainTools).toHaveLength(1);
        expect(langChainTools[0].name).toBe('web_search');
        expect(langChainTools[0].description).toBe('Search the web');
        expect(langChainTools[0].func).toBeInstanceOf(Function);
    });

    it('should return empty array for no tools', () => {
        mcpClient.tools = [];

        const langChainTools = convertToLangChainTools(mcpClient);

        expect(langChainTools).toEqual([]);
    });

    it('should handle tool call errors in func', async () => {
        mcpClient.tools = [
            {
                name: 'test_tool',
                description: 'Test tool',
                inputSchema: {}
            }
        ];
        mcpClient.callTool = jest.fn().mockRejectedValue(new Error('Tool error'));

        const langChainTools = convertToLangChainTools(mcpClient);
        const result = await langChainTools[0].func({});

        expect(result).toContain('Error: Tool error');
    });

    it('should return content text from tool result', async () => {
        mcpClient.tools = [
            {
                name: 'test_tool',
                description: 'Test tool',
                inputSchema: {}
            }
        ];
        mcpClient.callTool = jest.fn().mockResolvedValue({
            content: [{ text: 'Result text' }]
        });

        const langChainTools = convertToLangChainTools(mcpClient);
        const result = await langChainTools[0].func({});

        expect(result).toBe('Result text');
    });
});
