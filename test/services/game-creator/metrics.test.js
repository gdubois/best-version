/**
 * Processing Metrics Collection Tests
 *
 * Tests for metrics collection functionality.
 * GC-5.1: Processing Metrics Collection
 */

const fs = require('fs');
const path = require('path');
const metricsService = require('../../../src/services/game-creator/metrics');

const {
    CONFIG,
    getTodayString,
    loadDailySummary,
    saveDailySummary,
    recordProcessingComplete,
    getTodayMetrics,
    getDateMetrics,
    getLastNDaysMetrics,
    getAggregatedMetrics,
    cleanupOldSummaries,
    startTrackingProcessing,
    recordApiResponse,
    endTrackingProcessing
} = metricsService;

// Test storage directory
const TEST_STORAGE_DIR = path.join(__dirname, '../../test-data/metrics');

describe('Metrics Service', () => {
    beforeEach(() => {
        // Backup original config
        const originalStorageDir = CONFIG.storageDir;

        // Set up test storage directory
        if (!fs.existsSync(TEST_STORAGE_DIR)) {
            fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
        }

        CONFIG.storageDir = TEST_STORAGE_DIR;
    });

    afterEach(() => {
        // Restore original config
        CONFIG.storageDir = path.join(__dirname, '../../../src/data/metrics');

        // Clean up test files
        if (fs.existsSync(TEST_STORAGE_DIR)) {
            const files = fs.readdirSync(TEST_STORAGE_DIR);
            files.forEach(file => {
                fs.unlinkSync(path.join(TEST_STORAGE_DIR, file));
            });
            fs.rmdirSync(TEST_STORAGE_DIR);
        }
    });

    describe('CONFIG', () => {
        it('should have correct configuration', () => {
            expect(CONFIG.dailySummaryFile).toBe('daily-summary.json');
            expect(CONFIG.maxDailyEntries).toBe(1000);
            expect(CONFIG.retentionDays).toBe(90);
        });
    });

    describe('getTodayString', () => {
        it('should return today\'s date in YYYY-MM-DD format', () => {
            const today = new Date().toISOString().split('T')[0];
            expect(getTodayString()).toBe(today);
            expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('loadDailySummary', () => {
        it('should return empty summary for non-existent date', () => {
            const summary = loadDailySummary('2020-01-01');

            expect(summary).toBeDefined();
            expect(summary.date).toBe('2020-01-01');
            expect(summary.processed).toBe(0);
            expect(summary.entries).toHaveLength(0);
        });

        it('should load existing summary', () => {
            const testDate = '2026-04-10';
            const testData = {
                date: testDate,
                processed: 5,
                autoApproved: 3,
                needsReview: 2,
                failed: 0,
                totalProcessingTimeMs: 50000,
                validationFailures: { title: 1 },
                apiResponseTimes: { duckduckgo: [1000], wikipedia: [500] },
                entries: []
            };

            saveDailySummary(testDate, testData);
            const summary = loadDailySummary(testDate);

            expect(summary.processed).toBe(5);
            expect(summary.autoApproved).toBe(3);
        });

        it('should return null on invalid JSON', () => {
            const testDate = '2026-04-11';
            fs.writeFileSync(
                path.join(TEST_STORAGE_DIR, `${testDate}.json`),
                'invalid json{'
            );

            const summary = loadDailySummary(testDate);

            expect(summary).toBeNull();
        });
    });

    describe('recordProcessingComplete', () => {
        it('should record auto-approved game', () => {
            recordProcessingComplete({
                submissionId: 'sub-001',
                title: 'Test Game',
                status: 'auto_approved',
                processingTimeMs: 5000,
                confidenceScore: 0.95,
                apiResponseTimes: {
                    duckduckgoSearch: 1200,
                    wikipedia: 800
                }
            });

            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(1);
            expect(metrics.autoApproved).toBe(1);
            expect(metrics.avgProcessingTimeMs).toBe(5000);
        });

        it('should record game needing review', () => {
            recordProcessingComplete({
                submissionId: 'sub-002',
                title: 'Test Game 2',
                status: 'needs_review',
                processingTimeMs: 6000,
                confidenceScore: 0.6,
                validationIssues: {
                    synopsis: 1,
                    genres: 1
                }
            });

            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(1);
            expect(metrics.needsReview).toBe(1);
            expect(metrics.validationFailures.synopsis).toBe(1);
            expect(metrics.validationFailures.genres).toBe(1);
        });

        it('should record failed processing', () => {
            recordProcessingComplete({
                submissionId: 'sub-003',
                title: 'Test Game 3',
                status: 'failed',
                processingTimeMs: 2000
            });

            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(1);
            expect(metrics.failed).toBe(1);
        });

        it('should aggregate multiple entries', () => {
            recordProcessingComplete({
                submissionId: 'sub-001',
                title: 'Game 1',
                status: 'auto_approved',
                processingTimeMs: 4000
            });

            recordProcessingComplete({
                submissionId: 'sub-002',
                title: 'Game 2',
                status: 'needs_review',
                processingTimeMs: 6000
            });

            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(2);
            expect(metrics.autoApproved).toBe(1);
            expect(metrics.needsReview).toBe(1);
            expect(metrics.avgProcessingTimeMs).toBe(5000); // Average of 4000 and 6000
        });
    });

    describe('getTodayMetrics', () => {
        it('should return zero metrics when no data', () => {
            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(0);
            expect(metrics.successRate).toBe(0);
            expect(metrics.avgProcessingTimeMs).toBe(0);
        });

        it('should calculate correct rates', () => {
            // Record 5 games: 3 auto-approved, 1 needs review, 1 failed
            recordProcessingComplete({ submissionId: '1', title: 'G1', status: 'auto_approved', processingTimeMs: 1000 });
            recordProcessingComplete({ submissionId: '2', title: 'G2', status: 'auto_approved', processingTimeMs: 1000 });
            recordProcessingComplete({ submissionId: '3', title: 'G3', status: 'auto_approved', processingTimeMs: 1000 });
            recordProcessingComplete({ submissionId: '4', title: 'G4', status: 'needs_review', processingTimeMs: 1000 });
            recordProcessingComplete({ submissionId: '5', title: 'G5', status: 'failed', processingTimeMs: 1000 });

            const metrics = getTodayMetrics();

            expect(metrics.processed).toBe(5);
            expect(metrics.successRate).toBe(0.8); // 4/5
            expect(metrics.autoApprovalRate).toBe(0.6); // 3/5
        });

        it('should calculate average API response times', () => {
            recordProcessingComplete({
                submissionId: '1',
                title: 'G1',
                status: 'auto_approved',
                processingTimeMs: 1000,
                apiResponseTimes: { duckduckgo: 1000, wikipedia: 500 }
            });

            recordProcessingComplete({
                submissionId: '2',
                title: 'G2',
                status: 'auto_approved',
                processingTimeMs: 1000,
                apiResponseTimes: { duckduckgo: 2000, wikipedia: 1500 }
            });

            const metrics = getTodayMetrics();

            expect(metrics.avgApiResponseTimes.duckduckgo).toBe(1500);
            expect(metrics.avgApiResponseTimes.wikipedia).toBe(1000);
        });
    });

    describe('getDateMetrics', () => {
        it('should return null for date with no data', () => {
            const metrics = getDateMetrics('2020-01-01');
            expect(metrics).toBeNull();
        });

        it('should return metrics for date with data', () => {
            const testDate = '2026-04-05';
            saveDailySummary(testDate, {
                date: testDate,
                processed: 10,
                autoApproved: 8,
                needsReview: 2,
                failed: 0,
                totalProcessingTimeMs: 50000,
                validationFailures: {},
                apiResponseTimes: { duckduckgo: [1000], wikipedia: [500] },
                entries: []
            });

            const metrics = getDateMetrics(testDate);

            expect(metrics).toBeDefined();
            expect(metrics.processed).toBe(10);
            expect(metrics.successRate).toBe(1.0);
        });
    });

    describe('getLastNDaysMetrics', () => {
        it('should return metrics for specified number of days', () => {
            // This test may vary based on actual data, just verify it returns array
            const metrics = getLastNDaysMetrics(7);
            expect(Array.isArray(metrics)).toBe(true);
            expect(metrics.length).toBeLessThanOrEqual(7);
        });
    });

    describe('getAggregatedMetrics', () => {
        it('should aggregate metrics correctly', () => {
            // Record some data for today
            recordProcessingComplete({ submissionId: '1', title: 'G1', status: 'auto_approved', processingTimeMs: 2000 });
            recordProcessingComplete({ submissionId: '2', title: 'G2', status: 'needs_review', processingTimeMs: 3000 });

            const aggregated = getAggregatedMetrics(1);

            expect(aggregated.periodDays).toBe(1);
            expect(aggregated.totalProcessed).toBe(2);
            expect(aggregated.totalAutoApproved).toBe(1);
            expect(aggregated.totalNeedsReview).toBe(1);
            expect(aggregated.avgProcessingTimeMs).toBe(2500);
        });

        it('should identify most common validation failures', () => {
            recordProcessingComplete({
                submissionId: '1',
                title: 'G1',
                status: 'needs_review',
                processingTimeMs: 1000,
                validationIssues: { synopsis: 1, genres: 1 }
            });

            recordProcessingComplete({
                submissionId: '2',
                title: 'G2',
                status: 'needs_review',
                processingTimeMs: 1000,
                validationIssues: { synopsis: 1, platforms: 1 }
            });

            const aggregated = getAggregatedMetrics(1);

            expect(aggregated.mostCommonValidationFailures[0].field).toBe('synopsis');
            expect(aggregated.mostCommonValidationFailures[0].count).toBe(2);
        });
    });

    describe('Real-time tracking', () => {
        beforeEach(() => {
            // Clear any existing entries
            if (fs.existsSync(TEST_STORAGE_DIR)) {
                const files = fs.readdirSync(TEST_STORAGE_DIR);
                files.forEach(file => {
                    fs.unlinkSync(path.join(TEST_STORAGE_DIR, file));
                });
            }
        });

        it('should track processing with real-time API calls', () => {
            startTrackingProcessing('sub-001', 'Test Game');

            // Simulate API calls
            recordApiResponse('duckduckgoSearch', 1500);
            recordApiResponse('wikipedia', 800);

            // End tracking after some time (simulated with direct entry creation)
            const entry = endTrackingProcessing('auto_approved', 0.9, {});

            expect(entry.submissionId).toBe('sub-001');
            expect(entry.title).toBe('Test Game');
            expect(entry.apiResponseTimes.duckduckgoSearch).toBe(1500);
            expect(entry.apiResponseTimes.wikipedia).toBe(800);
            expect(entry.status).toBe('auto_approved');
            expect(entry.confidenceScore).toBe(0.9);
        });

        it('should handle missing startTrackingProcessing', () => {
            const entry = endTrackingProcessing('auto_approved', 0.9, {});
            expect(entry).toBeNull();
        });

        it('should allow recording API response without affecting if not tracking', () => {
            recordApiResponse('duckduckgoSearch', 1000); // Should not throw

            startTrackingProcessing('sub-001', 'Test Game');
            recordApiResponse('wikipedia', 500);

            const entry = endTrackingProcessing('auto_approved', 0.9, {});

            expect(entry.apiResponseTimes.wikipedia).toBe(500);
            expect(entry.apiResponseTimes.duckduckgoSearch).toBeUndefined(); // Was recorded before tracking
        });
    });

    describe('cleanupOldSummaries', () => {
        it('should not delete recent files', () => {
            const today = getTodayString();
            saveDailySummary(today, {
                date: today,
                processed: 1,
                autoApproved: 1,
                needsReview: 0,
                failed: 0,
                totalProcessingTimeMs: 1000,
                validationFailures: {},
                apiResponseTimes: { duckduckgo: [], wikipedia: [] },
                entries: []
            });

            const deleted = cleanupOldSummaries();

            expect(deleted).toBe(0);
            expect(fs.existsSync(path.join(TEST_STORAGE_DIR, `${today}.json`))).toBe(true);
        });

        it('should delete files older than retention period', () => {
            // Create a file and modify its timestamp to be old (more than 90 days)
            const oldDate = '2025-01-01';
            saveDailySummary(oldDate, {
                date: oldDate,
                processed: 1,
                autoApproved: 1,
                needsReview: 0,
                failed: 0,
                totalProcessingTimeMs: 1000,
                validationFailures: {},
                apiResponseTimes: { duckduckgo: [], wikipedia: [] },
                entries: []
            });

            const filePath = path.join(TEST_STORAGE_DIR, `${oldDate}.json`);
            // Set modification time to more than 90 days ago (using mtime for cleanup check)
            const oldTime = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago
            fs.utimesSync(filePath, oldTime, oldTime);

            const deleted = cleanupOldSummaries();

            expect(deleted).toBe(1);
            expect(fs.existsSync(filePath)).toBe(false);
        });
    });
});
