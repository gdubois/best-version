/**
 * Game Research Agent Service - 3-Phase Architecture
 *
 * Provides agentic game research using a phased approach:
 * PHASE 1: Research - Collect basic game metadata (developer, platforms, release dates)
 * PHASE 2: Evaluate - Determine best versions to play, find consensus
 * PHASE 3: Patches - Find patches, mods, enhancements for best versions
 *
 * Each phase:
 * - Loads its own prompt file from disk
 * - Performs up to 10 web searches + 10 follow-up searches
 * - Builds on data from previous phases
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
    maxSearches: parseInt(process.env.AGENT_MAX_SEARCHES) || 10,
    maxFollowUpSearches: parseInt(process.env.AGENT_MAX_FOLLOWUP_SEARCHES) || 10,
    enableMultiPass: process.env.AGENT_MULTI_PASS !== 'false',
    enablePhasedMode: process.env.AGENT_PHASED_MODE !== 'false'
};

/**
 * OpenSearch MCP Search Tool
 * Provides web search capability for the agent
 */
class SearchTool {
    constructor(options = {}) {
        this.name = 'web_search';
        this.description = `Search the web for game information using OpenSearch MCP.`;
        this.allResults = [];
        this.sourceUrls = new Set();
        this.searchCount = 0;
        this.maxSearches = options.maxSearches || CONFIG.maxSearches;
        this.sessionId = null;
        this.mcpHost = process.env.OPEN_WEBSEARCH_MCP_HOST || 'http://localhost:3001';
    }

    // Reset search tool for new phase
    reset() {
        this.allResults = [];
        this.sourceUrls = new Set();
        this.searchCount = 0;
    }

    async call(query) {
        if (this.searchCount >= this.maxSearches) {
            return { results: [], message: `Maximum search limit reached` };
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
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
                        timeout: 10000,
                        transformResponse: [(data) => {
                            const match = data.toString().match(/data:\s*(\{[\s\S]*\}\s*)/);
                            return match ? JSON.parse(match[1]) : null;
                        }]
                    });
                    this.sessionId = initResponse.headers['mcp-session-id'] || `session-${Date.now()}`;
                } catch {
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
                } catch {
                    log('Failed to parse search results', 'warn');
                }
            }

            this.allResults.push({ query, results: searchResults });
            searchResults.forEach(r => {
                if (r.url) this.sourceUrls.add(r.url);
            });

            return { query, results: searchResults, count: searchResults.length };

        } catch (error) {
            log(`Search failed: ${error.message}`, 'error');
            return { query, results: [], error: error.message };
        }
    }

    getAllResults() { return this.allResults; }
    getSourceUrls() { return Array.from(this.sourceUrls); }
    getSearchCount() { return this.searchCount; }

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
 * 3-Phase Research Agent
 *
 * Phase 1: Research - Collect basic game metadata
 * Phase 2: Evaluate - Determine best versions to play
 * Phase 3: Patches - Find patches/mods for best versions
 */
class ResearchAgent {
    constructor(options = {}) {
        this.endpoint = options.endpoint || CONFIG.endpoint;
        this.model = options.model || CONFIG.model;
        this.temperature = options.temperature || CONFIG.temperature;
        this.maxTokens = options.maxTokens || CONFIG.maxTokens;
        this.gameTitle = null;

        // Phase prompt files
        this.jsonPhase1 = null;
        this.jsonPhase2 = null;
        this.jsonPhase3 = null;

        // Phase data accumulation
        this.phase1Data = null;
        this.phase2Data = null;
        this.phase3Data = null;

        // Search tools for each phase
        this.phase1SearchTool = new SearchTool({ maxSearches: CONFIG.maxSearches });
        this.phase2SearchTool = new SearchTool({ maxSearches: CONFIG.maxSearches });
        this.phase3SearchTool = new SearchTool({ maxSearches: CONFIG.maxSearches });
    }

