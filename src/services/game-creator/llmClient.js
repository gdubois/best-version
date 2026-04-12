/**
 * LLM Client Service
 *
 * Provides HTTP interface to self-hosted LLMs (Ollama, LM Studio, etc.)
 * for game research and analysis.
 *
 * @module services/game-creator/llmClient
 */

const axios = require('axios');
const { withRetry, PREDEFINED_STRATEGIES } = require('./retry');
const { createLogger } = require('./logger');

/**
 * Logger instance for LLM client
 * @private
 */
const logger = createLogger('llmClient', { redactApiKey: false });

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
 * LLM Configuration from environment variables
 */
const LLM_ENDPOINT_VALUE = process.env.LLM_ENDPOINT || 'http://10.0.0.15:1234/v1/chat/completions';

const CONFIG = {
    // LLM endpoint URL
    // Default: http://10.0.0.15:1234/v1/chat/completions (your LLM server)
    endpoint: LLM_ENDPOINT_VALUE,

    // LLM model name (e.g., llama3.2, mistral, codellama)
    model: process.env.LLM_MODEL || 'llama3.2',

    // Request timeout in milliseconds (default: 120 seconds for complex prompts)
    timeout: parseInt(process.env.LLM_TIMEOUT) || 120000,

    // Maximum retry attempts
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES) || 3,

    // Temperature: 0.0 = deterministic, 1.0 = creative
    // Use low temperature (0.1-0.3) for structured JSON output
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.2,

    // Maximum tokens to generate
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 8000,

    // Detect API type based on endpoint
    apiType: detectApiType(LLM_ENDPOINT_VALUE)
};

/**
 * Detect API type based on endpoint URL
 * @param {string} endpoint
 * @returns {'ollama' | 'openai' | 'unknown'}
 */
function detectApiType(endpoint) {
    if (!endpoint) return 'ollama';

    const url = endpoint.toLowerCase();
    if (url.includes('/v1/chat/completions') || url.includes('/v1/completions')) {
        return 'openai';
    }
    if (url.includes('/api/generate') || url.includes('/api/chat')) {
        return 'ollama';
    }
    return 'ollama'; // Default to Ollama format
}

/**
 * Build request payload based on API type
 * @param {string} prompt
 * @param {Object} options
 * @returns {Object}
 */
function buildRequestPayload(prompt, options = {}) {
    const {
        model = CONFIG.model,
        temperature = CONFIG.temperature,
        maxTokens = CONFIG.maxTokens
    } = options;

    if (CONFIG.apiType === 'openai') {
        // OpenAI-compatible format (LM Studio, etc.)
        return {
            model,
            messages: [
                { role: 'system', content: 'You are a helpful assistant that provides accurate, well-researched information about video games. Always output valid JSON when requested.' },
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: false
        };
    }

    // Ollama format (default)
    return {
        model,
        prompt,
        stream: false,
        temperature,
        num_predict: maxTokens,
        options: {
            num_ctx: 16000 // Context window size
        }
    };
}

/**
 * Parse response based on API type
 * @param {Object} response - Raw API response
 * @returns {Object} Parsed result with 'response' field
 */
function parseResponse(response) {
    if (CONFIG.apiType === 'openai') {
        // OpenAI-compatible format
        const content = response.data?.choices?.[0]?.message?.content || '';
        return {
            response: content,
            model: response.data?.model,
            usage: response.data?.usage
        };
    }

    // Ollama format
    return {
        response: response.data?.response || '',
        model: response.data?.model,
        total_duration: response.data?.total_duration,
        eval_count: response.data?.eval_count
    };
}

/**
 * Call the LLM with a prompt
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @param {string} options.model - Override model name
 * @param {number} options.temperature - Override temperature
 * @returns {Promise<Object>} LLM response
 */
async function callLLM(prompt, options = {}) {
    log(`Calling LLM: ${CONFIG.model}`, 'info', {
        promptLength: prompt.length,
        endpoint: CONFIG.endpoint
    });

    return withRetry(async () => {
        const payload = buildRequestPayload(prompt, options);
        const response = await axios.post(CONFIG.endpoint, payload, {
            timeout: CONFIG.timeout,
            headers: { 'Content-Type': 'application/json' }
        });

        const result = parseResponse(response);

        log('LLM call completed', 'info', {
            responseLength: result.response?.length || 0,
            model: result.model
        });

        return result;

    }, {
        ...PREDEFINED_STRATEGIES.network,
        maxRetries: CONFIG.maxRetries,
        logger
    });
}

/**
 * Call LLM with JSON output requirement
 * @param {string} prompt - The prompt to send
 * @param {Object} schema - JSON schema for output validation
 * @returns {Promise<Object>} Parsed JSON response
 */
async function callLLMWithJSON(prompt, schema) {
    const enhancedPrompt = `${prompt}

IMPORTANT: Your response must be valid JSON that matches this schema exactly:
${JSON.stringify(schema, null, 2)}

Output ONLY the JSON, no additional text, no markdown formatting.`;

    const result = await callLLM(enhancedPrompt);

    // Extract JSON from response (handle potential markdown formatting)
    let jsonStr = result.response || '';

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();

    // Try to find JSON object in response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    try {
        return {
            success: true,
            data: JSON.parse(jsonStr),
            raw: result.response
        };
    } catch (error) {
        log(`Failed to parse LLM JSON response: ${error.message}`, 'error');
        log(`Response preview: ${jsonStr.substring(0, 500)}`, 'error');

        return {
            success: false,
            error: error.message,
            raw: result.response,
            attemptedParse: jsonStr
        };
    }
}

