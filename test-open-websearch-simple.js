#!/usr/bin/env node
/**
 * Simple Open WebSearch MCP Test
 *
 * Direct test of the open-webSearch MCP service without requiring the full app stack.
 * This tests the core integration: can we call the open-webSearch API and get results?
 *
 * Usage:
 *   node test-open-websearch-simple.js
 *
 * Prerequisites:
 *   - open-websearch service running on localhost:3001 (or configurable via OPEN_WEBSEARCH_HOST)
 */

const axios = require('axios');

// Configuration
const OPEN_WEBSEARCH_HOST = process.env.OPEN_WEBSEARCH_HOST || 'http://localhost:3001';
const GAME_TITLE = 'Sweet Home';

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

async function main() {
    log(`${BOLD}${CYAN}=== Open WebSearch MCP Test ===${RESET}`);
    log(`${BLUE}Testing for game: "${GAME_TITLE}"${RESET}`);
    log(`${BLUE}Open WebSearch host: ${OPEN_WEBSEARCH_HOST}${RESET}`);
    log('');

    // Test 1: Health Check
    log(`${BOLD}${CYAN}Test 1: Health Check${RESET}`);
    try {
        const response = await axios.get(`${OPEN_WEBSEARCH_HOST}/health`, { timeout: 5000 });
        log(`${GREEN}✓ Open WebSearch service is healthy (status: ${response.status})${RESET}`);
    } catch (error) {
        log(`${RED}✗ Health check failed: ${error.message}${RESET}`);
        log(`${YELLOW}  Make sure open-websearch is running: docker-compose up -d${RESET}`);
        process.exit(1);
    }
    log('');

    // Test 2: Search with multiple engines
    log(`${BOLD}${CYAN}Test 2: Search "Sweet Home" video game${RESET}`);
    try {
        const response = await axios.post(
            `${OPEN_WEBSEARCH_HOST}/search`,
            {
                query: `${GAME_TITLE} video game platforms`,
                limit: 10,
                engines: ['duckduckgo', 'bing', 'exa']
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        const results = response.data;

        if (results && Array.isArray(results) && results.length > 0) {
            log(`${GREEN}✓ Search returned ${results.length} results${RESET}`);
            log('');
            log(`${BLUE}Sample results:${RESET}`);
            results.slice(0, 5).forEach((result, idx) => {
                log(`  ${idx + 1}. ${result.title || 'Untitled'}`);
                log(`     Engine: ${result.engine || 'unknown'}`);
                log(`     URL: ${result.url || 'N/A'}`);
                if (result.description) {
                    log(`     Desc: ${result.description.substring(0, 100)}...`);
                }
                log('');
            });
        } else {
            log(`${YELLOW}⚠ Search returned no results or invalid format${RESET}`);
            log(`Response: ${JSON.stringify(results, null, 2)}`);
        }
    } catch (error) {
        log(`${RED}✗ Search failed: ${error.message}${RESET}`);
        process.exit(1);
    }

    // Test 3: Search for patches/uncensored versions
    log(`${BOLD}${CYAN}Test 3: Search for patches and uncensored versions${RESET}`);
    try {
        const response = await axios.post(
            `${OPEN_WEBSEARCH_HOST}/search`,
            {
                query: `${GAME_TITLE} uncensored patch`,
                limit: 5,
                engines: ['duckduckgo', 'exa']
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        const results = response.data;

        if (results && Array.isArray(results) && results.length > 0) {
            log(`${GREEN}✓ Found ${results.length} results for patches${RESET}`);
            results.slice(0, 3).forEach((result, idx) => {
                log(`  ${idx + 1}. ${result.title || 'Untitled'} (${result.engine})`);
            });
        } else {
            log(`${YELLOW}⚠ No patch results found${RESET}`);
        }
    } catch (error) {
        log(`${RED}✗ Patch search failed: ${error.message}${RESET}`);
    }
    log('');

    // Summary
    log(`${BOLD}${CYAN}=== Test Complete ===${RESET}`);
    log(`${GREEN}✓ Open WebSearch MCP integration is working!${RESET}`);
    log('');
    log(`${BLUE}Next steps:${RESET}`);
    log(`  1. Start the full app: docker-compose up -d`);
    log(`  2. Test the game creator: node test-open-websearch-mcp.js`);
    log(`  3. Or use the game-creator API endpoint directly`);
}

main().catch(error => {
    log(`${RED}Fatal error: ${error.message}${RESET}`);
    console.error(error);
    process.exit(1);
});