    /**
     * Initialize the agent by loading all phase prompt files
     */
    async initialize(gameTitle) {
        this.gameTitle = gameTitle;

        // Load Phase 1 prompt
        try {
            const phase1Path = path.join(__dirname, '../../../prompts/json_phase1.txt');
            this.jsonPhase1 = await fs.readFile(phase1Path, 'utf8');
            log('Loaded json_phase1.txt', 'info', { length: this.jsonPhase1.length });
        } catch (error) {
            log(`Failed to load json_phase1.txt: ${error.message}`, 'error');
        }

        // Load Phase 2 prompt
        try {
            const phase2Path = path.join(__dirname, '../../../prompts/json_phase2.txt');
            this.jsonPhase2 = await fs.readFile(phase2Path, 'utf8');
            log('Loaded json_phase2.txt', 'info', { length: this.jsonPhase2.length });
        } catch (error) {
            log(`Failed to load json_phase2.txt: ${error.message}`, 'error');
        }

        // Load Phase 3 prompt
        try {
            const phase3Path = path.join(__dirname, '../../../prompts/json_phase3.txt');
            this.jsonPhase3 = await fs.readFile(phase3Path, 'utf8');
            log('Loaded json_phase3.txt', 'info', { length: this.jsonPhase3.length });
        } catch (error) {
            log(`Failed to load json_phase3.txt: ${error.message}`, 'error');
        }

        log('Agent initialized for 3-phase research', 'info', { gameTitle });
    }