/**
 * Get LLM configuration
 * @returns {Object}
 */
function getConfig() {
    return { ...CONFIG };
}

/**
 * Test LLM connectivity
 * @returns {Promise<Object>}
 */
async function testConnection() {
    try {
        const result = await callLLM('Test message - respond with OK', {
            temperature: 0.1,
            maxTokens: 10
        });

        const success = result.response?.includes('OK') || result.response?.length > 0;

        log(`Connection test ${success ? 'passed' : 'failed'}`, success ? 'info' : 'warn', {
            response: result.response
        });

        return {
            success,
            endpoint: CONFIG.endpoint,
            model: CONFIG.model,
            apiType: CONFIG.apiType,
            response: result.response
        };

    } catch (error) {
        log(`Connection test failed: ${error.message}`, 'error');

        return {
            success: false,
            error: error.message,
            endpoint: CONFIG.endpoint
        };
    }
}

/**
 * Get LangChain-compatible Chat model
 *
 * Returns a Chat model compatible with LangChain.js that wraps
 * the existing LLM endpoint.
 *
 * @returns {Object} LangChain-compatible Chat model
 */
function getLangChainChatModel() {
    // Try to use LangChain's ChatOpenAI for OpenAI-compatible endpoints
    try {
        const { ChatOpenAI } = require('langchain/chat_models/openai');

        // Determine if endpoint is OpenAI-compatible
        const isOpenAICompat = CONFIG.apiType === 'openai' ||
            CONFIG.endpoint.includes('/v1/chat/completions') ||
            CONFIG.endpoint.includes('/v1/completions');

        if (isOpenAICompat) {
            return new ChatOpenAI({
                openAIApiKey: 'fake-key', // Required but ignored for self-hosted
                modelName: CONFIG.model,
                temperature: CONFIG.temperature,
                modelName: CONFIG.model,
                configuration: {
                    baseURL: CONFIG.endpoint.replace(/\/api\/generate$/, '').replace(/\/v1\/chat\/completions$/, ''),
                    apiKey: 'fake-key'
                },
                timeout: CONFIG.timeout
            });
        }
    } catch (error) {
        log('LangChain ChatOpenAI not available, using fallback', 'warn', { error: error.message });
    }

    // Fallback: return a simple wrapper object that mimics Chat model interface
    const chatModelWrapper = {
        model: CONFIG.model,
        temperature: CONFIG.temperature,
        maxTokens: CONFIG.maxTokens,
        invoke: async (messages) => {
            // Convert LangChain message format to our format
            const prompt = messages
                .map(m => m.role === 'system' ? m.content : m.content)
                .join('\n');

            const result = await callLLM(prompt, {
                temperature: CONFIG.temperature,
                maxTokens: CONFIG.maxTokens
            });

            // Return LangChain-compatible response
            return {
                content: result.response || '',
                type: 'ai'
            };
        },
        bindTools: (tools) => {
            // Return self for chaining
            return chatModelWrapper;
        }
    };

    return chatModelWrapper;
}

/**
 * Validate LLM configuration
 *
 * Checks that all required configuration is present and valid.
 *
 * @returns {Object} Validation result
 */
function validateConfig() {
    const issues = [];
    const warnings = [];

    // Check endpoint
    if (!CONFIG.endpoint) {
        issues.push('LLM_ENDPOINT is not configured');
    } else if (!CONFIG.endpoint.startsWith('http://') && !CONFIG.endpoint.startsWith('https://')) {
        issues.push('LLM_ENDPOINT must be a valid URL');
    }

    // Check model
    if (!CONFIG.model) {
        issues.push('LLM_MODEL is not configured');
    }

    // Check timeout is reasonable
    if (CONFIG.timeout < 5000) {
        warnings.push('LLM_TIMEOUT is very low (< 5 seconds)');
    }

    // Check temperature is valid
    if (CONFIG.temperature < 0 || CONFIG.temperature > 1) {
        warnings.push('LLM_TEMPERATURE should be between 0 and 1');
    }

    return {
        valid: issues.length === 0,
        issues,
        warnings,
        config: {
            endpoint: CONFIG.endpoint,
            model: CONFIG.model,
            timeout: CONFIG.timeout,
            temperature: CONFIG.temperature,
            apiType: CONFIG.apiType
        }
    };
}

module.exports = {
    callLLM,
    callLLMWithJSON,
    getConfig,
    testConnection,
    getLangChainChatModel,
    validateConfig,
    CONFIG
};
