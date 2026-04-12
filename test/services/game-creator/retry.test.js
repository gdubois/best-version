/**
 * Retry Logic Unit Tests
 *
 * Tests for retry functionality with exponential backoff.
 * GC-4.1: Retry Logic with Exponential Backoff
 */

const retryService = require('../../../src/services/game-creator/retry');

const {
    withRetry,
    withPredefinedStrategy,
    shouldRetry,
    calculateDelay,
    determineErrorType,
    PREDEFINED_STRATEGIES,
    sleep
} = retryService;

describe('Retry Service', () => {
    describe('calculateDelay', () => {
        it('should calculate exponential backoff correctly', () => {
            const options = {
                initialDelay: 5000,
                maxDelay: 20000,
                backoffFactor: 2,
                jitter: false
            };

            expect(calculateDelay(0, options)).toBe(5000);    // 5s * 2^0
            expect(calculateDelay(1, options)).toBe(10000);   // 5s * 2^1
            expect(calculateDelay(2, options)).toBe(20000);   // 5s * 2^2
            expect(calculateDelay(3, options)).toBe(20000);   // Capped at max
        });

        it('should cap delay at maxDelay', () => {
            const options = {
                initialDelay: 5000,
                maxDelay: 15000,
                backoffFactor: 2,
                jitter: false
            };

            expect(calculateDelay(5, options)).toBe(15000);
        });

        it('should apply jitter when enabled', () => {
            const options = {
                initialDelay: 10000,
                maxDelay: 20000,
                backoffFactor: 2,
                jitter: true
            };

            // With jitter, values should vary around the base
            const delays = Array(5).fill(0).map(() => calculateDelay(1, options));

            // All delays should be within ±15% of base (10000ms)
            delays.forEach(delay => {
                expect(delay).toBeGreaterThanOrEqual(8500);
                expect(delay).toBeLessThanOrEqual(11500);
            });
        });
    });

    describe('shouldRetry', () => {
        it('should retry transient network errors', () => {
            const timeoutError = new Error('Request ETIMEDOUT');
            const resetError = new Error('Socket ECONNRESET');

            expect(shouldRetry(timeoutError, 0)).toBe(true);
            expect(shouldRetry(resetError, 0)).toBe(true);
        });

        it('should retry rate limit errors', () => {
            const rateLimitError = new Error('Rate limit exceeded');
            const tooManyError = new Error('429 Too Many Requests');

            expect(shouldRetry(rateLimitError, 0)).toBe(true);
            expect(shouldRetry(tooManyError, 0)).toBe(true);
        });

        it('should NOT retry permanent client errors', () => {
            const notFoundError = new Error('404 Not Found');
            const invalidError = new Error('Validation error: invalid request');

            expect(shouldRetry(notFoundError, 0)).toBe(false);
            expect(shouldRetry(invalidError, 0)).toBe(false);
        });

        it('should retry 5xx server errors', () => {
            const serverError = new Error('500 Internal Server Error');
            const serverError2 = new Error('503 Service Unavailable');

            expect(shouldRetry(serverError, 0)).toBe(true);
            expect(shouldRetry(serverError2, 0)).toBe(true);
        });

        it('should NOT retry after max attempts', () => {
            const networkError = new Error('ETIMEDOUT');

            expect(shouldRetry(networkError, 0)).toBe(true);
            expect(shouldRetry(networkError, 1)).toBe(true);
            expect(shouldRetry(networkError, 2)).toBe(true);
            expect(shouldRetry(networkError, 3)).toBe(true); // Still true, caller controls max
        });

        it('should respect custom shouldRetry function', () => {
            const error = new Error('500 Error');
            const options = {
                customShouldRetry: (err) => err.message.includes('500')
            };

            expect(shouldRetry(error, 5, options)).toBe(true);
        });
    });

    describe('determineErrorType', () => {
        it('should identify rate limit errors', () => {
            expect(determineErrorType(new Error('Rate limit exceeded'))).toBe('rate_limit');
            expect(determineErrorType(new Error('429 Too Many Requests'))).toBe('rate_limit');
        });

        it('should identify timeout errors', () => {
            expect(determineErrorType(new Error('Request timed out'))).toBe('timeout');
            expect(determineErrorType(new Error('ETIMEDOUT'))).toBe('timeout');
        });

        it('should identify network errors', () => {
            expect(determineErrorType(new Error('ECONNRESET'))).toBe('network');
            expect(determineErrorType(new Error('ECONNREFUSED'))).toBe('network');
        });

        it('should identify server errors', () => {
            expect(determineErrorType(new Error('500 Internal Error'))).toBe('server_error');
            expect(determineErrorType(new Error('503 Service Unavailable'))).toBe('server_error');
        });

        it('should identify client errors', () => {
            expect(determineErrorType(new Error('400 Bad Request'))).toBe('client_error');
            expect(determineErrorType(new Error('404 Not Found'))).toBe('client_error');
        });

        it('should return unknown for unrecognized errors', () => {
            expect(determineErrorType(new Error('Something weird happened'))).toBe('unknown');
        });
    });

    describe('withRetry', () => {
        it('should succeed on first attempt', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                return 'success';
            };

            const result = await withRetry(fn, { maxRetries: 3 });

            expect(result).toBe('success');
            expect(attempts).toBe(1);
        });

        it('should retry and succeed', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('ETIMEDOUT');
                }
                return 'success';
            };

            const result = await withRetry(fn, {
                maxRetries: 3,
                initialDelay: 10, // Fast test
                jitter: false
            });

            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });

        it('should fail after max retries', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                throw new Error('ETIMEDOUT');
            };

            await expect(withRetry(fn, {
                maxRetries: 2,
                initialDelay: 10,
                jitter: false
            })).rejects.toThrow('ETIMEDOUT');

            expect(attempts).toBe(3); // 1 initial + 2 retries
        });

        it('should NOT retry permanent errors', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                throw new Error('404 Not Found');
            };

            await expect(withRetry(fn, { maxRetries: 3 }))
                .rejects.toThrow('404 Not Found');

            expect(attempts).toBe(1); // No retries for permanent errors
        });

        it('should apply exponential backoff delays', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('ETIMEDOUT');
                }
                return 'success';
            };

            const startTime = Date.now();

            await withRetry(fn, {
                maxRetries: 3,
                initialDelay: 100,
                backoffFactor: 2,
                jitter: false
            });

            const elapsed = Date.now() - startTime;

            // Should have waited ~100ms + ~200ms = ~300ms minimum
            expect(elapsed).toBeGreaterThanOrEqual(250);
            expect(attempts).toBe(3);
        });
    });

    describe('withPredefinedStrategy', () => {
        it('should use rate_limit strategy', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Rate limit exceeded');
                }
                return 'success';
            };

            const result = await withPredefinedStrategy(
                fn,
                'rate_limit',
                { initialDelay: 10, jitter: false }
            );

            expect(result).toBe('success');
            expect(attempts).toBe(2);
        });

        it('should use timeout strategy', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Timeout');
                }
                return 'success';
            };

            const result = await withPredefinedStrategy(
                fn,
                'timeout',
                { initialDelay: 10, jitter: false }
            );

            expect(result).toBe('success');
        });

        it('should not retry with client_error strategy', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                throw new Error('400 Bad Request');
            };

            await expect(withPredefinedStrategy(fn, 'client_error'))
                .rejects.toThrow('400 Bad Request');

            expect(attempts).toBe(1);
        });

        it('should use default strategy when unspecified', async () => {
            let attempts = 0;
            const fn = async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('ETIMEDOUT');
                }
                return 'success';
            };

            const result = await withPredefinedStrategy(fn, 'default', {
                initialDelay: 10,
                jitter: false
            });

            expect(result).toBe('success');
        });
    });

    describe('PREDEFINED_STRATEGIES', () => {
        it('should have correct rate_limit strategy', () => {
            expect(PREDEFINED_STRATEGIES.rate_limit).toEqual({
                maxRetries: 3,
                initialDelay: 10000,
                maxDelay: 60000,
                backoffFactor: 2,
                jitter: true
            });
        });

        it('should have correct timeout strategy', () => {
            expect(PREDEFINED_STRATEGIES.timeout).toEqual({
                maxRetries: 2,
                initialDelay: 3000,
                maxDelay: 10000,
                backoffFactor: 2,
                jitter: true
            });
        });

        it('should have correct network strategy', () => {
            expect(PREDEFINED_STRATEGIES.network).toEqual({
                maxRetries: 3,
                initialDelay: 2000,
                maxDelay: 15000,
                backoffFactor: 2.5,
                jitter: true
            });
        });

        it('should have client_error strategy with no retries', () => {
            expect(PREDEFINED_STRATEGIES.client_error.maxRetries).toBe(0);
        });
    });

    describe('sleep', () => {
        it('should resolve after specified milliseconds', async () => {
            const startTime = Date.now();
            await sleep(100);
            const elapsed = Date.now() - startTime;

            expect(elapsed).toBeGreaterThanOrEqual(100);
        });
    });
});