    /**
     * Make an LLM call
     */
    async callLLM(messages, options = {}) {
        try {
            const response = await axios.post(this.endpoint, {
                model: this.model,
                messages,
                temperature: options.temperature || this.temperature,
                max_tokens: options.maxTokens || this.maxTokens,
                stream: false
            }, { timeout: options.timeout || 120000 });

            return response.data.choices?.[0]?.message?.content || '';
        } catch (error) {
            log(`LLM call failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate search queries for a phase
     */
    async generateSearchQueries(phaseName, phasePrompt, contextData) {
        log(`Generating search queries for ${phaseName}`, 'info');

        const queryPrompt = `You are a research planner. For the game "${this.gameTitle}", generate ${CONFIG.maxSearches} SPECIFIC search queries that will gather information for:

${phasePrompt.substring(0, 1000)}

Output ONLY the search queries as a JSON array, one query per element.
Make each query specific and actionable for web search.
Example: ["${this.gameTitle} developer publisher release date", "${this.gameTitle} platforms release dates list"]

Output JSON array only, no other text.`;

        const response = await this.callLLM([
            { role: 'system', content: 'Output JSON array of search queries only.' },
            { role: 'user', content: queryPrompt }
        ], { temperature: 0.3 });

        try {
            const queries = JSON.parse(response);
            if (Array.isArray(queries)) {
                log(`Generated ${queries.length} queries for ${phaseName}`, 'info');
                return queries.slice(0, CONFIG.maxSearches);
            }
        } catch {
            // Fallback queries
            log('Query generation failed, using fallback', 'warn');
        }

        // Fallback queries based on phase
        return this.getFallbackQueries(phaseName);
    }

    getFallbackQueries(phaseName) {
        if (phaseName === 'Phase1') {
            return [
                `${this.gameTitle} developer publisher release dates platforms`,
                `${this.gameTitle} Wikipedia`,
                `${this.gameTitle} Mobygames release dates`,
                `${this.gameTitle} genres themes description`,
                `${this.gameTitle} Metacritic scores reviews`,
                `${this.gameTitle} series sequels prequels`,
                `${this.gameTitle} similar games`,
                `${this.gameTitle} reception legacy impact`,
                `${this.gameTitle} key features gameplay mechanics`,
                `${this.gameTitle} synopsis summary`
            ];
        }
        if (phaseName === 'Phase2') {
            return [
                `${this.gameTitle} best version to play`,
                `${this.gameTitle} remaster vs original comparison`,
                `${this.gameTitle} DS vs SNES vs PlayStation`,
                `${this.gameTitle} definitive version Reddit`,
                `${this.gameTitle} which version should I buy`,
                `${this.gameTitle} version differences comparison`,
                `${this.gameTitle} Digital Foundry`,
                `${this.gameTitle} Metacritic all platforms comparison`,
                `${this.gameTitle} best way to play 2024 2025`,
                `${this.gameTitle} community consensus best version`
            ];
        }
        if (phaseName === 'Phase3') {
            return [
                `site:romhacking.net ${this.gameTitle} patch`,
                `site:pcgamingwiki.com ${this.gameTitle}`,
                `${this.gameTitle} enhancement patch list`,
                `${this.gameTitle} bugfix patch`,
                `${this.gameTitle} translation patch`,
                `${this.gameTitle} high resolution patch`,
                `${this.gameTitle} widescreen patch`,
                `site:nexusmods.com ${this.gameTitle}`,
                `${this.gameTitle} quality of life mod`,
                `${this.gameTitle} emulator best settings`
            ];
        }
        return [this.gameTitle];
    }

    /**
     * Execute searches and get follow-up queries
     */
    async executePhaseSearches(searchTool, queries, phaseName) {
        log(`Executing ${phaseName} searches...`, 'info', { count: queries.length });

        // Initial searches
        for (const query of queries) {
            if (searchTool.getSearchCount() >= CONFIG.maxSearches) break;
            await searchTool.call(query);
        }

        // Generate follow-up queries based on results
        if (CONFIG.enableMultiPass && searchTool.getSearchCount() < CONFIG.maxSearches) {
            const followUpPrompts = await this.generateFollowUpQueries(searchTool, phaseName);
            for (const query of followUpPrompts) {
                if (searchTool.getSearchCount() >= CONFIG.maxSearches) break;
                await searchTool.call(query);
            }
        }

        log(`${phaseName} search complete`, 'info', {
            searches: searchTool.getSearchCount(),
            results: searchTool.getAggregatedResults().length
        });

        return {
            results: searchTool.getAggregatedResults(),
            urls: searchTool.getSourceUrls()
        };
    }

    /**
     * Generate follow-up queries based on initial results
     */
    async generateFollowUpQueries(searchTool, phaseName) {
        const resultsText = searchTool.getAggregatedResults()
            .slice(0, 10)
            .map(r => `${r.title}: ${r.description?.substring(0, 100)}`)
            .join('\n');

        const followUpPrompt = `For "${this.gameTitle}", initial searches found ${searchTool.getAggregatedResults().length} results.

Sample results:
${resultsText}

Identify 5 specific follow-up searches to find missing information.
Output JSON array of query strings only.`;

        const response = await this.callLLM([
            { role: 'system', content: 'Output JSON array only.' },
            { role: 'user', content: followUpPrompt }
        ], { temperature: 0.3 });

        try {
            const queries = JSON.parse(response);
            if (Array.isArray(queries)) return queries.slice(0, CONFIG.maxFollowUpSearches);
        } catch {}

        return [];
    }

    /**
     * PHASE 1: Research - Collect basic game metadata
     */
    async phase1Research() {
        log('=== PHASE 1: RESEARCH ===', 'info');

        // Generate queries
        const queries = await this.generateSearchQueries('Phase1', this.jsonPhase1);

        // Execute searches
        const { results, urls } = await this.executePhaseSearches(
            this.phase1SearchTool, queries, 'Phase1'
        );

        // Build prompt with search results
        const resultsText = results.slice(0, 20).map((r, i) =>
            `${i + 1}. ${r.title || 'No title'}\n   Description: ${r.description?.substring(0, 200) || 'No description'}\n   URL: ${r.url || ''}`
        ).join('\n\n');

        const prompt = this.jsonPhase1 || 'Research the game and collect metadata.';
        const promptWithResults = `${prompt}\n\n=== SEARCH RESULTS ===\n${resultsText}\n\n=== SOURCE URLs ===\n${urls.slice(0, 30).join('\n')}\n\nGenerate the JSON output now. Output ONLY valid JSON.`;

        // Call LLM
        const response = await this.callLLM([
            { role: 'system', content: 'You are a game researcher. Output valid JSON only, no markdown.' },
            { role: 'user', content: promptWithResults }
        ], { temperature: 0.1, maxTokens: this.maxTokens, timeout: 180000 });

        // Parse result
        this.phase1Data = parseJSONResponse(response);

        log('Phase 1 complete', 'info', {
            success: this.phase1Data.success,
            searches: this.phase1SearchTool.getSearchCount()
        });

        return this.phase1Data;
    }

    /**
     * PHASE 2: Evaluate - Determine best versions to play
     */
    async phase2Evaluate() {
        log('=== PHASE 2: EVALUATE ===', 'info');

        // Generate queries focused on version comparison
        const queries = await this.generateSearchQueries('Phase2', this.jsonPhase2);

        // Execute searches
        const { results, urls } = await this.executePhaseSearches(
            this.phase2SearchTool, queries, 'Phase2'
        );

        // Prepare platforms JSON from Phase 1
        const platformsJson = JSON.stringify(this.phase1Data?.data?.platforms || [], null, 2);

        // Build prompt
        let prompt = this.jsonPhase2 || 'Evaluate game versions.';
        prompt = prompt.replace('${PLATFORMS_JSON}', platformsJson);

        const resultsText = results.slice(0, 20).map((r, i) =>
            `${i + 1}. ${r.title || 'No title'}\n   Description: ${r.description?.substring(0, 200) || 'No description'}\n   URL: ${r.url || ''}`
        ).join('\n\n');

        const promptWithResults = `${prompt}\n\n=== SEARCH RESULTS ===\n${resultsText}\n\n=== SOURCE URLs ===\n${urls.slice(0, 30).join('\n')}\n\nGenerate the JSON output now. Output ONLY valid JSON.`;

        // Call LLM
        const response = await this.callLLM([
            { role: 'system', content: 'You are a game evaluator. Output valid JSON only, no markdown.' },
            { role: 'user', content: promptWithResults }
        ], { temperature: 0.1, maxTokens: this.maxTokens, timeout: 180000 });

        // Parse result
        this.phase2Data = parseJSONResponse(response);

        log('Phase 2 complete', 'info', {
            success: this.phase2Data.success,
            searches: this.phase2SearchTool.getSearchCount()
        });

        return this.phase2Data;
    }

    /**
     * PHASE 3: Patches - Find patches/mods for best versions
     */
    async phase3Patches() {
        log('=== PHASE 3: PATCHES ===', 'info');

        // Generate queries focused on patches
        const queries = await this.generateSearchQueries('Phase3', this.jsonPhase3);

        // Execute searches
        const { results, urls } = await this.executePhaseSearches(
            this.phase3SearchTool, queries, 'Phase3'
        );

        // Prepare play_today JSON from Phase 2
        const playTodayJson = JSON.stringify(this.phase2Data?.data?.play_today || [], null, 2);

        // Build prompt
        let prompt = this.jsonPhase3 || 'Find patches and mods.';
        prompt = prompt.replace('${PLAYTODAY_JSON}', playTodayJson);

        const resultsText = results.slice(0, 25).map((r, i) =>
            `${i + 1}. ${r.title || 'No title'}\n   Description: ${r.description?.substring(0, 300) || 'No description'}\n   URL: ${r.url || ''}`
        ).join('\n\n');

        const promptWithResults = `${prompt}\n\n=== SEARCH RESULTS ===\n${resultsText}\n\n=== SOURCE URLs ===\n${urls.slice(0, 40).join('\n')}\n\nGenerate the JSON output now. Output ONLY valid JSON.`;

        // Call LLM
        const response = await this.callLLM([
            { role: 'system', content: 'You are a patch researcher. Output valid JSON only, no markdown.' },
            { role: 'user', content: promptWithResults }
        ], { temperature: 0.1, maxTokens: this.maxTokens, timeout: 180000 });

        // Parse result
        this.phase3Data = parseJSONResponse(response);

        log('Phase 3 complete', 'info', {
            success: this.phase3Data.success,
            searches: this.phase3SearchTool.getSearchCount()
        });

        return this.phase3Data;
    }

    /**
     * Combine all phase data into final JSON output
     */
    combineAllPhases() {
        log('Combining phase data...', 'info');

        const phase1 = this.phase1Data?.data || {};
        const phase2 = this.phase2Data?.data || {};
        const phase3 = this.phase3Data?.data || {};

        // Build final output
        const finalData = {
            // From Phase 1: Basic metadata
            title: phase1.title || this.gameTitle,
            alternativeTitles: phase1.alternativeTitles || [],
            developers: phase1.developers || ['Unknown'],
            publishers: phase1.publishers || phase1.developers || ['Unknown'],
            genres: phase1.genres || ['Adventure'],
            platforms: phase1.platforms || [],
            themes: phase1.themes || ['Classic'],
            key_features: phase1.key_features || ['Classic gameplay'],
            reception: phase1.reception || { scores: [], reviews: [], legacy: '' },
            serie: phase1.serie || { is_part_of_serie: false, serie_name: '', part_number: 1 },
            similar_games: phase1.similar_games || [],
            synopsis: phase1.synopsis || 'No synopsis available.',

            // From Phase 2: Best versions
            play_today: phase2.play_today || [],

            // From Phase 3: Patches (merged into play_today)
            _patches_by_platform: phase3.patches_by_platform || []
        };

        // Merge patches from Phase 3 into play_today
        if (phase3.patches_by_platform && Array.isArray(phase3.patches_by_platform)) {
            finalData.play_today = (phase2.play_today || []).map(pt => {
                const platformPatches = phase3.patches_by_platform.find(pp => pp.platform === pt.platform);
                if (platformPatches) {
                    return {
                        ...pt,
                        recommended_patches: platformPatches.recommended_patches || [],
                        emulators: platformPatches.emulators || []
                    };
                }
                return { ...pt, recommended_patches: [], emulators: [] };
            });
        }

        // Clean up internal field
        delete finalData._patches_by_platform;

        log('Phase data combined', 'info', {
            platforms: finalData.platforms.length,
            playToday: finalData.play_today.length,
            patches: this.countTotalPatches(finalData.play_today)
        });

        return finalData;
    }

    countTotalPatches(playToday) {
        return (playToday || []).reduce((acc, pt) => acc + (pt.recommended_patches?.length || 0), 0);
    }

    /**
     * Run the complete 3-phase research pipeline
     */
    async run() {
        log('Starting 3-phase research pipeline', 'info', {
            maxSearches: CONFIG.maxSearches,
            maxFollowUp: CONFIG.maxFollowUpSearches,
            multiPass: CONFIG.enableMultiPass
        });

        try {
            // Execute all 3 phases
            await this.phase1Research();
            await this.phase2Evaluate();
            await this.phase3Patches();

            // Combine results
            const finalData = this.combineAllPhases();

            const totalSearches =
                this.phase1SearchTool.getSearchCount() +
                this.phase2SearchTool.getSearchCount() +
                this.phase3SearchTool.getSearchCount();

            log('3-phase pipeline complete', 'info', { totalSearches });

            return {
                success: true,
                data: finalData,
                phaseResults: {
                    phase1: { success: this.phase1Data?.success, searches: this.phase1SearchTool.getSearchCount() },
                    phase2: { success: this.phase2Data?.success, searches: this.phase2SearchTool.getSearchCount() },
                    phase3: { success: this.phase3Data?.success, searches: this.phase3SearchTool.getSearchCount() }
                },
                queriesExecuted: this.getAllQueriesExecuted(),
                confidence: 0.85
            };

        } catch (error) {
            log('Pipeline failed', 'error', { error: error.message });
            return this.generateFallback();
        }
    }

    getAllQueriesExecuted() {
        const allQueries = [];
        this.phase1SearchTool.getAllResults().forEach(r => allQueries.push(`Phase1: ${r.query}`));
        this.phase2SearchTool.getAllResults().forEach(r => allQueries.push(`Phase2: ${r.query}`));
        this.phase3SearchTool.getAllResults().forEach(r => allQueries.push(`Phase3: ${r.query}`));
        return allQueries;
    }

    generateFallback() {
        return {
            success: true,
            data: {
                title: this.gameTitle,
                platforms: [],
                genres: ['Adventure'],
                play_today: [],
                themes: ['Classic'],
                key_features: ['Classic gameplay']
            },
            confidence: 0.5,
            fallback: true
        };
    }
}

/**
 * Research a game using the 3-phase agent
 */
async function researchGameWithAgent(gameTitle) {
    log('Starting 3-phase agent research', 'info', { title: gameTitle });

    const startTime = Date.now();

    try {
        const agent = new ResearchAgent({
            endpoint: CONFIG.endpoint,
            model: CONFIG.model,
            temperature: CONFIG.temperature,
            maxTokens: CONFIG.maxTokens
        });

        await agent.initialize(gameTitle);
        const result = await agent.run();

        const duration = Date.now() - startTime;

        if (!result.success) {
            log('Research failed', 'warn', { duration });
            return { success: false, error: 'Research failed', gameTitle, duration };
        }

        log('Research completed', 'info', {
            duration,
            queries: result.queriesExecuted?.length || 0
        });

        return {
            success: true,
            metadata: result.data,
            confidence: result.confidence || 0.85,
            sourceUrls: [],
            duration,
            queriesExecuted: result.queriesExecuted || [],
            phaseResults: result.phaseResults
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        log('Research error', 'error', { error: error.message, duration });
        return { success: false, error: error.message, gameTitle, duration };
    }
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
        log(`JSON parse failed: ${error.message}`, 'error');
        return { success: false, error: error.message, raw: response };
    }
}

module.exports = {
    researchGameWithAgent,
    parseJSONResponse,
    CONFIG,
    ResearchAgent,
    SearchTool
};
