/**
 * MCP (Model Context Protocol) Client
 *
 * Connects to MCP server via stdio transport and provides
 * LangChain-compatible tool wrapping.
 *
 * @module services/game-creator/mcp-client
 */

const { spawn } = require('child_process');
const path = require('path');
const { createLogger } = require('./logger');

/**
 * Logger instance for MCP client
 * @private
 */
const logger = createLogger('mcpClient', { redactApiKey: false });

/**
 * Logger helper (wraps structured logger)
 * @private
 */
async function log(message, level = 'info', context = {}) {
    switch (level) {
        case 'debug':
            await logger.debug(message, context);
            break;
        case 'warn':
            await logger.warn(message, context);
            break;
        case 'error':
            await logger.error(message, context);
            break;
        default:
            await logger.info(message, context);
    }
}

/**
 * MCP Tool Provider
 *
 * Manages the MCP server process and provides tool invocation
 */
class MCPToolProvider {
    constructor() {
        this.mcpProcess = null;
        this.isRunning = false;
        this.tools = [];
        this.writeBuffer = '';
        this.messageHandlers = new Map();
        this.nextMessageId = 1;
    }

    /**
     * Start the MCP server process
     * @returns {Promise<void>}
     */
    async start() {
        if (this.isRunning) {
            log('MCP server already running', 'warn');
            return;
        }

        log('Starting MCP server process', 'info');

        const mcpServerPath = path.join(__dirname, 'mcp-server.js');

        try {
            this.mcpProcess = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });

            this.isRunning = true;

            // Handle process errors
            this.mcpProcess.on('error', (error) => {
                log(`MCP process error: ${error.message}`, 'error');
                this.isRunning = false;
            });

            // Handle process exit
            this.mcpProcess.on('exit', (code, signal) => {
                log(`MCP process exited: code=${code}, signal=${signal}`, 'info');
                this.isRunning = false;
            });

