/**
 * Scheduler Service Tests
 *
 * Tests for the Game Creator Cron Scheduler
 */

// Mock node-cron before importing the service
jest.mock('node-cron', () => ({
    schedule: jest.fn().mockReturnValue({
        stop: jest.fn(),
        nextScheduledInvocation: jest.fn().mockReturnValue(new Date())
    })
}));

// Mock the queue service
jest.mock('../../../src/services/game-creator/queueService', () => ({
    getNextPendingSubmission: jest.fn(),
    markInProgress: jest.fn(),
    markCompleted: jest.fn(),
    markFailed: jest.fn()
}));

const scheduler = require('../../../src/services/game-creator/scheduler');
const cron = require('node-cron');
const queueService = require('../../../src/services/game-creator/queueService');

describe('Scheduler Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Default: feature enabled
        process.env.ENABLE_GAME_CREATOR = '1';
        delete process.env.GAME_CREATOR_CRON_SCHEDULE;
    });

    afterEach(() => {
        jest.useRealTimers();
        // Clean up environment
        delete process.env.ENABLE_GAME_CREATOR;
        delete process.env.GAME_CREATOR_CRON_SCHEDULE;

        // Stop scheduler if running
        if (scheduler.isRunning()) {
            scheduler.stop();
        }
    });

    describe('Configuration', () => {
        describe('isFeatureEnabled', () => {
            it('should return true when ENABLE_GAME_CREATOR is "1"', () => {
                process.env.ENABLE_GAME_CREATOR = '1';
                expect(scheduler.isFeatureEnabled()).toBe(true);
            });

            it('should return true when ENABLE_GAME_CREATOR is "true"', () => {
                process.env.ENABLE_GAME_CREATOR = 'true';
                expect(scheduler.isFeatureEnabled()).toBe(true);
            });

            it('should return false when ENABLE_GAME_CREATOR is "false"', () => {
                process.env.ENABLE_GAME_CREATOR = 'false';
                expect(scheduler.isFeatureEnabled()).toBe(false);
            });

            it('should return false when ENABLE_GAME_CREATOR is "0"', () => {
                process.env.ENABLE_GAME_CREATOR = '0';
                expect(scheduler.isFeatureEnabled()).toBe(false);
            });

            it('should return false when ENABLE_GAME_CREATOR is "disabled"', () => {
                process.env.ENABLE_GAME_CREATOR = 'disabled';
                expect(scheduler.isFeatureEnabled()).toBe(false);
            });

            it('should return true by default when env var is not set', () => {
                delete process.env.ENABLE_GAME_CREATOR;
                expect(scheduler.isFeatureEnabled()).toBe(true);
            });
        });

        describe('getSchedule', () => {
            it('should return default schedule when env var not set', () => {
                expect(scheduler.getSchedule()).toBe('30 * * * *');
            });

            it('should return custom schedule from env var', () => {
                process.env.GAME_CREATOR_CRON_SCHEDULE = '0 * * * *';
                expect(scheduler.getSchedule()).toBe('0 * * * *');
            });
        });
    });

    describe('start', () => {
        it('should start scheduler when feature is enabled', () => {
            scheduler.start();

            expect(cron.schedule).toHaveBeenCalledWith(
                '30 * * * *',
                expect.any(Function),
                expect.objectContaining({
                    scheduled: true,
                    timezone: expect.any(String)
                })
            );
            expect(scheduler.isRunning()).toBe(true);
        });

        it('should use custom schedule from environment', () => {
            process.env.GAME_CREATOR_CRON_SCHEDULE = '0 2 * * *';
            scheduler.start();

            expect(cron.schedule).toHaveBeenCalledWith(
                '0 2 * * *',
                expect.any(Function),
                expect.any(Object)
            );
        });

        it('should not start when feature is disabled', () => {
            process.env.ENABLE_GAME_CREATOR = '0';
            scheduler.start();

            expect(cron.schedule).not.toHaveBeenCalled();
            expect(scheduler.isRunning()).toBe(false);
        });

        it('should not start if already running', () => {
            scheduler.start();
            const firstCallCount = jest.fn().mock.calls.length;

            scheduler.start();

            // Should only be called once
            expect(cron.schedule).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop', () => {
        it('should stop the scheduler', async () => {
            scheduler.start();
            await scheduler.stop();

            expect(scheduler.isRunning()).toBe(false);
        });

        it('should handle stopping when not running', async () => {
            await scheduler.stop();
            // Should not throw
            expect(scheduler.isRunning()).toBe(false);
        });
    });

    describe('getStatus', () => {
        it('should return correct status when not running', () => {
            const status = scheduler.getStatus();

            expect(status).toEqual({
                running: false,
                processing: false,
                schedule: '30 * * * *',
                featureEnabled: true,
                nextRun: null
            });
        });

        it('should return correct status when running', () => {
            scheduler.start();
            const status = scheduler.getStatus();

            expect(status.running).toBe(true);
            expect(status.featureEnabled).toBe(true);
            expect(status.schedule).toBe('30 * * * *');
        });
    });

    describe('processNextGame', () => {
        it('should process a pending submission', async () => {
            const mockSubmission = {
                id: 'sub-001',
                title: 'Test Game',
                status: 'pending'
            };

            queueService.getNextPendingSubmission.mockResolvedValueOnce(mockSubmission);
            queueService.markInProgress.mockResolvedValueOnce(true);

            await scheduler.runNow();

            expect(queueService.getNextPendingSubmission).toHaveBeenCalled();
            expect(queueService.markInProgress).toHaveBeenCalledWith('sub-001');
            expect(queueService.markCompleted).toHaveBeenCalled();
        });

        it('should handle no pending submissions', async () => {
            queueService.getNextPendingSubmission.mockResolvedValueOnce(null);

            await scheduler.runNow();

            expect(queueService.markInProgress).not.toHaveBeenCalled();
            expect(queueService.markCompleted).not.toHaveBeenCalled();
        });

        it('should skip processing if already in progress', async () => {
            await scheduler.runNow();

            // Second call while first is "processing"
            queueService.getNextPendingSubmission.mockResolvedValueOnce({
                id: 'sub-002',
                title: 'Another Game'
            });

            await scheduler.runNow();

            // Should only process once
            expect(queueService.markInProgress).toHaveBeenCalledTimes(1);
        });

        it('should handle processing errors', async () => {
            queueService.getNextPendingSubmission.mockResolvedValueOnce({
                id: 'sub-001',
                title: 'Failing Game'
            });
            queueService.markInProgress.mockRejectedValueOnce(new Error('Lock failed'));

            await scheduler.runNow();

            expect(queueService.markCompleted).not.toHaveBeenCalled();
        });
    });

    describe('runNow', () => {
        it('should trigger immediate processing', async () => {
            queueService.getNextPendingSubmission.mockResolvedValueOnce(null);

            await scheduler.runNow();

            expect(queueService.getNextPendingSubmission).toHaveBeenCalled();
        });
    });
});
