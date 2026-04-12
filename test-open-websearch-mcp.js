#!/usr/bin/env node
/**
 * Open WebSearch MCP Integration Test
 *
 * This script tests the open-webSearch MCP integration end-to-end
 * by simulating the game creator research process for "Sweet Home"
 *
 * Usage:
 *   node test-open-websearch-mcp.js
 *
 * Prerequisites:
 *   - Docker with docker-compose running
 *   - open-websearch service running on localhost:3001
 *   - Game creator backend running on localhost:3000
 */

const axios = require('axios');

// Configuration
const CONFIG = {
    appHost: process.env.APP_HOST || 'http://localhost:3000',
    openWebSearchHost: process.env.OPEN_WEBSEARCH_HOST || 'http://localhost:3001',
    gameTitle: 'Sweet Home',
    timeout: 60000
};

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Logging helpers
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(message) {
    log(`${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarn(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

// Test 1: Check open-websearch service health
async function testOpenWebSearchHealth() {
    logSection('Test 1: Open WebSearch Service Health');

    try {
        const response = await axios.get(`${CONFIG.openWebSearchHost}/health`, {
            timeout: 5000
        });

        logSuccess(`Open WebSearch service is healthy`);
        logInfo(`Status: ${response.status}`);
        return true;
    } catch (error) {
        logError(`Open WebSearch service health check failed: ${error.message}`);
        logWarn(`Make sure open-websearch is running: docker-compose up -d`);
        return false;
    }
}

// Test 2: Test open-websearch search endpoint directly
async function testOpenWebSearchSearch() {
    logSection('Test 2: Open WebSearch Search Endpoint');

    const testQuery = `${CONFIG.gameTitle} video game`;

    try {
        const response = await axios.post(
            `${CONFIG.openWebSearchHost}/search`,
            {
                query: testQuery,
                limit: 10,
                engines: ['duckduckgo', 'bing', 'exa']
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const results = response.data;

        if (!results || !Array.isArray(results)) {
            logWarn(`Search returned unexpected format: ${JSON.stringify(results, null, 2)}`);
            return false;
        }

        logSuccess(`Search returned ${results.length} results`);

        // Show first few results
        if (results.length > 0) {
            logInfo(`Sample results for "${testQuery}":`);
            results.slice(0, 3).forEach((result, idx) => {
                logInfo(`  ${idx + 1}. ${result.title} (${result.engine})`);
                if (result.url) {
                    logInfo(`     URL: ${result.url}`);
                }
            });
        }

        return results.length > 0;
    } catch (error) {
        logError(`Open WebSearch search failed: ${error.message}`);
        return false;
    }
}

// Test 3: Test MCP server can call open-websearch
async function testMCPServerTool() {
    logSection('Test 3: MCP Server Tool Registration');

    // Check if the app is running and can expose MCP tools
    try {
        const response = await axios.get(`${CONFIG.appHost}/health`, {
            timeout: 5000
        });

        logSuccess(`App health check passed (status: ${response.status})`);

        // Check if MCP server is enabled
        const envCheck = await axios.get(`${CONFIG.appHost}/api/config/mcp`, {
            timeout: 5000
        }).catch(() => null);

        if (envCheck) {
            logInfo(`MCP configuration: ${JSON.stringify(envCheck.data, null, 2)}`);
        } else {
            logWarn(`Could not fetch MCP config (endpoint may not exist)`);
        }

        return true;
    } catch (error) {
        logError(`App health check failed: ${error.message}`);
        logWarn(`Make sure the app is running: docker-compose up -d`);
        return false;
    }
}

// Test 4: Full game research using agent
async function testFullGameResearch() {
    logSection('Test 4: Full Game Research (Sweet Home)');

    logInfo(`Testing full research process for game: "${CONFIG.gameTitle}"`);

    try {
        // Call the game creator research endpoint
        const startTime = Date.now();

        const response = await axios.post(
            `${CONFIG.appHost}/api/game-creator/research`,
            {
                title: CONFIG.gameTitle,
                useOpenWebSearchMCP: true
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: CONFIG.timeout
            }
        );

        const duration = Date.now() - startTime;

        if (response.data.success) {
            logSuccess(`Research completed in ${duration}ms`);

            const metadata = response.data.metadata;
            logInfo(`Extracted metadata:`);
            logInfo(`  Title: ${metadata.title || 'N/A'}`);
            logInfo(`  Developer: ${metadata.developer || 'N/A'}`);
            logInfo(`  Publisher: ${metadata.publisher || 'N/A'}`);
            logInfo(`  Platforms: ${metadata.platforms?.join(', ') || 'N/A'}`);
            logInfo(`  Genres: ${metadata.genres?.join(', ') || 'N/A'}`);
            logInfo(`  Confidence: ${response.data.confidence}`);
            logInfo(`  Source URLs: ${response.data.sourceUrls?.length || 0}`);

            return true;
        } else {
            logWarn(`Research completed but with issues: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        logError(`Full game research failed: ${error.message}`);
        logInfo(`This may be expected if the game-creator endpoint is not enabled`);
        return false;
    }
}

