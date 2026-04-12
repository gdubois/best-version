/**
 * Game Research Agent Service
 *
 * Provides agentic game research using a custom agent framework with MCP WebSearch tools.
 * The agent simulates LangChain-style reasoning by:
 * 1. Loading json_prompt.txt as the system prompt
 * 2. Thinking about what information is needed and suggesting search queries
 * 3. Executing those searches via OpenSearch MCP
 * 4. Analyzing all search results and producing complete game JSON output
 * 5. Returning structured game data following game_metadata_schema.json format
 *
 * @module services/game-creator/agent
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { createLogger } = require('./logger');

/**
 * Logger instance for agent service
 * @private
 */
const logger = createLogger('agent', { redactApiKey: false });

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
 * Agent configuration
 */
const CONFIG = {
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.2,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 8000,
    endpoint: process.env.LLM_ENDPOINT || 'http://10.0.0.15:1234/v1/chat/completions',
    model: process.env.LLM_MODEL || 'Qwen3.5-27B-Q4_K_S.gguf',
    mcpEnabled: process.env.MCP_SERVER_ENABLED !== 'false',
    mcpTimeout: parseInt(process.env.MCP_TIMEOUT) || 60000,
    maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS) || 10,
    maxSearches: parseInt(process.env.AGENT_MAX_SEARCHES) || 8,
    maxFollowUpSearches: parseInt(process.env.AGENT_MAX_FOLLOWUP_SEARCHES) || 6,
    enableMultiPass: process.env.AGENT_MULTI_PASS !== 'false'
};

/**
 * Load the json_prompt.txt file (for reference)
 * @returns {Promise<string>}
 */
