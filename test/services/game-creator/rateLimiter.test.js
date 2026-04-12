/**
 * API Rate Limiter Tests
 *
 * Tests for rate limiting functionality.
 * GC-4.3: API Rate Limit Handling
 */

const rateLimiter = require('../../../src/services/game-creator/rateLimiter');

const {
    waitForRateLimit,
    handleRateLimitResponse,
    resetRateLimit,
    getRateLimitStatus,
    getAllRateLimitStatus,
    withRateLimit,
    getRequestsInLastMinute,
    getRequestsInLastHour,
    isInBackoff,
    getRemainingBackoff,
    calculateBackoff,
    RATE_LIMIT_CONFIG,
    rateLimitState
} = rateLimiter;

describe('Rate Limiter Service', () => {
    beforeEach(() => {
        // Reset rate limit state before each test
        resetRateLimit('duckduckgo');
        resetRateLimit('wikipedia');
    });

    describe('RATE_LIMIT_CONFIG', () => {
        it('should have DuckDuckGo configuration', () => {
            expect(RATE_LIMIT_CONFIG.duckduckgo).toBeDefined();
            expect(RATE_LIMIT_CONFIG.duckduckgo.requestsPerMinute).toBe(50);
            expect(RATE_LIMIT_CONFIG.duckduckgo.requestsPerHour).toBe(1000);
            expect(RATE_LIMIT_CONFIG.duckduckgo.burstLimit).toBe(10);
        });

        it('should have Wikipedia configuration', () => {
            expect(RATE_LIMIT_CONFIG.wikipedia).toBeDefined();
            expect(RATE_LIMIT_CONFIG.wikipedia.requestsPerMinute).toBe(10);
            expect(RATE_LIMIT_CONFIG.wikipedia.requestsPerHour).toBe(500);
            expect(RATE_LIMIT_CONFIG.wikipedia.burstLimit).toBe(2);
        });
    });

    describe('calculateBackoff', () => {
        it('should calculate exponential backoff', () => {
            const config = RATE_LIMIT_CONFIG.duckduckgo;

            expect(calculateBackoff(1, config)).toBe(1000);   // minBackoff
            expect(calculateBackoff(2, config)).toBe(2000);   // 1000 * 2^1
            expect(calculateBackoff(3, config)).toBe(4000);   // 1000 * 2^2
            expect(calculateBackoff(4, config)).toBe(8000);   // 1000 * 2^3
        });

        it('should cap at maxBackoff', () => {
            const config = RATE_LIMIT_CONFIG.duckduckgo;

            // At some point should hit maxBackoff (60000ms)
            const backoff = calculateBackoff(20, config);
            expect(backoff).toBeLessThanOrEqual(60000);
        });

        it('should use Wikipedia minBackoff (6 seconds)', () => {
            const config = RATE_LIMIT_CONFIG.wikipedia;

            expect(calculateBackoff(1, config)).toBe(6000); // 6 seconds minimum
        });
    });

    describe('getRequestsInLastMinute', () => {
        it('should return 0 for fresh state', () => {
            resetRateLimit('duckduckgo');
            expect(getRequestsInLastMinute('duckduckgo')).toBe(0);
        });

        it('should count recent requests', async () => {
            resetRateLimit('duckduckgo');
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now());
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 1000);
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 30000);

            expect(getRequestsInLastMinute('duckduckgo')).toBe(3);
        });

        it('should not count old requests', async () => {
            resetRateLimit('duckduckgo');
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 70000); // 70 seconds ago

            expect(getRequestsInLastMinute('duckduckgo')).toBe(0);
        });
    });

    describe('getRequestsInLastHour', () => {
        it('should count requests from last hour', async () => {
            resetRateLimit('duckduckgo');
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 1000);
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 300000); // 5 minutes ago

            expect(getRequestsInLastHour('duckduckgo')).toBe(2);
        });

        it('should not count requests older than 1 hour', async () => {
            resetRateLimit('duckduckgo');
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now() - 700000); // 11+ minutes ago

            expect(getRequestsInLastHour('duckduckgo')).toBe(0);
        });
    });

    describe('getRateLimitStatus', () => {
        it('should return status for Jina API', () => {
            const status = getRateLimitStatus('duckduckgo');

            expect(status.api).toBe('DuckDuckGo');
            expect(status.requestsThisMinute).toBe(0);
            expect(status.requestsPerMinuteLimit).toBe(50);
            expect(status.remainingThisMinute).toBe(50);
            expect(status.canMakeRequest).toBe(true);
            expect(status.inBackoff).toBe(false);
        });

        it('should return status for Wikipedia API', () => {
            const status = getRateLimitStatus('wikipedia');

            expect(status.api).toBe('Wikipedia');
            expect(status.requestsPerMinuteLimit).toBe(10);
            expect(status.canMakeRequest).toBe(true);
        });

        it('should return unavailable for unknown API', () => {
            const status = getRateLimitStatus('unknown');

            expect(status.available).toBe(false);
            expect(status.error).toContain('unknown');
        });
    });

    describe('getAllRateLimitStatus', () => {
        it('should return status for all APIs', () => {
            const status = getAllRateLimitStatus();

            expect(status.duckduckgo).toBeDefined();
            expect(status.wikipedia).toBeDefined();
            expect(status.duckduckgo.api).toBe('DuckDuckGo');
            expect(status.wikipedia.api).toBe('Wikipedia');
        });
    });

    describe('waitForRateLimit', () => {
        it('should not wait when under limit', async () => {
            resetRateLimit('duckduckgo');
            const startTime = Date.now();

            await waitForRateLimit('duckduckgo');

            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeLessThan(100); // Should be nearly instant
        });

        it('should wait when rate limit is hit', async () => {
            resetRateLimit('duckduckgo');

            // Add 50 requests (at limit)
            for (let i = 0; i < 50; i++) {
                rateLimitState.duckduckgo.requestTimestamps.push(Date.now());
            }

            const startTime = Date.now();
            await waitForRateLimit('duckduckgo');
            const elapsed = Date.now() - startTime;

            // Should have waited at least ~60 seconds (minus a small buffer)
            expect(elapsed).toBeGreaterThanOrEqual(55000);
        });

        it('should handle unknown API gracefully', async () => {
            const startTime = Date.now();

            await waitForRateLimit('unknown_api');

            const elapsed = Date.now() - startTime;
            expect(elapsed).toBeLessThan(100); // Should just pass through
        });
    });

    describe('handleRateLimitResponse', () => {
        it('should handle 429 response with Retry-After header', async () => {
            resetRateLimit('duckduckgo');

            const response = {
                headers: {
                    'retry-after': '5' // 5 seconds
                }
            };

            const startTime = Date.now();
            const backoff = await handleRateLimitResponse('duckduckgo', response);
            const elapsed = Date.now() - startTime;

            expect(backoff).toBe(5000); // 5 seconds from header
            expect(elapsed).toBeGreaterThanOrEqual(4500); // Allow 500ms tolerance
        });

        it('should use exponential backoff when no Retry-After header', async () => {
            resetRateLimit('duckduckgo');

            // First consecutive rate limit
            const startTime = Date.now();
            const backoff = await handleRateLimitResponse('duckduckgo', {});
            const elapsed = Date.now() - startTime;

            expect(backoff).toBe(1000); // minBackoff
            expect(elapsed).toBeGreaterThanOrEqual(900);
        });

        it('should increase backoff on consecutive rate limits', async () => {
            resetRateLimit('duckduckgo');

            // First rate limit
            await handleRateLimitResponse('duckduckgo', {});
            // Second rate limit
            const startTime = Date.now();
            const backoff = await handleRateLimitResponse('duckduckgo', {});
            const elapsed = Date.now() - startTime;

            expect(backoff).toBe(2000); // 1000 * 2^1
            expect(elapsed).toBeGreaterThanOrEqual(1900);
        });
    });

    describe('isInBackoff', () => {
        it('should return false when not in backoff', () => {
            resetRateLimit('duckduckgo');
            expect(isInBackoff('duckduckgo')).toBe(false);
        });

        it('should return true when in backoff', () => {
            resetRateLimit('duckduckgo');
            rateLimitState.duckduckgo.backoffUntil = Date.now() + 5000; // 5 seconds in future

            expect(isInBackoff('duckduckgo')).toBe(true);
        });
    });

    describe('getRemainingBackoff', () => {
        it('should return 0 when not in backoff', () => {
            resetRateLimit('duckduckgo');
            expect(getRemainingBackoff('duckduckgo')).toBe(0);
        });

        it('should return remaining time when in backoff', () => {
            resetRateLimit('duckduckgo');
            const futureTime = Date.now() + 5000;
            rateLimitState.duckduckgo.backoffUntil = futureTime;

            const remaining = getRemainingBackoff('duckduckgo');
            expect(remaining).toBeGreaterThanOrEqual(4900);
            expect(remaining).toBeLessThanOrEqual(5000);
        });
    });

    describe('resetRateLimit', () => {
        it('should reset all rate limit state', () => {
            resetRateLimit('duckduckgo');

            // Set some state
            rateLimitState.duckduckgo.requestTimestamps.push(Date.now());
            rateLimitState.duckduckgo.consecutiveRateLimits = 5;
            rateLimitState.duckduckgo.backoffUntil = Date.now() + 10000;

            // Reset
            resetRateLimit('duckduckgo');

            expect(rateLimitState.duckduckgo.requestTimestamps).toHaveLength(0);
            expect(rateLimitState.duckduckgo.consecutiveRateLimits).toBe(0);
            expect(rateLimitState.duckduckgo.backoffUntil).toBe(0);
        });
    });

    describe('withRateLimit', () => {
        it('should call API when under limit', async () => {
            resetRateLimit('duckduckgo');
            let called = false;

            const result = await withRateLimit('duckduckgo', async () => {
                called = true;
                return 'success';
            });

            expect(called).toBe(true);
            expect(result).toBe('success');
        });

        it('should retry on rate limit error', async () => {
            resetRateLimit('duckduckgo');
            let callCount = 0;

            const result = await withRateLimit('duckduckgo', async () => {
                callCount++;
                if (callCount < 2) {
                    const error = new Error('Rate limit exceeded');
                    error.response = { status: 429 };
                    throw error;
                }
                return 'success after retry';
            }, { maxRetries: 3 });

            expect(callCount).toBe(2); // Failed once, succeeded on retry
            expect(result).toBe('success after retry');
        });

        it('should throw after max retries on rate limit', async () => {
            resetRateLimit('duckduckgo');
            let callCount = 0;

            await expect(withRateLimit('duckduckgo', async () => {
                callCount++;
                const error = new Error('Rate limit exceeded');
                error.response = { status: 429 };
                throw error;
            }, { maxRetries: 2 })).rejects.toThrow('Rate limit exceeded');

            // Should have tried maxRetries + 1 times
            expect(callCount).toBeGreaterThanOrEqual(2);
        });

        it('should pass through non-rate-limit errors', async () => {
            resetRateLimit('duckduckgo');

            await expect(withRateLimit('duckduckgo', async () => {
                const error = new Error('Some other error');
                error.status = 500;
                throw error;
            })).rejects.toThrow('Some other error');
        });

        it('should handle unknown API without rate limiting', async () => {
            let called = false;

            const result = await withRateLimit('unknown', async () => {
                called = true;
                return 'success';
            });

            expect(called).toBe(true);
            expect(result).toBe('success');
        });
    });
});
