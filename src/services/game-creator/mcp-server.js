/**
 * MCP (Model Context Protocol) Server
 *
 * Provides search tools to LangChain agents via stdio transport.
 * Uses OpenSearch MCP service (ghcr.io/aas-ee/open-web-search) as the primary search backend.
 * This is a standalone process that can be spawned by the MCP client.
 *
 * @module services/game-creator/mcp-server
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

/**
 * Server configuration
 */
const CONFIG = {
    name: 'game-creator-websearch',
    version: '1.0.0',
    // OpenSearch MCP settings
    // The open-websearch MCP service is run as a separate HTTP service (via Docker)
    openWebSearchMCPHost: process.env.OPEN_WEBSEARCH_MCP_HOST || 'http://open-websearch:3000',
    openWebSearchMCPEngine: process.env.OPEN_WEBSEARCH_MCP_ENGINE || 'duckduckgo',
    openWebSearchMCPEnabled: process.env.OPEN_WEBSEARCH_MCP_ENABLED !== 'false'
};

/**
 * Create the MCP server with registered tools
 * @returns {McpServer} Configured MCP server instance
 */
function createServer() {
    const server = new McpServer({
        name: CONFIG.name,
        version: CONFIG.version
    });

    // Register OpenSearch MCP package tool
    // This connects to the open-webSearch MCP service (run via Docker)
    // Uses MCP protocol over HTTP SSE transport
    if (CONFIG.openWebSearchMCPEnabled) {
        // Call the search tool on the remote MCP service
        async function callRemoteSearch(query, engines, limit) {
            const axios = require('axios');
            const crypto = require('crypto');
            const mcpHost = CONFIG.openWebSearchMCPHost;

            // Shared state for MCP HTTP client (defined inside function for proper closure)
            if (!callRemoteSearch.mcpSessionId) {
                callRemoteSearch.mcpSessionId = null;
                callRemoteSearch.mcpInitialized = false;
            }

            // Ensure session is initialized
            if (!callRemoteSearch.mcpSessionId) {
                try {
                    // Step 1: Initialize session
                    const initResponse = await axios.post(`${mcpHost}/mcp`, {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'initialize',
                        params: {
                            protocolVersion: '2024-11-05',
                            capabilities: {},
                            clientInfo: {
                                name: 'best-version-game-creator',
                                version: '1.0.0'
                            }
                        }
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json, text/event-stream'
                        },
                        timeout: 10000,
                        transformResponse: [(data) => {
                            // Parse SSE format: "event: message\ndata: {...}"
                            const match = data.match(/data:\s*(\{[\s\S]*\}\s*)/);
                            return match ? JSON.parse(match[1]) : null;
                        }]
                    });

                    // Extract session ID from response headers or create one
                    callRemoteSearch.mcpSessionId = initResponse.headers['mcp-session-id'] || crypto.randomUUID();
                    callRemoteSearch.mcpInitialized = true;
                    console.log(`[MCP Server] Initialized session with open-websearch: ${callRemoteSearch.mcpSessionId}`);
                } catch (error) {
                    console.error(`[MCP Server] Failed to initialize MCP session: ${error.message}`);
                    throw error;
                }
            }

            try {
                // Call the search tool (note: the tool is named 'search', not 'web_search')
                const searchResponse = await axios.post(`${mcpHost}/mcp`, {
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                        name: 'search',
                        arguments: {
                            query: query,
                            engines: engines || undefined,
                            limit: limit || 10
                        }
                    }
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/event-stream',
                        'mcp-session-id': callRemoteSearch.mcpSessionId
                    },
                    timeout: 60000,
                    transformResponse: [(data) => {
                        // Parse SSE format
                        const match = data.match(/data:\s*(\{[\s\S]*\}\s*)/);
                        return match ? JSON.parse(match[1]) : null;
                    }]
                });

                return searchResponse.data;
            } catch (error) {
                console.error(`[MCP Server] Remote search failed: ${error.message}`);
                throw error;
            }
        }

        server.registerTool(
            'web_search',
            {
                description: 'Search the web using the open-webSearch MCP service. This provides multi-engine search results from DuckDuckGo and other engines. No API keys required. Use this for comprehensive web searches with diverse engine results.',
                inputSchema: z.object({
                    query: z.string().describe('The search query to submit. Be specific and include key terms for better results.'),
                    limit: z.number().optional().describe('Optional: Number of results to return (default: 10)')
                })
            },
            async ({ query, limit }) => {
                try {
                    const result = await callRemoteSearch(query, undefined, limit);

                    // Parse MCP tool result format
                    // result.result.content[0].text contains a JSON string with { query, results, ... }
                    let searchResults = [];
                    // The result from callRemoteSearch is the JSON-RPC response: { result: { content: [...] }, jsonrpc: '2.0', id: N }
                    if (result && result.result && result.result.content && Array.isArray(result.result.content) && result.result.content.length > 0) {
                        const textContent = result.result.content[0].text;
                        try {
                            const parsed = JSON.parse(textContent);
                            if (parsed.results && Array.isArray(parsed.results)) {
                                searchResults = parsed.results;
                            } else if (Array.isArray(parsed)) {
                                searchResults = parsed;
                            }
                        } catch (parseError) {
                            console.error(`[MCP Server] Failed to parse search results: ${parseError.message}`);
                            console.error(`[MCP Server] Raw text: ${textContent.substring(0, 200)}`);
                            // Fallback: use raw text
                            searchResults = [{
                                title: 'Search Result',
                                url: '',
                                snippet: textContent.substring(0, 500)
                            }];
                        }
                    } else {
                        console.error(`[MCP Server] Unexpected result structure:`, JSON.stringify(result, null, 2).substring(0, 500));
                    }

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    query,
                                    results: searchResults,
                                    source: 'open-websearch-mcp',
                                    engine: CONFIG.openWebSearchMCPEngine
                                }, null, 2)
                            }
                        ]
                    };
                } catch (error) {
                    console.error(`[MCP Server] web_search failed: ${error.message}`);

                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: `OpenSearch MCP service unavailable: ${error.message}`,
                                    query,
                                    results: []
                                }, null, 2)
                            }
                        ]
                    };
                }
            }
        );

        console.log(`[MCP Server] Registered tool: web_search (engine: ${CONFIG.openWebSearchMCPEngine})`);
    } else {
        console.log(`[MCP Server] OpenSearch MCP service disabled (set OPEN_WEBSEARCH_MCP_ENABLED=true to enable)`);
    }

    return server;
}

/**
 * Main function - start the MCP server
 */
async function main() {
    console.log(`[MCP Server] Starting ${CONFIG.name} v${CONFIG.version}`);
    console.log(`[MCP Server] OpenSearch MCP host: ${CONFIG.openWebSearchMCPHost}`);
    console.log(`[MCP Server] OpenSearch MCP engine: ${CONFIG.openWebSearchMCPEngine}`);
    console.log(`[MCP Server] OpenSearch MCP enabled: ${CONFIG.openWebSearchMCPEnabled}`);

    const server = createServer();
    const transport = new StdioServerTransport();

    try {
        await server.connect(transport);
        console.log(`[MCP Server] Connected and ready via stdio`);
    } catch (error) {
        console.error(`[MCP Server] Failed to start: ${error.message}`);
        process.exit(1);
    }
}

// Run if this is the main module
if (require.main === module) {
    main().catch(error => {
        console.error(`[MCP Server] Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    createServer,
    CONFIG
};