async function loadJsonPrompt() {
    const promptPath = path.join(__dirname, '../../../prompts/json_prompt.txt');
    try {
        const prompt = await fs.readFile(promptPath, 'utf8');
        log('Loaded json_prompt.txt successfully', 'info', { path: promptPath, length: prompt.length });
        return prompt;
    } catch (error) {
        log(`Failed to load json_prompt.txt: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * OpenSearch MCP Search Tool
 * Provides web search capability for the agent
 */
class SearchTool {
    constructor(options = {}) {
        this.name = 'web_search';
        this.description = `Search the web for game information using OpenSearch MCP. This tool provides comprehensive search results from DuckDuckGo and other engines.`;
        this.allResults = [];
        this.sourceUrls = new Set();
        this.searchCount = 0;
        this.maxSearches = options.maxSearches || CONFIG.maxSearches;

        // MCP session state
        this.sessionId = null;
        this.mcpHost = process.env.OPEN_WEBSEARCH_MCP_HOST || 'http://localhost:3001';
    }

    async call(query) {
        log('Search tool called', 'info', { query, searchNum: this.searchCount + 1 });

        if (this.searchCount >= this.maxSearches) {
            return { results: [], message: `Maximum search limit (${this.maxSearches}) reached` };
        }

        this.searchCount++;

        try {
            // Initialize session if needed
            if (!this.sessionId) {
                try {
                    const initResponse = await axios.post(`${this.mcpHost}/mcp`, {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'initialize',
                        params: {
                            protocolVersion: '2024-11-05',
                            capabilities: {},
                            clientInfo: { name: 'best-version-agent', version: '1.0.0' }
                        }
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json, text/event-stream'
                        },
                        timeout: 10000,
                        transformResponse: [(data) => {
                            const match = data.toString().match(/data:\s*(\{[\s\S]*\}\s*)/);
                            return match ? JSON.parse(match[1]) : null;
                        }]
                    });
                    this.sessionId = initResponse.headers['mcp-session-id'] || `session-${Date.now()}`;
                    log('MCP session initialized', 'info', { sessionId: this.sessionId });
                } catch (initError) {
                    log('MCP init failed, using fallback session ID', 'warn', { error: initError.message });
                    this.sessionId = `session-${Date.now()}`;
                }
            }

            // Perform search
            const searchResponse = await axios.post(`${this.mcpHost}/mcp`, {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'search',
                    arguments: {
                        query: query,
                        engines: ['duckduckgo'],
                        limit: 10
                    }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'mcp-session-id': this.sessionId
                },
                timeout: 30000,
                transformResponse: [(data) => {
                    const match = data.toString().match(/data:\s*(\{[\s\S]*\}\s*)/);
                    return match ? JSON.parse(match[1]) : null;
                }]
            });

            // Parse results
            const result = searchResponse.data;
            let searchResults = [];

            if (result && result.result && result.result.content && Array.isArray(result.result.content)) {
                try {
                    const textContent = result.result.content[0]?.text || '';
                    const parsed = JSON.parse(textContent);
                    searchResults = parsed.results || [];
                } catch (parseError) {
                    log('Failed to parse search results', 'warn', { error: parseError.message });
                }
            }

            this.allResults.push({ query, results: searchResults });
            searchResults.forEach(r => {
                if (r.url) {
                    this.sourceUrls.add(r.url);
                }
            });

            return {
                query,
                results: searchResults,
                count: searchResults.length
            };

        } catch (error) {
            log(`Search failed: ${error.message}`, 'error');
            return { query, results: [], error: error.message };
        }
    }

    getAllResults() {
        return this.allResults;
    }

    getSourceUrls() {
        return Array.from(this.sourceUrls);
    }

    getSearchCount() {
        return this.searchCount;
    }

    // Aggregate all search results
    getAggregatedResults() {
        const allResults = [];
        this.allResults.forEach(sr => {
            sr.results.forEach(r => {
                allResults.push({ ...r, sourceQuery: sr.query });
            });
        });
        return allResults;
    }
}

/**
 * Custom Agent that orchestrates research using the LLM and search tool
 *
 * This agent implements a phased approach to avoid LLM context limits:
 * PHASE 1: Think - Suggest what searches to perform
 * PHASE 2: Search - Execute searches via OpenSearch MCP
 * PHASE 3: Analyze - Produce complete game JSON from search results
 */
class ResearchAgent {
    constructor(options = {}) {
        this.endpoint = options.endpoint || CONFIG.endpoint;
        this.model = options.model || CONFIG.model;
        this.temperature = options.temperature || CONFIG.temperature;
        this.maxTokens = options.maxTokens || CONFIG.maxTokens;
        this.maxIterations = options.maxIterations || CONFIG.maxIterations;
        this.searchTool = new SearchTool({ maxSearches: CONFIG.maxSearches });
        this.gameTitle = null;
        this.jsonPrompt = null;
        this.schema = null;
    }

    /**
     * Initialize the agent by loading prompts and schema
     */
    async initialize(gameTitle) {
        this.gameTitle = gameTitle;

        // Load json_prompt.txt
        try {
            this.jsonPrompt = await loadJsonPrompt();
            log('Loaded json_prompt.txt', 'info', { length: this.jsonPrompt.length });
        } catch (error) {
            log('Failed to load json_prompt.txt, will use inline prompts', 'warn', { error: error.message });
        }

        // Load schema
        try {
            const schemaPath = path.join(__dirname, '../../../game_metadata_schema.json');
            const schemaContent = await fs.readFile(schemaPath, 'utf8');
            this.schema = JSON.parse(schemaContent);
            log('Loaded game_metadata_schema.json', 'info');
        } catch (error) {
            log('Failed to load schema, will use inline schema', 'warn', { error: error.message });
        }

        log('Agent initialized', 'info', { gameTitle });
    }

    /**
     * Make an LLM call and return the response
     */
    async callLLM(messages, options = {}) {
        try {
            const response = await axios.post(this.endpoint, {
                model: this.model,
                messages,
                temperature: options.temperature || this.temperature,
                max_tokens: options.maxTokens || this.maxTokens,
                stream: false
            }, {
                timeout: options.timeout || 120000
            });

            return response.data.choices?.[0]?.message?.content || '';
        } catch (error) {
            log(`LLM call failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * PHASE 1: Think - Ask LLM what searches to perform
     * Uses a lightweight prompt focused only on query generation
     */
    async phase1Think() {
        log('PHASE 1: Thinking about what to search...', 'info');

        const thinkPrompt = `You are a game research assistant. Your job is to suggest targeted search queries for researching a video game.

For the game "${this.gameTitle}", suggest 5-8 SPECIFIC search queries that will help find:
1. Basic info: exact title, developer, publisher, release dates, platforms
2. Patches and mods: uncensored versions, translation patches, enhancement patches
3. Best versions: remasters, remakes, which version to play today
4. Technical info: emulator recommendations, settings

Output ONLY the search queries, one per line, no other text.
Make each query specific and actionable for web search.`;

        const messages = [
            { role: 'system', content: 'You are a helpful research assistant. Output search queries only.' },
            { role: 'user', content: thinkPrompt }
        ];

        const response = await this.callLLM(messages, { temperature: 0.3 });

        const queries = this.extractSearchQueries(response);

        if (queries.length === 0) {
            // Fallback queries
            queries.push(this.gameTitle);
            queries.push(`${this.gameTitle} video game`);
            queries.push(`${this.gameTitle} platforms release dates`);
            queries.push(`${this.gameTitle} patches mods`);
            queries.push(`${this.gameTitle} remaster remake best version`);
        }

        log('Thought phase complete - suggested queries', 'info', { count: queries.length });
        return queries;
    }

    /**
     * PHASE 2: Search - Execute the queries via OpenSearch MCP
     */
    async phase2Search(queries) {
        log('PHASE 2: Executing search queries...', 'info', { count: queries.length });

        for (const query of queries) {
            if (this.searchTool.getSearchCount() >= CONFIG.maxSearches) {
                log('Reached max search limit', 'info');
                break;
            }

            await this.searchTool.call(query);
        }

        const results = this.searchTool.getAggregatedResults();
        const urls = this.sourceUrls = this.searchTool.getSourceUrls();

        log('Search phase complete', 'info', {
            searchesPerformed: this.searchTool.getSearchCount(),
            totalResults: results.length,
            uniqueUrls: urls.length
        });

        return { results, urls };
    }

    /**
     * PHASE 2B: Analyze initial results and generate follow-up queries
     * Identifies gaps in data and suggests targeted searches for patches, translations, etc.
     */
    async phase2bAnalyzeResults(results, urls) {
        if (!CONFIG.enableMultiPass) {
            log('Multi-pass search disabled, skipping follow-up analysis', 'info');
            return [];
        }

        log('PHASE 2B: Analyzing results for follow-up queries...', 'info');

        const followUpQueries = [];
        const gameTitle = this.gameTitle;

        // Scan results for indicators that need follow-up searches
        const resultsText = results.map(r => (r.title || '') + ' ' + (r.description || '')).join(' ').toLowerCase();
        const urlsText = urls.join(' ').toLowerCase();

        // Check for Japanese-only games needing translation patches
        if (resultsText.includes('japan') || resultsText.includes('japanese') ||
            resultsText.includes('ps1') || resultsText.includes('playstation 1') ||
            resultsText.includes('snes') || resultsText.includes('sn-es')) {
            if (!resultsText.includes('english translation')) {
                followUpQueries.push(`${gameTitle} romhacking translation patch`);
                followUpQueries.push(`${gameTitle} English patch download`);
            }
        }

        // Check for PC games - search PCGamingWiki
        if (urlsText.includes('pc') || resultsText.includes('pc') ||
            resultsText.includes('windows') || resultsText.includes('steam')) {
            followUpQueries.push(`site:pcgamingwiki.com ${gameTitle} patches fixes`);
        }

        // Always add dedicated patch searches for better coverage
        followUpQueries.push(`${gameTitle} enhancement patch list`);
        followUpQueries.push(`${gameTitle} quality of life patch`);

        // Search romhacking.net for retro games
        if (resultsText.includes('rom') || resultsText.includes('emulator') ||
            resultsText.includes('sn-es') || resultsText.includes('gb') ||
            resultsText.includes('game boy') || resultsText.includes('playstation')) {
            followUpQueries.push(`site:romhacking.net ${gameTitle} patch`);
        }

        // Search for fan translations
        if (resultsText.includes('translation') || resultsText.includes('localization')) {
            followUpQueries.push(`${gameTitle} fan translation patch vimm`);
        }

        // Search for mod managers and modding community
        followUpQueries.push(`${gameTitle} mod nexusmods moddb`);

        // Remove duplicates and limit to maxFollowUpSearches
        const uniqueQueries = [...new Set(followUpQueries)];
        const finalQueries = uniqueQueries.slice(0, CONFIG.maxFollowUpSearches);

        log('Follow-up queries generated', 'info', { count: finalQueries.length, queries: finalQueries });

        return finalQueries;
    }

    /**
     * PHASE 2C: Execute follow-up searches
     * Performs targeted searches for patches, translations, and missing info
     */
    async phase2cExecuteFollowUpQueries(queries) {
        if (!CONFIG.enableMultiPass || queries.length === 0) {
            log('No follow-up searches to execute', 'info');
            return { results: [], urls: [] };
        }

        log('PHASE 2C: Executing follow-up searches...', 'info', { count: queries.length });

        // Create a temporary search tool for follow-up (shares session with main tool)
        const followUpSearchTool = new SearchTool({
            maxSearches: CONFIG.maxSearches + CONFIG.maxFollowUpSearches
        });

        // Reuse the existing search tool's state
        followUpSearchTool.allResults = this.searchTool.getAllResults();
        followUpSearchTool.searchCount = this.searchTool.getSearchCount();
        followUpSearchTool.sourceUrls = this.searchTool.sourceUrls;

        // Execute follow-up queries
        for (const query of queries) {
            const currentCount = followUpSearchTool.getSearchCount();
            const totalLimit = CONFIG.maxSearches + CONFIG.maxFollowUpSearches;

            if (currentCount >= totalLimit) {
                log('Reached total search limit, stopping follow-up', 'info');
                break;
            }

            // Set max searches to allow follow-up
            followUpSearchTool.maxSearches = totalLimit;
            await followUpSearchTool.call(query);
        }

        // Update the main search tool with follow-up results
        this.searchTool.allResults = followUpSearchTool.getAllResults();
        this.searchTool.sourceUrls = followUpSearchTool.sourceUrls;
        this.searchTool.searchCount = followUpSearchTool.getSearchCount();

        const results = this.searchTool.getAggregatedResults();
        const urls = this.searchTool.getSourceUrls();

        log('Follow-up search phase complete', 'info', {
            totalSearches: this.searchTool.getSearchCount(),
            totalResults: results.length,
            uniqueUrls: urls.length
        });

        return { results, urls };
    }

    /**
     * PHASE 3: Analyze - Produce complete game JSON from search results
     * Uses json_prompt.txt instructions + search results
     */
    async phase3Analyze(searchResults, sourceUrls, isMultiPass = false) {
        log('PHASE 3: Analyzing search results and generating JSON...', 'info');

        // Format search results for the prompt - use more results if multi-pass enabled
        const maxResults = isMultiPass ? 20 : 10;
        const resultsText = searchResults.slice(0, maxResults).map((r, i) =>
            `${i + 1}. ${r.title || 'No title'}\n   Description: ${r.description ? r.description.substring(0, 200) : 'No description'}\n   URL: ${r.url || ''}`
        ).join('\n\n');

        // Build a concise version of json_prompt.txt instructions
        const instructions = this.buildAnalysisInstructions();

        // Simplified schema for the LLM to output with explicit patch requirements
        const simpleSchema = {
            title: "string - exact game title",
            alternativeTitles: "array of strings - alternative names",
            platforms: "array of objects: {name: string, region: string, release_date: YYYY-MM-DD}",
            genres: "array of strings - game genres",
            description: "string - comprehensive game description",
            synopsis: "string - brief summary",
            developers: "array of strings - developer names",
            publishers: "array of strings - publisher names",
            features: "array of strings - key gameplay features",
            themes: "array of strings - narrative/visual themes",
            play_today: "array of objects (max 3 platforms, ranked best to worst): {platform: string, details: string (200-300 chars), available_in_english: {official_localization: boolean}, recommended_patches: array of {name: string, description: string (detailed explanation of what the patch does), url: string (direct link)}, emulators: array of strings}",
            reception: {
                scores: "array of numbers - review scores",
                reviews: "array of strings - review summaries",
                legacy: "string - historical impact"
            },
            serie: "object or null: {is_part_of_serie: boolean, serie_name: string, part_number: integer}",
            similarGames: "array of strings - similar game titles"
        };

        const patchExample = {
            name: "Combat Redux Patch",
            description: "A major gameplay overhaul that modernizes the combat system with improved controls, new attack options, and enhanced visual effects.",
            url: "https://www.example.com/patch/123"
        };

        const multiPassNote = isMultiPass
            ? "This search included dedicated follow-up queries for patches, translations, and mods. Use ALL available data to find the best patches and most accurate information."
            : "Use the search results to find patches, translations, and mods when available.";

        const analyzePrompt = `${instructions}

=== YOUR TASK ===

Using the search results below, generate a COMPLETE JSON object for the game "${this.gameTitle}".

${multiPassNote}

The JSON MUST follow this simplified structure (output VALID JSON only, no markdown):
${JSON.stringify(simpleSchema, null, 2)}

=== CRITICAL REQUIREMENTS FOR PATCHES ===

For EACH recommended patch, you MUST provide:
1. name: The exact name of the patch
2. description: A detailed explanation of what the patch does (NOT just repeating the name)
3. url: Direct link to download or access the patch

PATCH EXAMPLE:
${JSON.stringify(patchExample, null, 2)}

BAD PATCH (do NOT do this):
{"name": "Legend of Mana Patch", "description": "Legend of Mana Patch"} - Description repeats name!

GOOD PATCH (do this):
{"name": "Legend of Mana English Translation Patch", "description": "Unofficial English translation patch that converts all Japanese text to English, including dialogue, menus, and item descriptions. Highly recommended for playing the original PS1 version.", "url": "https://www.romhacking.net/hacks/2085/"}

=== SEARCH RESULTS ===
${resultsText || 'No search results available'}

=== ADDITIONAL SOURCE URLs ===
${sourceUrls.slice(0, 30).join('\n')}

Generate the complete JSON now. Output ONLY valid JSON, no other text.`;

        const messages = [
            { role: 'system', content: 'You are a game data generator. Output valid JSON only, no markdown, no explanations.' },
            { role: 'user', content: analyzePrompt }
        ];

        const response = await this.callLLM(messages, {
            temperature: 0.1,
            maxTokens: this.maxTokens,
            timeout: 180000
        });

        log('Analysis phase - got response', 'info', { length: response.length });

        // Call the module-level parseJSONResponse function
        return parseJSONResponse(response);
    }

    /**
     * Build concise analysis instructions from json_prompt.txt key concepts
     */
    buildAnalysisInstructions() {
        if (this.jsonPrompt) {
            // Extract key sections from json_prompt.txt
            return `I am creating a website about the BEST VERSION available for each game.
You must use the search results to generate accurate game metadata.

KEY REQUIREMENTS:
1. Platform names must follow standard naming (e.g., "PlayStation", "Windows", "Nintendo Switch")
2. Release dates in YYYY-MM-DD format
3. "play_today" array ranked from BEST to WORST way to play (max 3 platforms)
4. Include specific patches with direct URLs when found
5. Include emulator recommendations for retro games
6. Themes should be specific (not just "Classic" or "Retro")
7. Key features should describe specific gameplay innovations
8. Legacy_and_impact should describe historical significance

The game "${this.gameTitle}" must be researched thoroughly using the provided search results.`;
        }

        // Fallback instructions
        return `Generate complete game metadata for "${this.gameTitle}" using the search results.
Focus on finding the best version to play today.`;
    }

    /**
     * Parse search queries from LLM response
     */
    extractSearchQueries(content) {
        const queries = [];

        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 5);

        for (const line of lines) {
            let query = line
                .replace(/^[•\-*0-9]+\.?\s*/, '')
                .replace(/^["']|["']$/g, '')
                .trim();

            if (query.length < 10 || query.toLowerCase().includes('json')) {
                continue;
            }

            queries.push(query);
        }

        return queries.slice(0, 8);
    }

    /**
     * Run the complete agent research pipeline
     */
    async run() {
        log('Starting agent research pipeline', 'info', {
            multiPassEnabled: CONFIG.enableMultiPass,
            maxSearches: CONFIG.maxSearches,
            maxFollowUpSearches: CONFIG.maxFollowUpSearches
        });

        let results = [];
        let urls = [];
        let isMultiPass = false;

        try {
            // PHASE 1: Think
            const queries = await this.phase1Think();

            // PHASE 2: Search
            const searchResult = await this.phase2Search(queries);
            results = searchResult.results;
            urls = searchResult.urls;

            // PHASE 2B: Analyze for follow-up queries
            const followUpQueries = await this.phase2bAnalyzeResults(results, urls);

            // PHASE 2C: Execute follow-up searches (multi-pass)
            if (followUpQueries.length > 0) {
                const followUpResult = await this.phase2cExecuteFollowUpQueries(followUpQueries);
                results = followUpResult.results;
                urls = followUpResult.urls;
                isMultiPass = true;
            }

            // PHASE 3: Analyze and generate JSON
            log('Starting PHASE 3: Analyze', 'info', {
                resultsCount: results.length,
                urlsCount: urls.length,
                multiPass: isMultiPass,
                totalSearches: this.searchTool.getSearchCount()
            });
            const jsonData = await this.phase3Analyze(results, urls, isMultiPass);

            if (!jsonData.success) {
                log('JSON parsing failed, using fallback', 'warn', { error: jsonData.error, rawLength: jsonData.raw?.length });
                return this.generateFallbackJSON(results, urls);
            }

            log('Agent research pipeline complete', 'info', {
                multiPass: isMultiPass,
                totalSearches: this.searchTool.getSearchCount()
            });

            return {
                success: true,
                data: jsonData.data,
                searchResults: results,
                sourceUrls: urls,
                queriesExecuted: this.searchTool.getAllResults().map(sr => sr.query),
                multiPass: isMultiPass,
                confidence: 0.85
            };

        } catch (error) {
            log('Agent research pipeline failed', 'error', {
                error: error.message,
                stack: error.stack,
                searchResults: results?.length || 0,
                sourceUrls: urls?.length || 0
            });

            // Fallback: use what we have
            return this.generateFallbackJSON(results, urls);
        }
    }

    /**
     * Generate fallback JSON when LLM fails
     */
    async generateFallbackJSON(existingResults = [], existingUrls = []) {
        log('Generating fallback JSON', 'info', { existingResults: existingResults.length, existingUrls: existingUrls.length });

        // Try additional searches if we haven't hit the limit
        const fallbackQueries = [
            this.gameTitle,
            `${this.gameTitle} video game`,
            `${this.gameTitle} platforms versions`,
            `${this.gameTitle} patch mod uncensored`
        ];

        for (const query of fallbackQueries) {
            if (this.searchTool.getSearchCount() < CONFIG.maxSearches) {
                await this.searchTool.call(query);
            }
        }

        // Use search tool's aggregated results, falling back to what was passed in
        const finalResults = this.searchTool.getAggregatedResults().length > 0
            ? this.searchTool.getAggregatedResults()
            : existingResults;
        const finalUrls = this.searchTool.getSourceUrls().length > 0
            ? this.searchTool.getSourceUrls()
            : existingUrls;

        return {
            success: true,
            data: {
                title: this.gameTitle,
                platforms: [],
                genres: [],
                description: `Research data gathered from ${finalUrls.length} sources`,
                play_today: [],
                confidence: 0.5,
                sources: finalUrls
            },
            searchResults: finalResults,
            sourceUrls: finalUrls,
            fallback: true,
            confidence: 0.5,
            multiPass: false
        };
    }
}

/**
 * Research a game using the agent
 * @param {string} gameTitle
 * @returns {Promise<Object>}
 */
async function researchGameWithAgent(gameTitle) {
    log('Starting agent research for game', 'info', { title: gameTitle });

    const startTime = Date.now();

    try {
        // Create and initialize agent
        const agent = new ResearchAgent({
            endpoint: CONFIG.endpoint,
            model: CONFIG.model,
            temperature: CONFIG.temperature,
            maxTokens: CONFIG.maxTokens,
            maxIterations: CONFIG.maxIterations
        });

        await agent.initialize(gameTitle);

        // Run the complete agent pipeline (Think → Search → Analyze)
        const result = await agent.run();

        const duration = Date.now() - startTime;

        if (!result.success) {
            log('Agent research failed', 'warn', { duration });
            return {
                success: false,
                error: 'Agent research failed',
                gameTitle,
                duration
            };
        }

        log('Agent research completed successfully', 'info', {
            searchesPerformed: agent.searchTool.getSearchCount(),
            totalResults: result.searchResults?.length || 0,
            sourceUrls: result.sourceUrls?.length || 0,
            duration
        });

        // Return the complete game data from the agent
        return {
            success: true,
            metadata: result.data || {
                title: gameTitle,
                platforms: [],
                genres: [],
                description: 'Research completed',
                play_today: [],
                sources: result.sourceUrls || [],
                confidence: result.confidence || 0.7
            },
            confidence: result.confidence || 0.7,
            sourceUrls: result.sourceUrls || [],
            duration,
            queriesExecuted: result.queriesExecuted || []
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        log('Agent research failed', 'error', { error: error.message, duration });

        return {
            success: false,
            error: error.message,
            gameTitle,
            duration
        };
    }
}

/**
 * Calculate confidence score based on metadata completeness
 */
function calculateConfidence(metadata) {
    let score = 0.2;

    if (metadata.basic_info?.title) score += 0.1;
    if (metadata.basic_info?.developers) score += 0.15;
    if (metadata.basic_info?.publishers) score += 0.1;
    if (metadata.release?.platforms && metadata.release.platforms.length > 0) score += 0.15;
    if (metadata.basic_info?.genres && metadata.basic_info.genres.length > 0) score += 0.1;
    if (metadata.description?.synopsis) score += 0.1;
    if (metadata.release?.platforms) {
        const hasDates = metadata.release.platforms.some(p => p.release_date && !p.release_date.includes('0000-00-00'));
        if (hasDates) score += 0.05;
    }
    if (metadata.sourceUrls && metadata.sourceUrls.length > 0) score += 0.05;

    return Math.min(score, 0.95);
}

/**
 * Get agent configuration
 */
function getConfig() {
    return {
        temperature: CONFIG.temperature,
        maxTokens: CONFIG.maxTokens,
        endpoint: CONFIG.endpoint,
        model: CONFIG.model,
        mcpEnabled: CONFIG.mcpEnabled,
        mcpTimeout: CONFIG.mcpTimeout,
        maxIterations: CONFIG.maxIterations,
        maxSearches: CONFIG.maxSearches,
        maxFollowUpSearches: CONFIG.maxFollowUpSearches,
        enableMultiPass: CONFIG.enableMultiPass
    };
}

/**
 * Perform web searches (kept for backward compatibility)
 */
async function performSearches(gameTitle) {
    log('Performing web searches via MCP', 'info', { title: gameTitle });

    const searchTool = new SearchTool();
    const queriesExecuted = [];

    const searchQueries = [
        gameTitle,
        `${gameTitle} video game`,
        `${gameTitle} platforms versions`,
        `${gameTitle} patch mod uncensored`,
        `${gameTitle} remaster remake`
    ];

    for (const query of searchQueries) {
        try {
            await searchTool.call(query);
            queriesExecuted.push(`OpenSearchMCP: ${query}`);
        } catch (error) {
            log('Search failed for "' + query + '": ' + error.message, 'warn');
        }
    }

    return {
        queries: queriesExecuted,
        results: searchTool.getAllResults(),
        sourceUrls: searchTool.getSourceUrls()
    };
}

/**
 * Parse JSON from LLM response
 */
function parseJSONResponse(response) {
    if (!response) {
        return { success: false, error: 'Empty response' };
    }

    let jsonStr = response || '';
    jsonStr = jsonStr.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    try {
        const data = JSON.parse(jsonStr);
        return { success: true, data, raw: response };
    } catch (error) {
        log('Failed to parse JSON: ' + error.message, 'error');
        return { success: false, error: error.message, raw: response };
    }
}

module.exports = {
    researchGameWithAgent,
    parseJSONResponse,
    performSearches,
    calculateConfidence,
    getConfig,
    loadJsonPrompt,
    CONFIG,
    ResearchAgent,
    SearchTool
};