// Test 5: Verify open-websearch MCP tool is registered
async function testToolRegistration() {
    logSection('Test 5: Open WebSearch MCP Tool Registration');

    logInfo(`Checking if open_websearch_mcp tool is registered in MCP server...`);

    // Start the MCP server and check tools
    const { spawn } = require('child_process');
    const path = require('path');

    const mcpServerPath = path.join(__dirname, 'src/services/game-creator/mcp-server.js');

    return new Promise((resolve) => {
        const mcpProcess = spawn('node', [mcpServerPath], {
            env: {
                ...process.env,
                OPEN_WEBSEARCH_MCP_ENABLED: 'true',
                OPEN_WEBSEARCH_MCP_HOST: CONFIG.openWebSearchHost,
                OPEN_WEBSEARCH_MCP_ENGINE: 'duckduckgo'
            }
        });

        let toolsFound = false;
        let timeout = setTimeout(() => {
            mcpProcess.kill();
            logWarn(`Timeout waiting for MCP server output`);
            resolve(false);
        }, 10000);

        mcpProcess.stdout.on('data', (data) => {
            const output = data.toString();

            // Check for tool registration
            if (output.includes('open_websearch_mcp')) {
                logSuccess(`Found open_websearch_mcp tool registration in output`);
                logInfo(`Output: ${output.trim()}`);
                toolsFound = true;
                clearTimeout(timeout);
            }

            // Log other relevant output
            if (output.includes('[MCP Server]')) {
                logInfo(`MCP: ${output.trim()}`);
            }
        });

        mcpProcess.stderr.on('data', (data) => {
            logInfo(`MCP stderr: ${data.toString().trim()}`);
        });

        mcpProcess.on('exit', () => {
            clearTimeout(timeout);
            resolve(toolsFound);
        });
    });
}

// Main test runner
async function runTests() {
    logSection('Open WebSearch MCP Integration Test');
    logInfo(`Testing for game: "${CONFIG.gameTitle}"`);
    logInfo(`App host: ${CONFIG.appHost}`);
    logInfo(`Open WebSearch host: ${CONFIG.openWebSearchHost}`);
    logInfo('');

    const results = {
        openWebSearchHealth: false,
        openWebSearchSearch: false,
        mcpServerTool: false,
        toolRegistration: false,
        fullGameResearch: false
    };

    // Run tests
    results.openWebSearchHealth = await testOpenWebSearchHealth();
    logInfo('');

    if (results.openWebSearchHealth) {
        results.openWebSearchSearch = await testOpenWebSearchSearch();
        logInfo('');
    }

    results.mcpServerTool = await testMCPServerTool();
    logInfo('');

    results.toolRegistration = await testToolRegistration();
    logInfo('');

    if (results.mcpServerTool) {
        results.fullGameResearch = await testFullGameResearch();
        logInfo('');
    }

    // Summary
    logSection('Test Summary');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(v => v).length;

    Object.entries(results).forEach(([test, passed]) => {
        if (passed) {
            logSuccess(`  ${test}`);
        } else {
            logError(`  ${test}`);
        }
    });

    logInfo('');
    logInfo(`Total: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        logSuccess('');
        logSuccess('All tests passed! Open WebSearch MCP integration is working correctly.');
        logSuccess('');
        process.exit(0);
    } else {
        logWarn('');
        logWarn('Some tests failed. Check the output above for details.');
        logWarn('');
        logInfo('To fix common issues:');
        logInfo('  1. Start services: docker-compose up -d');
        logInfo('  2. Wait for services to be healthy: docker-compose ps');
        logInfo('  3. Check logs: docker-compose logs open-websearch');
        logInfo('  4. Verify environment variables in .env file');
        logInfo('');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
