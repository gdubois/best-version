/**
 * Comprehensive Logging Service Tests
 *
 * Tests for structured logging with file rotation and data redaction.
 * GC-4.2: Comprehensive Logging
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const loggerService = require('../../src/services/game-creator/logger');

const {
    createLogger,
    createComponentLoggers,
    redactSensitive,
    parseLogEntry,
    readRecentLogs,
    LogLevels,
    DEFAULT_CONFIG,
    SENSITIVE_KEYS
} = loggerService;

describe('Logger Service', () => {
    let testLogDir;

    beforeEach(async () => {
        // Create a temporary test log directory
        testLogDir = path.join(os.tmpdir(), `logger-test-${Date.now()}`);
        await fs.mkdir(testLogDir, { recursive: true });
    });

    afterEach(async () => {
        // Clean up test log directory
        try {
            await fs.rm(testLogDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('redactSensitive', () => {
        it('should redact sensitive keys by name', () => {
            const input = {
                apiKey: 'secret-key-123',
                api_key: 'another-secret',
                normalKey: 'visible-value'
            };

            const redacted = redactSensitive(input, [], '[REDACTED]');

            expect(redacted.apiKey).toBe('[REDACTED]');
            expect(redacted.api_key).toBe('[REDACTED]');
            expect(redacted.normalKey).toBe('visible-value');
        });

        it('should redact sensitive values matching patterns', () => {
            const input = {
                header: 'Bearer eyJhbGciOiJIUzI1NiJ9',
                message: 'Your API key is abc123'
            };

            const patterns = [
                /Bearer\s+\w+/i,
                /api[_-]?key\s+is\s+\w+/i
            ];

            const redacted = redactSensitive(input, patterns, '[REDACTED]');

            expect(redacted.header).toBe('[REDACTED]');
            expect(redacted.message).toContain('[REDACTED]');
        });

        it('should recursively redact nested objects', () => {
            const input = {
                config: {
                    apiKey: 'nested-secret',
                    normal: 'value'
                },
                headers: {
                    authorization: 'Bearer token123'
                }
            };

            const redacted = redactSensitive(input, [], '[REDACTED]');

            expect(redacted.config.apiKey).toBe('[REDACTED]');
            expect(redacted.config.normal).toBe('value');
            expect(redacted.headers.authorization).toBe('[REDACTED]');
        });

        it('should handle non-object values', () => {
            expect(redactSensitive('plain text', [])).toBe('plain text');
            expect(redactSensitive(123, [])).toBe(123);
            expect(redactSensitive(null, [])).toBe(null);
            expect(redactSensitive(undefined, [])).toBe(undefined);
        });

        it('should have predefined sensitive keys', () => {
            expect(SENSITIVE_KEYS).toContain('apiKey');
            expect(SENSITIVE_KEYS).toContain('api_key');
            expect(SENSITIVE_KEYS).toContain('password');
            expect(SENSITIVE_KEYS).toContain('token');
            expect(SENSITIVE_KEYS).toContain('secret');
        });
    });

    describe('createLogger', () => {
        it('should create a logger with all log levels', () => {
            const logger = createLogger('test-component', { logDir: testLogDir });

            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
        });

        it('should have convenience methods', () => {
            const logger = createLogger('test-component', { logDir: testLogDir });

            expect(typeof logger.submission).toBe('function');
            expect(typeof logger.processing).toBe('function');
            expect(typeof logger.validation).toBe('function');
        });

        it('should write log entries to file', async () => {
            const logger = createLogger('test', {
                logDir: testLogDir,
                level: 'debug'
            });

            await logger.info('Test message', { key: 'value' });

            const logPath = path.join(testLogDir, 'game_creator_test.log');
            const content = await fs.readFile(logPath, 'utf8');
            const entry = JSON.parse(content.trim());

            expect(entry.level).toBe('info');
            expect(entry.component).toBe('test');
            expect(entry.message).toBe('Test message');
            expect(entry.metadata.key).toBe('value');
            expect(entry.timestamp).toBeDefined();
            expect(entry.pid).toBe(process.pid);
        });

        it('should redact sensitive data in metadata', async () => {
            const logger = createLogger('test-redact', {
                logDir: testLogDir,
                level: 'debug',
                redactApiKey: true
            });

            await logger.info('API call', {
                apiKey: 'super-secret-key',
                url: 'https://api.example.com'
            });

            const logPath = path.join(testLogDir, 'game_creator_test-redact.log');
            const content = await fs.readFile(logPath, 'utf8');
            const entry = JSON.parse(content.trim());

            expect(entry.metadata.apiKey).toBe('[REDACTED]');
            expect(entry.metadata.url).toBe('https://api.example.com');
        });

        it('should use convenience method for submission logging', async () => {
            const logger = createLogger('test-sub', {
                logDir: testLogDir,
                level: 'debug'
            });

            await logger.submission(
                'Processing started',
                'sub-001',
                'Final Fantasy VII'
            );

            const logPath = path.join(testLogDir, 'game_creator_test-sub.log');
            const content = await fs.readFile(logPath, 'utf8');
            const entry = JSON.parse(content.trim());

            expect(entry.metadata.submissionId).toBe('sub-001');
            expect(entry.metadata.submissionTitle).toBe('Final Fantasy VII');
        });

        it('should use convenience method for validation logging', async () => {
            const logger = createLogger('test-val', {
                logDir: testLogDir,
                level: 'debug'
            });

            const validationResult = {
                valid: false,
                confidenceScore: 0.6,
                issues: [{ message: 'Missing field' }],
                recommendation: 'review'
            };

            await logger.validation('Validation complete', 'sub-002', validationResult);

            const logPath = path.join(testLogDir, 'game_creator_test-val.log');
            const content = await fs.readFile(logPath, 'utf8');
            const entry = JSON.parse(content.trim());

            expect(entry.metadata.submissionId).toBe('sub-002');
            expect(entry.metadata.valid).toBe(false);
            expect(entry.metadata.confidenceScore).toBe(0.6);
            expect(entry.metadata.issues).toBe(1);
            expect(entry.metadata.recommendation).toBe('review');
        });

        it('should respect log level filtering', async () => {
            const logger = createLogger('test-level', {
                logDir: testLogDir,
                level: 'warn' // Only warn and above
            });

            // These should NOT be logged
            await logger.debug('Debug message');
            await logger.info('Info message');

            // This SHOULD be logged
            await logger.warn('Warning message');

            const logPath = path.join(testLogDir, 'game_creator_test-level.log');
            const content = await fs.readFile(logPath, 'utf8');
            const lines = content.trim().split('\n').filter(l => l);

            expect(lines).toHaveLength(1);
            expect(JSON.parse(lines[0]).level).toBe('warn');
        });
    });

    describe('createComponentLoggers', () => {
        it('should create loggers for all components', async () => {
            const loggers = createComponentLoggers({ logDir: testLogDir });

            expect(loggers.processor).toBeDefined();
            expect(loggers.queue).toBeDefined();
            expect(loggers.research).toBeDefined();
            expect(loggers.validation).toBeDefined();
            expect(loggers.storage).toBeDefined();
            expect(loggers.scheduler).toBeDefined();
            expect(loggers.wikipedia).toBeDefined();
            expect(loggers.images).toBeDefined();
            expect(loggers.retry).toBeDefined();
            expect(loggers.api).toBeDefined();
        });

        it('should write to separate files per component', async () => {
            const loggers = createComponentLoggers({
                logDir: testLogDir,
                level: 'debug'
            });

            await loggers.processor.info('Processor message');
            await loggers.queue.info('Queue message');
            await loggers.research.info('Research message');

            const files = await fs.readdir(testLogDir);
            expect(files).toContain('game_creator_processor.log');
            expect(files).toContain('game_creator_queue.log');
            expect(files).toContain('game_creator_research.log');
        });
    });

    describe('parseLogEntry', () => {
        it('should parse valid JSON log entries', () => {
            const json = JSON.stringify({
                timestamp: '2026-04-10T12:00:00Z',
                level: 'info',
                component: 'processor',
                message: 'Test message'
            });

            const parsed = parseLogEntry(json);

            expect(parsed.level).toBe('info');
            expect(parsed.component).toBe('processor');
            expect(parsed.message).toBe('Test message');
        });

        it('should handle invalid JSON gracefully', () => {
            const parsed = parseLogEntry('not valid json {{{');

            expect(parsed.raw).toBe('not valid json {{{');
            expect(parsed.parseError).toBeDefined();
        });
    });

    describe('readRecentLogs', () => {
        it('should read recent log entries', async () => {
            const logger = createLogger('test-read', {
                logDir: testLogDir,
                level: 'debug'
            });

            await logger.info('Message 1');
            await logger.info('Message 2');
            await logger.info('Message 3');

            const entries = await readRecentLogs('test-read', 10, testLogDir);

            expect(entries).toHaveLength(3);
            expect(entries[0].message).toBe('Message 1');
            expect(entries[2].message).toBe('Message 3');
        });

        it('should return empty array for non-existent log file', async () => {
            const entries = await readRecentLogs('nonexistent', 10, testLogDir);
            expect(entries).toHaveLength(0);
        });

        it('should limit to requested number of lines', async () => {
            const logger = createLogger('test-limit', {
                logDir: testLogDir,
                level: 'debug'
            });

            for (let i = 0; i < 10; i++) {
                await logger.info(`Message ${i}`);
            }

            const entries = await readRecentLogs('test-limit', 3, testLogDir);
            expect(entries).toHaveLength(3);
        });
    });

    describe('LogLevels', () => {
        it('should have correct priority order', () => {
            expect(LogLevels.DEBUG).toBe(0);
            expect(LogLevels.INFO).toBe(1);
            expect(LogLevels.WARN).toBe(2);
            expect(LogLevels.ERROR).toBe(3);
        });
    });

    describe('DEFAULT_CONFIG', () => {
        it('should have sensible defaults', () => {
            expect(DEFAULT_CONFIG.maxFileSize).toBe(10 * 1024 * 1024); // 10 MB
            expect(DEFAULT_CONFIG.maxFiles).toBe(10);
            expect(DEFAULT_CONFIG.level).toBe('info');
            expect(DEFAULT_CONFIG.redactApiKey).toBe(true);
        });
    });
});
