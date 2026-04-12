/**
 * User Notifications Service
 *
 * Handles sending email notifications to users when their
 * game submissions are approved.
 *
 * GC-6.1: Email Notification on Approval
 */

const { createLogger } = require('./logger');

/**
 * Logger instance for notifications component
 */
const logger = createLogger('notifications', { redactApiKey: true });

/**
 * Configuration for notifications
 */
const CONFIG = {
    resendApiUrl: 'https://api.resend.com',
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@bestversion.com',
    fromName: process.env.NOTIFICATION_FROM_NAME || 'Best Version',
    siteUrl: process.env.SITE_URL || 'http://localhost:1234',
    enabled: process.env.ENABLE_NOTIFICATIONS !== 'false'
};

/**
 * Send email via Resend API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Text body (optional)
 * @returns {Promise<Object>} Result from Resend API
 */
async function sendEmail(options) {
    if (!CONFIG.enabled) {
        logger.debug('Notifications are disabled');
        return { success: false, reason: 'disabled' };
    }

    if (!CONFIG.resendApiKey) {
        logger.warn('Resend API key not configured');
        return { success: false, reason: 'no-api-key' };
    }

    try {
        const response = await fetch(`${CONFIG.resendApiUrl}/emails`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${CONFIG.fromName} <${CONFIG.fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            return { success: false, error: errorData.message, status: response.status };
        }

        const data = await response.json();
        logger.info(`Email sent successfully to ${options.to}`, { messageId: data.id });
        return { success: true, messageId: data.id };

    } catch (error) {
        logger.error(`Failed to send email: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Generate HTML email template for approval notification
 * @param {Object} game - Game data
 * @param {string} game.title - Game title
 * @param {string} game.slug - URL slug
 * @returns {string} HTML template
 */
function generateApprovalEmailHtml(game) {
    const gameUrl = `${CONFIG.siteUrl}/games/${game.slug}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Has Been Approved</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .body {
            padding: 2rem;
        }
        .body h2 {
            color: #1f2937;
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 1rem;
        }
        .body p {
            margin: 0 0 1rem 0;
            color: #4b5563;
        }
        .game-card {
            background: #f9fafb;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            border-left: 4px solid #6366f1;
        }
        .game-card h3 {
            margin: 0 0 0.5rem 0;
            color: #1f2937;
            font-size: 1.125rem;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 1rem 0;
        }
        .btn:hover {
            opacity: 0.9;
        }
        .footer {
            background: #f9fafb;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            color: #6b7280;
        }
        .footer a {
            color: #6366f1;
            text-decoration: underline;
        }
        .unsubscribe {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }
        .unsubscribe a {
            color: #9ca3af;
            font-size: 0.75rem;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Your Game Has Been Approved!</h1>
        </div>
        <div class="body">
            <h2>Great news!</h2>
            <p>Thank you for your submission. We're excited to let you know that <strong>"${game.title}"</strong> has been approved and is now live on Best Version!</p>

            <div class="game-card">
                <h3>${game.title}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
                    📅 Added to our curated collection of retro games
                </p>
            </div>

            <p>Your submission is now visible to all visitors of the site and contributes to our growing community resource.</p>

            <div style="text-align: center;">
                <a href="${gameUrl}" class="btn">View Your Game</a>
            </div>

            <p style="margin-top: 1.5rem;">Thank you for being part of the Best Version community!</p>
        </div>
        <div class="footer">
            <p><strong>Best Version</strong></p>
            <p>The ultimate resource for retro game enthusiasts</p>
            <p><a href="${CONFIG.siteUrl}">Visit our website</a></p>

            <div class="unsubscribe">
                <p>You're receiving this email because you submitted a game to Best Version.</p>
                <p><a href="${CONFIG.siteUrl}/unsubscribe?email={EMAIL}">Unsubscribe from notifications</a></p>
            </div>
        </div>
    </div>
</body>
</html>
`.trim();
}

/**
 * Generate plain text version of approval email
 * @param {Object} game - Game data
 * @returns {string} Plain text template
 */
function generateApprovalEmailText(game) {
    const gameUrl = `${CONFIG.siteUrl}/games/${game.slug}`;

    return `
YOUR GAME HAS BEEN APPROVED!

Great news! Thank you for your submission.

"${game.title}" has been approved and is now live on Best Version!

View your game: ${gameUrl}

Your submission is now visible to all visitors of the site.

Thank you for being part of the Best Version community!

---
Best Version
The ultimate resource for retro game enthusiasts
${CONFIG.siteUrl}

You're receiving this email because you submitted a game to Best Version.
To unsubscribe: ${CONFIG.siteUrl}/unsubscribe?email={EMAIL}
`.trim();
}

/**
 * Send approval notification to user
 * @param {Object} options - Notification options
 * @param {string} options.userEmail - User's email address
 * @param {string} options.gameTitle - Approved game title
 * @param {string} options.gameSlug - Game URL slug
 * @returns {Promise<Object>} Result of sending notification
 */
async function sendApprovalNotification(options) {
    const { userEmail, gameTitle, gameSlug } = options;

    if (!userEmail) {
        logger.warn('Cannot send approval notification: no email address provided');
        return { success: false, reason: 'no-email' };
    }

    const game = {
        title: gameTitle,
        slug: gameSlug
    };

    // Generate email content and replace placeholder with actual email
    let html = generateApprovalEmailHtml(game);
    let text = generateApprovalEmailText(game);

    // Replace {EMAIL} placeholder with actual email (URL encoded)
    const encodedEmail = encodeURIComponent(userEmail);
    html = html.replace(/\{EMAIL\}/g, encodedEmail);
    text = text.replace(/\{EMAIL\}/g, userEmail);

    const subject = `🎮 "${gameTitle}" has been approved on Best Version!`;

    const result = await sendEmail({
        to: userEmail,
        subject,
        html,
        text
    });

    // Log the notification event
    logger.info(`Approval notification sent for "${gameTitle}"`, {
        userEmail,
        gameSlug,
        success: result.success
    });

    return result;
}

/**
 * Log a notification event for audit purposes
 * @param {Object} event - Event to log
 * @param {string} event.type - Event type (approval, etc.)
 * @param {string} event.userEmail - User email
 * @param {string} event.gameSlug - Game slug
 * @param {boolean} event.success - Whether notification was successful
 */
async function logNotificationEvent(event) {
    // In a full implementation, this would write to a notifications log file
    // For now, we just use the logger
    logger.info('Notification event', event);
}

/**
 * Get notification configuration status
 * @returns {Object} Config status
 */
function getNotificationStatus() {
    return {
        enabled: CONFIG.enabled,
        apiKeyConfigured: !!CONFIG.resendApiKey,
        fromEmail: CONFIG.fromEmail,
        fromName: CONFIG.fromName
    };
}

module.exports = {
    CONFIG,
    sendEmail,
    generateApprovalEmailHtml,
    generateApprovalEmailText,
    sendApprovalNotification,
    logNotificationEvent,
    getNotificationStatus
};
