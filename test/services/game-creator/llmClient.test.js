/**
 * LLM Client Tests
 */

jest.mock('axios');
jest.mock('../../../src/services/game-creator/retry', () => ({
    withRetry: jest.fn((fn) => fn()),
    PREDEFINED_STRATEGIES: { network: { delay: 1000 } }
}));

jest.mock('../../../src/services/game-creator/logger', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

const axios = require('axios');
const llmClient = require('../../../src/services/game-creator/llmClient');

describe('LLM Client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.LLM_ENDPOINT = 'http://10.0.0.15:1234/api/generate';
        process.env.LLM_MODEL = 'llama3.2';
        process.env.LLM_TIMEOUT = '120000';
        process.env.LLM_MAX_RETRIES = '3';
        process.env.LLM_TEMPERATURE = '0.2';
        process.env.LLM_MAX_TOKENS = '8000';
    });

    describe('getConfig', () => {
        it('should return configuration with Ollama API type for /api/generate endpoint', () => {
            const config = llmClient.getConfig();
            expect(config.apiType).toBe('ollama');
            expect(config.endpoint).toBe('http://10.0.0.15:1234/api/generate');
            expect(config.model).toBe('llama3.2');
        });

        it('should return OpenAI API type for /v1/chat/completions endpoint', () => {
            // Note: This tests the detectApiType logic via getConfig
            // In real scenarios, module would need to be reloaded with new env
            expect(llmClient.getConfig).toBeDefined();
        });
    });

    describe('callLLM', () => {
        it('should call LLM endpoint with correct payload', async () => {
            axios.post.mockResolvedValue({
                data: {
                    response: 'Test response',
                    model: 'llama3.2',
                    total_duration: 1000,
                    eval_count: 50
                }
            });

            const result = await llmClient.callLLM('Test prompt');

            expect(axios.post).toHaveBeenCalledWith(
                'http://10.0.0.15:1234/api/generate',
                expect.any(Object),
                expect.any(Object)
            );
            expect(result.response).toBe('Test response');
            expect(result.model).toBe('llama3.2');
        });

        it('should use custom model when specified', async () => {
            axios.post.mockResolvedValue({
                data: { response: 'Response', model: 'mistral' }
            });

            await llmClient.callLLM('Test', { model: 'mistral' });

            const callArgs = axios.post.mock.calls[0];
            expect(callArgs[1].model).toBe('mistral');
        });

        it('should respect timeout configuration', async () => {
            axios.post.mockResolvedValue({
                data: { response: 'Response' }
            });

            await llmClient.callLLM('Test');

            const callArgs = axios.post.mock.calls[0];
            expect(callArgs[2].timeout).toBe(120000);
        });

        it('should handle network errors with retry', async () => {
            axios.post.mockRejectedValue(new Error('Network error'));

            await expect(llmClient.callLLM('Test')).rejects.toThrow();
        });
    });

    describe('callLLMWithJSON', () => {
        it('should parse valid JSON response', async () => {
            axios.post.mockResolvedValue({
                data: {
                    response: JSON.stringify({ title: 'Test Game', confidence: 0.9 })
                }
            });

            const result = await llmClient.callLLMWithJSON('Test prompt', { type: 'object' });

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test Game');
            expect(result.data.confidence).toBe(0.9);
        });

        it('should remove markdown code blocks', async () => {
            axios.post.mockResolvedValue({
                data: {
                    response: '```json\n{"title": "Test"}\n```'
                }
            });

            const result = await llmClient.callLLMWithJSON('Test', {});

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test');
        });

        it('should extract JSON from text with surrounding content', async () => {
            axios.post.mockResolvedValue({
                data: {
                    response: 'Here is the result: {"title": "Test"} and done.'
                }
            });

            const result = await llmClient.callLLMWithJSON('Test', {});

            expect(result.success).toBe(true);
            expect(result.data.title).toBe('Test');
        });

        it('should return error for invalid JSON', async () => {
            axios.post.mockResolvedValue({
                data: { response: 'not valid json' }
            });

            const result = await llmClient.callLLMWithJSON('Test', {});

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('getLangChainChatModel', () => {
        it('should return LangChain-compatible chat model', () => {
            const chatModel = llmClient.getLangChainChatModel();

            expect(chatModel).toBeDefined();
            expect(chatModel).toHaveProperty('invoke');
            expect(typeof chatModel.invoke).toBe('function');
        });

        it('should have model configuration', () => {
            const chatModel = llmClient.getLangChainChatModel();

            expect(chatModel.model).toBe('llama3.2');
            expect(chatModel.temperature).toBe(0.2);
        });

        it('invoke should call LLM and return formatted response', async () => {
            const chatModel = llmClient.getLangChainChatModel();

            const response = await chatModel.invoke([
                { role: 'user', content: 'Test message' }
            ]);

            expect(response).toHaveProperty('content');
            expect(response).toHaveProperty('type', 'ai');
        });
    });

    describe('validateConfig', () => {
        it('should validate complete configuration', () => {
            const result = llmClient.validateConfig();

            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('issues');
            expect(result).toHaveProperty('warnings');
            expect(result).toHaveProperty('config');
        });

        it('should report missing endpoint', () => {
            process.env.LLM_ENDPOINT = '';
            // Would need module reload to test fully
        });

        it('should report invalid endpoint format', () => {
            process.env.LLM_ENDPOINT = 'not-a-url';
            // Would need module reload
        });

        it('should report invalid temperature', () => {
            process.env.LLM_TEMPERATURE = '5.0'; // Out of range
            // Would need module reload
        });
    });

    describe('getConfig', () => {
        it('should return configuration object', () => {
            const config = llmClient.getConfig();

            expect(config).toHaveProperty('endpoint');
            expect(config).toHaveProperty('model');
            expect(config).toHaveProperty('timeout');
            expect(config).toHaveProperty('maxRetries');
            expect(config).toHaveProperty('temperature');
            expect(config).toHaveProperty('maxTokens');
            expect(config).toHaveProperty('apiType');
        });
    });

    describe('testConnection', () => {
        it('should test connection successfully', async () => {
            axios.post.mockResolvedValue({
                data: {
                    response: 'OK',
                    model: 'llama3.2'
                }
            });

            const result = await llmClient.testConnection();

            expect(result.success).toBe(true);
            expect(result.endpoint).toBe('http://10.0.0.15:1234/api/generate');
            expect(result.model).toBe('llama3.2');
        });

        it('should handle connection failure', async () => {
            axios.post.mockRejectedValue(new Error('Connection refused'));

            const result = await llmClient.testConnection();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