            // Handle stdout - parse JSON-RPC messages
            let buffer = '';
            this.mcpProcess.stdout.on('data', (chunk) => {
                buffer += chunk.toString();

                // Parse complete JSON lines
                while (buffer) {
                    const newlineIndex = buffer.indexOf('\n');
                    if (newlineIndex === -1) {
                        break;
                    }

                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);

                    if (!line) continue;

                    try {
                        const message = JSON.parse(line);
                        this.handleMessage(message);
                    } catch (error) {
                        // Log non-JSON output (likely console logs from server)
                        log(`MCP server output: ${line}`, 'debug');
                    }
                }
            });

            // Handle stderr
            this.mcpProcess.stderr.on('data', (data) => {
                const stderr = data.toString().trim();
                if (stderr) {
                    log(`MCP stderr: ${stderr}`, 'debug');
                }
            });

            // Wait for server to be ready
            await this.waitForReady();

            // List available tools
            await this.listTools();

            log('MCP server started successfully', 'info');

        } catch (error) {
            log(`Failed to start MCP server: ${error.message}`, 'error');
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * Wait for server to indicate it's ready
     * @private
     */
    waitForReady() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for MCP server to start'));
            }, 10000);

            const checkReady = () => {
                // MCP server logs "ready" when started
                // We'll consider it ready if we can send a message
                clearTimeout(timeout);
                resolve();
            };

            // Give server a moment to initialize
            setTimeout(checkReady, 1000);
        });
    }

    /**
     * Handle incoming JSON-RPC messages
     * @private
     */
    handleMessage(message) {
        log('Received MCP message', 'debug', { method: message.method, id: message.id });

        // Handle notifications
        if (!message.id && message.method) {
            const handler = this.messageHandlers.get(message.method);
            if (handler) {
                handler(message.params || {});
            }
            return;
        }

        // Handle responses
        if (message.id !== undefined) {
            const handler = this.messageHandlers.get(`response:${message.id}`);
            if (handler) {
                if (message.result) {
                    handler(null, message.result);
                } else if (message.error) {
                    handler(new Error(message.error.message), null);
                }
                this.messageHandlers.delete(`response:${message.id}`);
            }
        }
    }

    /**
     * Send a JSON-RPC request to the MCP server
     * @private
     */
    async sendRequest(method, params = {}) {
        if (!this.isRunning || !this.mcpProcess.stdin.writable) {
            throw new Error('MCP server not running');
        }

        return new Promise((resolve, reject) => {
            this.nextMessageId++;
            const messageId = this.nextMessageId;

            const message = {
                jsonrpc: '2.0',
                id: messageId,
                method,
                params
            };

            const json = JSON.stringify(message) + '\n';

            this.mcpProcess.stdin.write(json, (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                // Wait for response
                const timeout = setTimeout(() => {
                    this.messageHandlers.delete(`response:${messageId}`);
                    reject(new Error('MCP request timeout'));
                }, 60000); // 60 second timeout

                this.messageHandlers.set(`response:${messageId}`, (err, result) => {
                    clearTimeout(timeout);
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    }

    /**
     * List available tools
     * @returns {Promise<Array>}
     */
    async listTools() {
        try {
            const result = await this.sendRequest('tools/list');
            this.tools = result.tools || [];
            log(`Discovered ${this.tools.length} MCP tools`, 'info', {
                toolNames: this.tools.map(t => t.name).join(', ')
            });
            return this.tools;
        } catch (error) {
            log(`Failed to list tools: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Call a tool with arguments
     * @param {string} toolName - Name of the tool
     * @param {Object} args - Tool arguments
     * @returns {Promise<Object>}
     */
    async callTool(toolName, args) {
        log(`Calling MCP tool: ${toolName}`, 'info', { args });

        try {
            const result = await this.sendRequest('tools/call', {
                name: toolName,
                arguments: args
            });

            log(`Tool ${toolName} returned`, 'debug', { result });

            return result;
        } catch (error) {
            log(`Tool ${toolName} failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Stop the MCP server process
     * @returns {Promise<void>}
     */
    async stop() {
        if (!this.isRunning || !this.mcpProcess) {
            return;
        }

        log('Stopping MCP server process', 'info');

        try {
            // Send exit notification
            try {
                await this.sendRequest('notifications/exit');
            } catch (error) {
                // Ignore errors during shutdown
            }

            // Wait briefly for graceful shutdown
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Force kill if still running
            if (this.mcpProcess.killed === false) {
                this.mcpProcess.kill('SIGTERM');

                // Wait for exit
                await new Promise(resolve => {
                    const timeout = setTimeout(() => {
                        this.mcpProcess.kill('SIGKILL');
                        resolve();
                    }, 5000);

                    this.mcpProcess.on('exit', () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
            }

        } catch (error) {
            log(`Error during shutdown: ${error.message}`, 'error');
            this.mcpProcess.kill('SIGKILL');
        }

        this.isRunning = false;
        this.mcpProcess = null;
        log('MCP server stopped', 'info');
    }

    /**
     * Check if server is running
     * @returns {boolean}
     */
    isServerRunning() {
        return this.isRunning && this.mcpProcess && !this.mcpProcess.killed;
    }

    /**
     * Get available tools
     * @returns {Array}
     */
    getTools() {
        return [...this.tools];
    }

    /**
     * Get a specific tool by name
     * @param {string} toolName
     * @returns {Object|undefined}
     */
    getTool(toolName) {
        return this.tools.find(t => t.name === toolName);
    }
}

/**
 * Convert MCP tools to LangChain-compatible tool format
 * @param {MCPToolProvider} mcpClient - MCP client instance
 * @returns {Array} LangChain tools
 */
function convertToLangChainTools(mcpClient) {
    return mcpClient.getTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        schema: tool.inputSchema,
        func: async (args) => {
            try {
                const result = await mcpClient.callTool(tool.name, args);
                // Return content as text
                if (result.content && result.content[0]) {
                    return result.content[0].text;
                }
                return JSON.stringify(result);
            } catch (error) {
                return `Error: ${error.message}`;
            }
        }
    }));
}

module.exports = {
    MCPToolProvider,
    convertToLangChainTools
};
