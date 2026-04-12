/**
 * Health Check API Integration Tests
 *
 * Tests for the actual health check endpoint behavior.
 * GC-5.2: Health Check Endpoint
 */

// Mock all dependencies before importing the GET handler
jest.mock('../../../src/services/game-creator/metrics', () => ({
    getTodayMetrics: jest.fn(),
    getAggregatedMetrics: jest.fn()
}));

jest.mock('../../../src/services/game-creator/rateLimiter', () => ({
    getAllRateLimitStatus: jest.fn()
}));

jest.mock('../../../src/services/game-creator/failureTracking', () => ({
    getFailureStats: jest.fn()
}));

jest.mock('../../../src/services/game-creator/queueService', () => ({
    getQueueStats: jest.fn()
}));

// Import mocks after mocking
const metricsService = require('../../../src/services/game-creator/metrics');
const rateLimiterService = require('../../../src/services/game-creator/rateLimiter');
const failureTrackingService = require('../../../src/services/game-creator/failureTracking');
const queueService = require('../../../src/services/game-creator/queueService');

// Import the actual GET handler
const healthApi = require('../../../src/api/admin/health.ts');

describe('Health Check API Integration', () => {
    const baseMocks = {
        queueStats: {
            total: 20,
            pending: 5,
            inProgress: 1,
            completed: 10,
            failed: 3,
            needsReview: 1
        },
        todayMetrics: {
            processed: 10,
            autoApproved: 7,
            needsReview: 2,
            failed: 1,
            successRate: 0.9,
            avgProcessingTimeMs: 5000
        },
        aggregatedMetrics: {
            totalProcessed: 50,
            avgSuccessRate: 0.85,
            avgAutoApprovalRate: 0.7
        },
        rateLimitStatus: {
            duckduckgo: {
                requestsThisMinute: 10,
                requestsPerMinuteLimit: 50,
                remainingThisMinute: 40,
                inBackoff: false
            },
            wikipedia: {
                requestsThisMinute: 2,
                requestsPerMinuteLimit: 10,
                remainingThisMinute: 8,
                inBackoff: false
            }
        },
        failureStats: {
            totalFailures: 5,
            recent24h: 2,
            eligibleForRetry: 1
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Set up default healthy mocks
        queueService.getQueueStats.mockResolvedValue(baseMocks.queueStats);
        metricsService.getTodayMetrics.mockReturnValue(baseMocks.todayMetrics);
        metricsService.getAggregatedMetrics.mockReturnValue(baseMocks.aggregatedMetrics);
        rateLimiterService.getAllRateLimitStatus.mockReturnValue(baseMocks.rateLimitStatus);
        failureTrackingService.getFailureStats.mockResolvedValue(baseMocks.failureStats);
    });

    describe('GET /api/admin/health', () => {
        it('should return 200 status when healthy', async () => {
            const response = await healthApi.GET();

            expect(response.status).toBe(200);
        });

        it('should return valid JSON response', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body).toBeDefined();
            expect(typeof body).toBe('object');
        });

        it('should include all required response fields', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body).toHaveProperty('status');
            expect(body).toHaveProperty('timestamp');
            expect(body).toHaveProperty('responseTimeMs');
            expect(body).toHaveProperty('service');
            expect(body).toHaveProperty('queue');
            expect(body).toHaveProperty('processing');
            expect(body).toHaveProperty('rateLimits');
            expect(body).toHaveProperty('failures');
        });

        it('should include correct content-type header', async () => {
            const response = await healthApi.GET();

            expect(response.headers.get('Content-Type')).toBe('application/json');
        });

        it('should include X-Health-Status header', async () => {
            const response = await healthApi.GET();

            expect(response.headers.get('X-Health-Status')).toBe('healthy');
        });

        it('should include X-Response-Time-Ms header', async () => {
            const response = await healthApi.GET();

            expect(response.headers.get('X-Response-Time-Ms')).toBeDefined();
            expect(parseInt(response.headers.get('X-Response-Time-Ms'))).toBeGreaterThanOrEqual(0);
        });

        it('should include service metadata', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.service).toHaveProperty('name', 'Game Creator Service');
            expect(body.service).toHaveProperty('version');
            expect(body.service).toHaveProperty('enabled');
        });

        it('should include queue statistics', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.queue).toHaveProperty('pending', 5);
            expect(body.queue).toHaveProperty('inProgress', 1);
            expect(body.queue).toHaveProperty('total', 20);
        });

        it('should include processing metrics', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.processing.today).toHaveProperty('processed', 10);
            expect(body.processing.today).toHaveProperty('autoApproved', 7);
            expect(body.processing.today).toHaveProperty('successRate', 0.9);
            expect(body.processing.last7Days).toHaveProperty('totalProcessed', 50);
        });

        it('should include rate limit status', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.rateLimits).toHaveProperty('duckduckgo');
            expect(body.rateLimits).toHaveProperty('wikipedia');
            expect(body.rateLimits.duckduckgo).toHaveProperty('remaining', 40);
            expect(body.rateLimits.duckduckgo).toHaveProperty('inBackoff', false);
        });

        it('should include failure statistics', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.failures).toHaveProperty('total', 5);
            expect(body.failures).toHaveProperty('recent24h', 2);
            expect(body.failures).toHaveProperty('eligibleForRetry', 1);
        });
    });

    describe('Unhealthy scenarios', () => {
        it('should return 503 when API is in backoff', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                duckduckgo: { ...baseMocks.rateLimitStatus.duckduckgo, inBackoff: true }
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);

            const body = await response.json();
            expect(body.status).toBe('degraded');
        });

        it('should return 503 when Wikipedia is in backoff', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                wikipedia: { ...baseMocks.rateLimitStatus.wikipedia, inBackoff: true }
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return 503 when DuckDuckGo rate limit is critically low', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                duckduckgo: { ...baseMocks.rateLimitStatus.duckduckgo, remainingThisMinute: 3 }
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return 503 when Wikipedia rate limit is critically low', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                wikipedia: { ...baseMocks.rateLimitStatus.wikipedia, remainingThisMinute: 0 }
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return 503 when failure rate is high (>10 in 24h)', async () => {
            failureTrackingService.getFailureStats.mockResolvedValue({
                ...baseMocks.failureStats,
                recent24h: 15
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return 503 with X-Health-Status header when degraded', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                duckduckgo: { ...baseMocks.rateLimitStatus.duckduckgo, inBackoff: true }
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
            expect(response.headers.get('X-Health-Status')).toBe('degraded');
        });
    });

    describe('Error handling', () => {
        it('should return 503 when queue service throws', async () => {
            queueService.getQueueStats.mockRejectedValue(new Error('Queue service unavailable'));

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
            expect(response.headers.get('X-Health-Status')).toBe('error');
        });

        it('should return 503 when metrics service throws', async () => {
            metricsService.getTodayMetrics.mockImplementation(() => {
                throw new Error('Metrics service unavailable');
            });

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return 503 when failure tracking throws', async () => {
            failureTrackingService.getFailureStats.mockRejectedValue(new Error('Failure tracking unavailable'));

            const response = await healthApi.GET();

            expect(response.status).toBe(503);
        });

        it('should return valid JSON even when services fail', async () => {
            queueService.getQueueStats.mockRejectedValue(new Error('Service error'));

            const response = await healthApi.GET();

            // Should still return valid JSON
            const body = await response.json();
            expect(body).toBeDefined();
            expect(body.status).toBe('error');
        });

        it('should include default values when services fail', async () => {
            queueService.getQueueStats.mockRejectedValue(new Error('Service error'));

            const response = await healthApi.GET();
            const body = await response.json();

            // Should have safe defaults
            expect(body.queue.pending).toBe(0);
            expect(body.queue.inProgress).toBe(0);
            expect(body.failures.total).toBe(0);
        });
    });

    describe('Response time tracking', () => {
        it('should record response time in response body', async () => {
            const response = await healthApi.GET();
            const body = await response.json();

            expect(body.responseTimeMs).toBeDefined();
            expect(body.responseTimeMs).toBeGreaterThan(0);
            expect(body.responseTimeMs).toBeLessThan(1000); // Should be fast
        });

        it('should include response time in header', async () => {
            const response = await healthApi.GET();

            const headerTime = parseInt(response.headers.get('X-Response-Time-Ms'));
            const body = await response.json();

            expect(headerTime).toBe(body.responseTimeMs);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty queue stats', async () => {
            queueService.getQueueStats.mockResolvedValue({
                total: 0,
                pending: 0,
                inProgress: 0,
                completed: 0,
                failed: 0,
                needsReview: 0
            });

            const response = await healthApi.GET();
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.queue.total).toBe(0);
        });

        it('should handle zero processing metrics', async () => {
            metricsService.getTodayMetrics.mockReturnValue({
                processed: 0,
                autoApproved: 0,
                needsReview: 0,
                failed: 0,
                successRate: 0,
                avgProcessingTimeMs: 0
            });

            const response = await healthApi.GET();
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.processing.today.processed).toBe(0);
        });

        it('should handle zero rate limit remaining without being unhealthy', async () => {
            rateLimiterService.getAllRateLimitStatus.mockReturnValue({
                ...baseMocks.rateLimitStatus,
                duckduckgo: { ...baseMocks.rateLimitStatus.duckduckgo, remainingThisMinute: 5 }, // Exactly at threshold
                wikipedia: { ...baseMocks.rateLimitStatus.wikipedia, remainingThisMinute: 1 } // Exactly at threshold
            });

            const response = await healthApi.GET();

            // Should still be healthy at exactly the threshold
            expect(response.status).toBe(200);
        });

        it('should handle exact failure threshold (10)', async () => {
            failureTrackingService.getFailureStats.mockResolvedValue({
                ...baseMocks.failureStats,
                recent24h: 10 // Exactly at threshold
            });

            const response = await healthApi.GET();

            // Should still be healthy at exactly 10 (unhealthy is > 10)
            expect(response.status).toBe(200);
        });
    });
});
