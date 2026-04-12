/**
 * Health Check API Endpoint
 *
 * Provides health status of the game creator service.
 * GC-5.2: Health Check Endpoint
 */

import type { APIRoute } from 'astro';
import { getTodayMetrics, getAggregatedMetrics } from '../../services/game-creator/metrics';
import { getAllRateLimitStatus } from '../../services/game-creator/rateLimiter';
import { getFailureStats } from '../../services/game-creator/failureTracking';
import { getQueueStats } from '../../services/game-creator/queueService';

interface HealthResponse {
    status: 'healthy' | 'degraded' | 'error';
    timestamp: string;
    responseTimeMs: number;
    service: {
        name: string;
        version: string;
        enabled: boolean;
    };
    queue: {
        pending: number;
        inProgress: number;
        total: number;
    };
    processing: {
        today: {
            processed: number;
            autoApproved: number;
            needsReview: number;
            failed: number;
            successRate: number;
            avgProcessingTimeMs: number;
        };
        last7Days: {
            totalProcessed: number;
            avgSuccessRate: number;
            avgAutoApprovalRate: number;
        };
    };
    rateLimits: {
        duckduckgo: {
            requestsThisMinute: number;
            limit: number;
            remaining: number;
            inBackoff: boolean;
        };
        wikipedia: {
            requestsThisMinute: number;
            limit: number;
            remaining: number;
            inBackoff: boolean;
        };
    };
    failures: {
        total: number;
        recent24h: number;
        eligibleForRetry: number;
    };
}

export const GET: APIRoute = async () => {
    const startTime = Date.now();

    try {
        // Get queue stats
        const queueStats: any = await getQueueStats();

        // Get metrics
        const todayMetrics: any = getTodayMetrics();
        const aggregatedMetrics: any = getAggregatedMetrics(7);

        // Get rate limit status
        const rateLimitStatus: any = getAllRateLimitStatus();

        // Get failure stats
        const failureStats: any = await getFailureStats();

        // Determine overall health
        const isHealthy = determineHealthStatus(
            rateLimitStatus,
            failureStats,
            Date.now() - startTime
        );

        const response: HealthResponse = {
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            responseTimeMs: Date.now() - startTime,
            service: {
                name: 'Game Creator Service',
                version: '1.0.0',
                enabled: process.env.ENABLE_GAME_CREATOR !== 'false'
            },
            queue: {
                pending: queueStats.pending || 0,
                inProgress: queueStats.inProgress || 0,
                total: queueStats.total || 0
            },
            processing: {
                today: {
                    processed: todayMetrics.processed || 0,
                    autoApproved: todayMetrics.autoApproved || 0,
                    needsReview: todayMetrics.needsReview || 0,
                    failed: todayMetrics.failed || 0,
                    successRate: todayMetrics.successRate || 0,
                    avgProcessingTimeMs: todayMetrics.avgProcessingTimeMs || 0
                },
                last7Days: {
                    totalProcessed: aggregatedMetrics.totalProcessed || 0,
                    avgSuccessRate: aggregatedMetrics.avgSuccessRate || 0,
                    avgAutoApprovalRate: aggregatedMetrics.avgAutoApprovalRate || 0
                }
            },
            rateLimits: {
                duckduckgo: {
                    requestsThisMinute: rateLimitStatus.duckduckgo?.requestsThisMinute || 0,
                    limit: rateLimitStatus.duckduckgo?.requestsPerMinuteLimit || 50,
                    remaining: rateLimitStatus.duckduckgo?.remainingThisMinute || 50,
                    inBackoff: rateLimitStatus.duckduckgo?.inBackoff || false
                },
                wikipedia: {
                    requestsThisMinute: rateLimitStatus.wikipedia?.requestsThisMinute || 0,
                    limit: rateLimitStatus.wikipedia?.requestsPerMinuteLimit || 10,
                    remaining: rateLimitStatus.wikipedia?.remainingThisMinute || 10,
                    inBackoff: rateLimitStatus.wikipedia?.inBackoff || false
                }
            },
            failures: {
                total: failureStats.totalFailures || 0,
                recent24h: failureStats.recent24h || 0,
                eligibleForRetry: failureStats.eligibleForRetry || 0
            }
        };

        const statusCode = isHealthy ? 200 : 503;

        return new Response(JSON.stringify(response), {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Health-Status': response.status,
                'X-Response-Time-Ms': String(response.responseTimeMs)
            }
        });

    } catch (error: any) {
        const response: HealthResponse = {
            status: 'error',
            timestamp: new Date().toISOString(),
            responseTimeMs: Date.now() - startTime,
            service: {
                name: 'Game Creator Service',
                version: '1.0.0',
                enabled: process.env.ENABLE_GAME_CREATOR !== 'false'
            },
            queue: { pending: 0, inProgress: 0, total: 0 },
            processing: {
                today: { processed: 0, autoApproved: 0, needsReview: 0, failed: 0, successRate: 0, avgProcessingTimeMs: 0 },
                last7Days: { totalProcessed: 0, avgSuccessRate: 0, avgAutoApprovalRate: 0 }
            },
            rateLimits: {
                duckduckgo: { requestsThisMinute: 0, limit: 50, remaining: 50, inBackoff: false },
                wikipedia: { requestsThisMinute: 0, limit: 10, remaining: 10, inBackoff: false }
            },
            failures: { total: 0, recent24h: 0, eligibleForRetry: 0 }
        };

        return new Response(JSON.stringify(response), {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Health-Status': 'error'
            }
        });
    }
};

/**
 * Determine overall health status based on various metrics
 */
function determineHealthStatus(
    rateLimitStatus: any,
    failureStats: any,
    responseTimeMs: number
): boolean {
    // Check response time (should be under 1 second)
    if (responseTimeMs > 1000) {
        return false;
    }

    // Check if any API is in backoff
    if (rateLimitStatus.duckduckgo?.inBackoff || rateLimitStatus.wikipedia?.inBackoff) {
        return false;
    }

    // Check if rate limits are critically low (less than 10% remaining)
    const ddgRemaining = rateLimitStatus.duckduckgo?.remainingThisMinute || 50;
    const wikiRemaining = rateLimitStatus.wikipedia?.remainingThisMinute || 10;

    if (ddgRemaining < 5 || wikiRemaining < 1) {
        return false;
    }

    // Check for high failure rate (more than 10 failed in last 24h)
    if (failureStats.recent24h > 10) {
        return false;
    }

    return true;
}
