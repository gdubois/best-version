// Email notification service using Resend API

const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY || null;
    this.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    this.useMock = !this.resendApiKey;
  }

  // Send approval notification email
  async sendApprovalEmail(submitterEmail, gameTitle, gameSlug) {
    if (!submitterEmail) {
      console.warn('EmailService: No submitter email provided for approval notification');
      return { success: false, error: 'No email address' };
    }

    const subject = 'Your game submission was approved!';
    const gameUrl = `${this.siteUrl}/games/${gameSlug}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #eee;
            line-height: 1.6;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #111111;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
          }
          .success-icon {
            font-size: 3rem;
            margin-bottom: 10px;
          }
          h1 {
            color: #00ff88;
            margin-bottom: 10px;
          }
          .game-info {
            background: #0a0a0a;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #00ff88;
          }
          .game-title {
            font-size: 1.25rem;
            color: #fff;
            margin-bottom: 5px;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background: #00ff88;
            color: #0a0a0a;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background: #00cc6a;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
            color: #666;
            font-size: 0.875rem;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>Submission Approved!</h1>
          </div>

          <p>Hello,</p>

          <p>Your game submission has been approved and is now live on Best Version!</p>

          <div class="game-info">
            <div class="game-title">${this.escapeHtml(gameTitle)}</div>
            <div style="color: #888; font-size: 0.9rem;">View your game</div>
          </div>

          <div style="text-align: center;">
            <a href="${this.escapeHtml(gameUrl)}" class="cta-button">View Game</a>
          </div>

          <p>Thank you for contributing to the Best Version community!</p>

          <div class="footer">
            <p>This email was sent because you submitted a game to Best Version.</p>
            <p>&copy; ${new Date().getFullYear()} Best Version. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Your game submission was approved!

      ${gameTitle} is now live on Best Version.

      View your game: ${gameUrl}

      Thank you for contributing to the Best Version community!
    `;

    return await this.sendEmail(submitterEmail, subject, html, text);
  }

  // Send rejection notification email
  async sendRejectionEmail(submitterEmail, gameTitle, rejectionReason) {
    if (!submitterEmail) {
      console.warn('EmailService: No submitter email provided for rejection notification');
      return { success: false, error: 'No email address' };
    }

    const subject = 'Your game submission was reviewed';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #eee;
            line-height: 1.6;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #111111;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
          }
          .warning-icon {
            font-size: 3rem;
            margin-bottom: 10px;
          }
          h1 {
            color: #ffaa00;
            margin-bottom: 10px;
          }
          .game-info {
            background: #0a0a0a;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ffaa00;
          }
          .game-title {
            font-size: 1.25rem;
            color: #fff;
            margin-bottom: 5px;
          }
          .reason-box {
            background: rgba(255, 170, 0, 0.1);
            border: 1px solid #ffaa00;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .reason-label {
            color: #ffaa00;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .reason-text {
            color: #ddd;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 28px;
            background: #9d4edd;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .cta-button:hover {
            background: #8b3dd6;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
            color: #666;
            font-size: 0.875rem;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Submission Review Complete</h1>
          </div>

          <p>Hello,</p>

          <p>Thank you for your submission. After review, we were unable to approve:</p>

          <div class="game-info">
            <div class="game-title">${this.escapeHtml(gameTitle)}</div>
          </div>

          <div class="reason-box">
            <div class="reason-label">Reason for Rejection</div>
            <div class="reason-text">${this.escapeHtml(rejectionReason)}</div>
          </div>

          <p>If you have questions about this decision or would like to make corrections, please feel free to resubmit.</p>

          <div style="text-align: center;">
            <a href="${this.siteUrl}/submit" class="cta-button">Resubmit</a>
          </div>

          <div class="footer">
            <p>This email was sent because you submitted a game to Best Version.</p>
            <p>&copy; ${new Date().getFullYear()} Best Version. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Submission Review Complete

      Thank you for your submission. After review, we were unable to approve:

      ${gameTitle}

      Reason for Rejection:
      ${rejectionReason}

      If you have questions about this decision or would like to make corrections, please feel free to resubmit.

      Resubmit your game: ${this.siteUrl}/submit

      Thank you for contributing to the Best Version community!
    `;

    return await this.sendEmail(submitterEmail, subject, html, text);
  }

  // Generic send email function
  async sendEmail(to, subject, html, text) {
    if (this.useMock) {
      console.log(`[Email Service Mock] Would send email to: ${to}`);
      console.log(`[Email Service Mock] Subject: ${subject}`);
      console.log(`[Email Service Mock] HTML length: ${html.length} characters`);
      console.log(`[Email Service Mock] Text length: ${text.length} characters`);
      return { success: true, sent: false, mocked: true };
    }

    try {
      const resend = new Resend(this.resendApiKey);

      const response = await resend.emails.send({
        from: 'Best Version <noreply@best-version.com>',
        to: [to],
        subject: subject,
        html: html,
        text: text
      });

      if (response.error) {
        console.error('EmailService: Resend API error:', response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, sent: true, messageId: response.data?.id };
    } catch (error) {
      console.error('EmailService: Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Escape HTML for safe display
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Health check
  healthCheck() {
    return {
      configured: !this.useMock,
      useMock: this.useMock,
      siteUrl: this.siteUrl
    };
  }
}

module.exports = { EmailService };
