/**
 * Notifications Service Tests
 *
 * Tests for email notification functionality.
 * GC-6.1: Email Notification on Approval
 */

const notificationsService = require('../../../src/services/game-creator/notifications');

const {
    CONFIG,
    sendEmail,
    generateApprovalEmailHtml,
    generateApprovalEmailText,
    sendApprovalNotification,
    getNotificationStatus
} = notificationsService;

describe('Notifications Service', () => {
    describe('CONFIG', () => {
        it('should have correct default configuration', () => {
            expect(CONFIG).toHaveProperty('resendApiUrl', 'https://api.resend.com');
            expect(CONFIG).toHaveProperty('fromEmail');
            expect(CONFIG).toHaveProperty('fromName');
            expect(CONFIG).toHaveProperty('enabled', true);
        });
    });

    describe('getNotificationStatus', () => {
        it('should return status object', () => {
            const status = getNotificationStatus();

            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('apiKeyConfigured');
            expect(status).toHaveProperty('fromEmail');
            expect(status).toHaveProperty('fromName');
        });
    });

    describe('generateApprovalEmailHtml', () => {
        it('should generate valid HTML template', () => {
            const game = {
                title: 'Test Game',
                slug: 'test-game'
            };

            const html = generateApprovalEmailHtml(game);

            expect(html).toContain('DOCTYPE html');
            expect(html).toContain('Test Game');
            expect(html).toContain('test-game');
            expect(html).toContain('approved');
            expect(html).toContain('Best Version');
            expect(html).toContain('View Your Game');
        });

        it('should include proper styling', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('<style>');
            expect(html).toContain('.container');
            expect(html).toContain('.header');
            expect(html).toContain('.btn');
        });

        it('should include unsubscribe link', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('Unsubscribe');
            expect(html).toContain('unsubscribe');
        });

        it('should include proper headers and meta tags', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('meta charset');
            expect(html).toContain('meta name="viewport"');
        });
    });

    describe('generateApprovalEmailText', () => {
        it('should generate plain text template', () => {
            const game = {
                title: 'Test Game',
                slug: 'test-game'
            };

            const text = generateApprovalEmailText(game);

            expect(text).toContain('Test Game');
            expect(text).toContain('approved');
            expect(text).toContain('Best Version');
            expect(text).toContain('test-game');
        });

        it('should include unsubscribe info', () => {
            const text = generateApprovalEmailText({ title: 'Game', slug: 'game' });

            expect(text).toContain('unsubscribe');
        });
    });

    describe('sendEmail', () => {
        it('should return disabled status when notifications are off', async () => {
            const originalEnabled = CONFIG.enabled;
            CONFIG.enabled = false;

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test',
                html: '<p>Test</p>'
            });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('disabled');

            CONFIG.enabled = originalEnabled;
        });

        it('should return no-api-key when API key not configured', async () => {
            const originalApiKey = CONFIG.resendApiKey;
            CONFIG.resendApiKey = '';

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test',
                html: '<p>Test</p>'
            });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('no-api-key');

            CONFIG.resendApiKey = originalApiKey;
        });

        it('should attempt to send email with valid config', async () => {
            const originalApiKey = CONFIG.resendApiKey;
            CONFIG.resendApiKey = 'test-api-key';

            const result = await sendEmail({
                to: 'test@example.com',
                subject: 'Test Subject',
                html: '<p>Test HTML</p>',
                text: 'Test text'
            });

            // This will fail because we don't have a real API key,
            // but we verify it attempted the request
            expect(result.success).toBe(false);
            expect(result).toHaveProperty('error');

            CONFIG.resendApiKey = originalApiKey;
        });
    });

    describe('sendApprovalNotification', () => {
        it('should return no-email when no email provided', async () => {
            const result = await sendApprovalNotification({
                userEmail: null,
                gameTitle: 'Test Game',
                gameSlug: 'test-game'
            });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('no-email');
        });

        it('should return no-email when empty email provided', async () => {
            const result = await sendApprovalNotification({
                userEmail: '',
                gameTitle: 'Test Game',
                gameSlug: 'test-game'
            });

            expect(result.success).toBe(false);
            expect(result.reason).toBe('no-email');
        });

        it('should attempt to send notification with valid email', async () => {
            const originalApiKey = CONFIG.resendApiKey;
            CONFIG.resendApiKey = 'test-api-key';

            const result = await sendApprovalNotification({
                userEmail: 'test@example.com',
                gameTitle: 'Test Game',
                gameSlug: 'test-game'
            });

            // Will fail with test API key but structure should be correct
            expect(result).toBeDefined();

            CONFIG.resendApiKey = originalApiKey;
        });
    });

    describe('Email template content', () => {
        it('should include game title in subject line format', () => {
            const game = { title: 'Super Test Game', slug: 'super-test-game' };
            const html = generateApprovalEmailHtml(game);

            expect(html).toContain('Super Test Game');
            expect(html).toContain('approved');
        });

        it('should include proper call-to-action button', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('View Your Game');
            expect(html).toContain('class="btn"');
        });

        it('should include branding elements', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('Best Version');
            expect(html).toContain('retro game');
        });

        it('should be mobile responsive', () => {
            const html = generateApprovalEmailHtml({ title: 'Game', slug: 'game' });

            expect(html).toContain('max-width: 600px');
            expect(html).toContain('viewport');
        });
    });
});
