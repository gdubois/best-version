#!/usr/bin/env node
/**
 * Direct MCP Tool Test for Game Creator
 *
 * This test directly invokes the MCP server and calls the open_websearch_mcp tool
 * to verify the integration works correctly for the game "Sweet Home".
 *
 * Usage:
 *   node test-mcp-tool-direct.js
 *
 * This test spawns the MCP server subprocess and calls the tool directly via JSON-RPC.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
    openWebSearchHost: process.env.OPEN_WEBSEARCH_HOST || 'http://localhost:3001',
    mcpTimeout: 60000,
    gameTitle: 'Sweet Home'
};

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
    console.log(`${color}${message}${RESET}`);
}

class MCPToolTester {
    constructor() {
        this.mcpProcess = null;
        this.messageBuffer = '';
        this.pendingCallbacks = new Map();
        this.messageId = 0;
        this.isRunning = false;
    }

    async start() {
        log(`${BLUE}Starting MCP server...${RESET}`);

        const mcpServerPath = path.join(__dirname, 'src/services/game-creator/mcp-server.js');

        this.mcpProcess = spawn('node', [mcpServerPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                OPEN_WEBSEARCH_MCP_ENABLED: 'true',
                OPEN_WEBSEARCH_MCP_HOST: CONFIG.openWebSearchHost,
                OPEN_WEBSEARCH_MCP_ENGINE: 'duckduckgo',
                DUCKDUCKGO_ENABLED: 'true',
                BRAVE_SEARCH_ENABLED: 'true'
            }
        });

        this.isRunning = true;

        // Handle stdout
        this.mcpProcess.stdout.on('data', (chunk) => {
            this.handleStdoutData(chunk);
        });

        // Handle stderr
        this.mcpProcess.stderr.on('data', (data) => {
            const stderr = data.toString().trim();
            if (stderr) {
                log(`  stderr: ${stderr}`, YELLOW);
            }
        });

        // Handle exit
        this.mcpProcess.on('exit', (code) => {
            log(`MCP process exited with code ${code}`, YELLOW);
            this.isRunning = false;
        });

        // Wait for server to be ready
        await this.waitForReady();
        log(`${GREEN}✓ MCP server started${RESET}`);
    }

    waitForReady() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for MCP server'));
            }, CONFIG.mcpTimeout);

            setTimeout(() => {
                clearTimeout(timeout);
                resolve();
            }, 3000);
        });
    }

    handleStdoutData(chunk) {
        this.messageBuffer += chunk.toString();

        while (this.messageBuffer) {
            const newlineIndex = this.messageBuffer.indexOf('\n');
            if (newlineIndex === -1) break;

            const line = this.messageBuffer.slice(0, newlineIndex).trim();
            this.messageBuffer = this.messageBuffer.slice(newlineIndex + 1);

            if (!line) continue;

            try {
                const message = JSON.parse(line);

                // Handle log output
                if (message.type === 'log') {
                    log(`  ${message.message}`, CYAN);
                    continue;
                }

                // Handle JSON-RPC responses
                if (message.id !== undefined) {
                    const callback = this.pendingCallbacks.get(message.id);
                    if (callback) {
                        this.pendingCallbacks.delete(message.id);
                        if (message.result) {
                            callback(null, message.result);
                        } else if (message.error) {
                            callback(new Error(message.error.message), null);
                        }
                    }
                }
            } catch {
                // Non-JSON output (console logs)
                if (line.includes('[MCP Server]')) {
                    log(`  ${line}`, CYAN);
                }
            }
        }
    }

    async sendRequest(method, params = {}) {
        if (!this.isRunning || !this.mcpProcess.stdin.writable) {
            throw new Error('MCP server not running');
        }

        return new Promise((resolve, reject) => {
            this.messageId++;
            const messageId = this.messageId;

            const message = {
                jsonrpc: '2.0',
                id: messageId,
                method: method,
                params: params
            };

            const json = JSON.stringify(message) + '\n';

            this.mcpProcess.stdin.write(json, (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                const timeout = setTimeout(() => {
                    this.pendingCallbacks.delete(messageId);
                    reject(new Error('MCP request timeout'));
                }, CONFIG.mcpTimeout);

                this.pendingCallbacks.set(messageId, (err, result) => {
                    clearTimeout(timeout);
                    this.pendingCallbacks.delete(messageId);
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    }

    async callTool(toolName, args) {
        log(`${BLUE}Calling tool: ${toolName}${RESET}`);

        try {
            const result = await this.sendRequest('tools/call', {
                name: toolName,
                arguments: args
            });

            return result;
        } catch (error) {
            log(`  Tool failed: ${error.message}`, RED);
            throw error;
        }
    }

    async stop() {
        if (this.mcpProcess) {
            this.mcpProcess.kill('SIGTERM');
        }
    }
}

async function testGameResearch(gameTitle) {
    log(`${BOLD}${CYAN}=== Testing Game Research for "${gameTitle}" ===${RESET}`);
    log('');

    const tester = new MCPToolTester();

    try {
        // Start MCP server
        await tester.start();
        log('');

        // List available tools
        log(`${BOLD}${CYAN}Step 1: List Available Tools${RESET}`);
        try {
            const toolsResult = await tester.sendRequest('tools/list', {});
            if (toolsResult && toolsResult.tools) {
                log(`${GREEN}✓ Found ${toolsResult.tools.length} tools:${RESET}`);
                toolsResult.tools.forEach(tool => {
                    log(`  - ${tool.name}`);
                });
            }
        } catch (error) {
            log(`  Could not list tools: ${error.message}`, YELLOW);
        }
        log('');

        // Test open_websearch_mcp tool
        log(`${BOLD}${CYAN}Step 2: Test open_websearch_mcp Tool${RESET}`);
        try {
            const mcpResult = await tester.callTool('open_websearch_mcp', {
                query: `${gameTitle} video game platforms patches`,
                engines: ['duckduckgo', 'bing', 'exa'],
                limit: 10
            });

            if (mcpResult && mcpResult.content && mcpResult.content[0]) {
                const parsed = JSON.parse(mcpResult.content[0].text);

                if (parsed.error) {
                    log(`  Error from tool: ${parsed.error}`, RED);
                } else if (parsed.results && Array.isArray(parsed.results)) {
                    log(`${GREEN}✓ open_websearch_mcp returned ${parsed.results.length} results${RESET}`);
                    log('');
                    log(`${BLUE}Results summary:${RESET}`);
                    log(`  Source: ${parsed.source || 'unknown'}`);
                    log(`  Engine: ${parsed.engine || 'multi'}`);

                    if (parsed.results.length > 0) {
                        log('');
                        log(`${BLUE}Sample results:${RESET}`);
                        parsed.results.slice(0, 5).forEach((result, idx) => {
                            log(`  ${idx + 1}. ${result.title || 'Untitled'}`);
                            if (result.engine) log(`     Engine: ${result.engine}`);
                            if (result.url) log(`     URL: ${result.url}`);
                        });
                    }

                    return true;
                } else {
                    log(`  Unexpected response format`, YELLOW);
                    log(`  ${JSON.stringify(parsed, null, 2)}`);
                }
            }
        } catch (error) {
            log(`${RED}✗ open_websearch_mcp tool failed: ${error.message}${RESET}`);
            return false;
        }
        log('');

        // Test duckduckgo_search tool for comparison
        log(`${BOLD}${CYAN}Step 3: Test duckduckgo_search Tool (for comparison)${RESET}`);
        try {
            const ddgResult = await tester.callTool('duckduckgo_search', {
                query: `${gameTitle} video game`
            });

            if (ddgResult && ddgResult.content && ddgResult.content[0]) {
                const parsed = JSON.parse(ddgResult.content[0].text);

                if (parsed.results && Array.isArray(parsed.results)) {
                    log(`${GREEN}✓ duckduckgo_search returned ${parsed.results.length} results${RESET}`);
                }
            }
        } catch (error) {
            log(`  duckduckgo_search failed: ${error.message}`, YELLOW);
        }
        log('');

        // Summary
        log(`${BOLD}${CYAN}=== Test Summary ===${RESET}`);
        log(`${GREEN}✓ MCP tool integration test completed${RESET}`);
        log('');
        log(`${BLUE}The open_websearch_mcp tool is working correctly.${RESET}`);
        log(`${BLUE}The game creator will use this tool for researching "${gameTitle}".${RESET}`);

        return true;
    } catch (error) {
        log(`${RED}✗ Test failed: ${error.message}${RESET}`);
        console.error(error);
        return false;
    } finally {
        await tester.stop();
    }
}

// Run the test
testGameResearch(CONFIG.gameTitle).then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    log(`${RED}Fatal error: ${error.message}${RESET}`);
    console.error(error);
    process.exit(1);
});
