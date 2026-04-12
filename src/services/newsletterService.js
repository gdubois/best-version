// Newsletter service for managing subscriber list and newsletter delivery

const fs = require('fs');
const path = require('path');
const { EmailService } = require('./emailService');

class NewsletterService {
  constructor(subscribersFile, emailService, contentFile) {
    this.subscribersFile = subscribersFile;
    this.contentFile = contentFile;
    this.emailService = emailService || new EmailService();
    this.rateLimit = 5; // Max submissions per day per IP
    this.rateLimitWindow = 24 * 60 * 60 * 1000; // 24 hours
    this.deliveryLogFile = path.join(__dirname, '../.newsletters_delivery.log');

    // Ensure files exist
    if (!fs.existsSync(this.subscribersFile)) {
      fs.writeFileSync(this.subscribersFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.contentFile)) {
      fs.writeFileSync(this.contentFile, JSON.stringify({
        featuredGames: [],
        newAdditions: [],
        updatedEntries: []
      }, null, 2));
    }
  }

  // Get all subscribers
  getAllSubscribers() {
    try {
      const data = fs.readFileSync(this.subscribersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading subscribers:', error);
      return [];
    }
  }

  // Save subscribers to file
  saveSubscribers(subscribers) {
    try {
      fs.writeFileSync(this.subscribersFile, JSON.stringify(subscribers, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving subscribers:', error);
      return false;
    }
  }

  // Check if email is already subscribed
  isSubscribed(email) {
    const subscribers = this.getAllSubscribers();
    return subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
  }

  // Check rate limit for IP
  isRateLimited(ip) {
    const now = Date.now();
    const subscribers = this.getAllSubscribers();

    // Find recent subscription attempts from this IP
    const recentAttempts = subscribers.filter(s =>
      s.ip === ip &&
      (now - new Date(s.subscribedAt).getTime()) < this.rateLimitWindow
    );

    return recentAttempts.length >= this.rateLimit;
  }

  // Subscribe to newsletter
  subscribe(email, ip) {
    const subscribers = this.getAllSubscribers();

    // Check if already subscribed
    if (this.isSubscribed(email)) {
      return { success: false, error: 'Already subscribed' };
    }

    // Check rate limit
    if (this.isRateLimited(ip)) {
      return { success: false, error: 'Rate limit exceeded. Please try again tomorrow.' };
    }

    // Create subscription record
    const newSubscriber = {
      id: this.generateId(),
      email: email.toLowerCase().trim(),
      subscribedAt: new Date().toISOString(),
      ip: ip || null,
      unsubscribedAt: null
    };

    subscribers.push(newSubscriber);
    this.saveSubscribers(subscribers);

    return { success: true, data: newSubscriber };
  }

  // Unsubscribe from newsletter
  unsubscribe(token) {
    const subscribers = this.getAllSubscribers();
    const index = subscribers.findIndex(s => s.id === token);

    if (index === -1) {
      return { success: false, error: 'Invalid subscription token' };
    }

    const subscriber = subscribers[index];

    if (subscriber.unsubscribedAt) {
      return { success: false, error: 'Already unsubscribed' };
    }

    subscriber.unsubscribedAt = new Date().toISOString();
    this.saveSubscribers(subscribers);

    return { success: true, data: subscriber };
  }

  // Get active subscribers (not unsubscribed)
  getActiveSubscribers() {
    const subscribers = this.getAllSubscribers();
    return subscribers.filter(s => !s.unsubscribedAt);
  }

  // Get newsletter content
  getNewsletterContent() {
    try {
      const data = fs.readFileSync(this.contentFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading newsletter content:', error);
      return { featuredGames: [], newAdditions: [], updatedEntries: [] };
    }
  }

  // Save newsletter content
  saveNewsletterContent(content) {
    try {
      fs.writeFileSync(this.contentFile, JSON.stringify(content, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving newsletter content:', error);
      return false;
    }
  }

  // Update newsletter content
  updateNewsletterContent(content) {
    return this.saveNewsletterContent(content);
  }

  // Log newsletter delivery
  logDelivery(result) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        subject: result.subject,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors
      };

      const logs = fs.readFileSync(this.deliveryLogFile, 'utf8');
      const logArray = logs ? JSON.parse(logs) : [];
      logArray.push(logEntry);
      fs.writeFileSync(this.deliveryLogFile, JSON.stringify(logArray, null, 2));

      return true;
    } catch (error) {
      console.error('Error logging newsletter delivery:', error);
      return false;
    }
  }

  // Get delivery logs
  getDeliveryLogs() {
    try {
      const logs = fs.readFileSync(this.deliveryLogFile, 'utf8');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error reading delivery logs:', error);
      return [];
    }
  }

  // Escape HTML for safe display in email templates
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Build newsletter email HTML
  buildNewsletterHTML(content, baseUrl) {
    const featuredGames = (content.featuredGames || []).map(g => `
      <div style="background: #1a1a1a; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #00ff88;">
        <h3 style="color: #00ff88; margin: 0 0 10px 0;">${this.escapeHtml(g.title)}</h3>
        ${g.description ? `<p style="color: #aaa; margin: 0;">${this.escapeHtml(g.description)}</p>` : ''}
        ${g.link ? `<a href="${this.escapeHtml(g.link)}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #00ff88; color: #0a0a0a; text-decoration: none; border-radius: 4px; font-weight: bold;">View Game</a>` : ''}
      </div>
    `).join('');

    const newAdditions = (content.newAdditions || []).map(g => `
      <div style="background: #1a1a1a; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #9d4edd;">
        <h3 style="color: #9d4edd; margin: 0 0 10px 0;">${this.escapeHtml(g.title)}</h3>
        ${g.platform ? `<p style="color: #aaa; margin: 0;">Platform: ${this.escapeHtml(g.platform)}</p>` : ''}
        ${g.link ? `<a href="${this.escapeHtml(g.link)}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #9d4edd; color: #0a0a0a; text-decoration: none; border-radius: 4px; font-weight: bold;">View Game</a>` : ''}
      </div>
    `).join('');

    const updatedEntries = (content.updatedEntries || []).map(g => `
      <div style="background: #1a1a1a; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ffaa00;">
        <h3 style="color: #ffaa00; margin: 0 0 10px 0;">${this.escapeHtml(g.title)}</h3>
        ${g.description ? `<p style="color: #aaa; margin: 0;">${this.escapeHtml(g.description)}</p>` : ''}
        ${g.link ? `<a href="${this.escapeHtml(g.link)}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #ffaa00; color: #0a0a0a; text-decoration: none; border-radius: 4px; font-weight: bold;">View Update</a>` : ''}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #eee;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <h1 style="color: #00ff88; margin: 0 0 10px 0; font-size: 28px;">Best Version Newsletter</h1>
        <p style="color: #aaa; margin: 0 0 30px 0; font-size: 14px;">Weekly game recommendations and updates</p>
      </td>
    </tr>

    ${featuredGames ? `
    <tr>
      <td style="padding: 20px;">
        <h2 style="color: #00ff88; margin: 0 0 15px 0; font-size: 20px;">Featured Games</h2>
        ${featuredGames}
      </td>
    </tr>
    ` : ''}

    ${newAdditions ? `
    <tr>
      <td style="padding: 20px;">
        <h2 style="color: #9d4edd; margin: 0 0 15px 0; font-size: 20px;">New Additions</h2>
        ${newAdditions}
      </td>
    </tr>
    ` : ''}

    ${updatedEntries ? `
    <tr>
      <td style="padding: 20px;">
        <h2 style="color: #ffaa00; margin: 0 0 15px 0; font-size: 20px;">Updated Entries</h2>
        ${updatedEntries}
      </td>
    </tr>
    ` : ''}

    <tr>
      <td style="padding: 40px 20px; border-top: 1px solid #333; margin-top: 30px;">
        <p style="color: #aaa; text-align: center; font-size: 14px; margin: 0 0 10px 0;">
          Thank you for subscribing to Best Version!
        </p>
        <p style="color: #666; text-align: center; font-size: 12px; margin: 0;">
          <a href="${this.escapeHtml(`${baseUrl}/newsletter/unsubscribe?token=UNSUBSCRIBE_TOKEN`)}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // Send newsletter
  async sendNewsletter(subject, content) {
    const activeSubscribers = this.getActiveSubscribers();

    if (activeSubscribers.length === 0) {
      return { success: true, sent: 0, message: 'No active subscribers' };
    }

    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    const htmlContent = this.buildNewsletterHTML(content, baseUrl);

    const results = {
      subject,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const subscriber of activeSubscribers) {
      try {
        const unsubUrl = this.getUnsubscribeUrl(subscriber.id);
        const finalHtml = htmlContent.replace('UNSUBSCRIBE_TOKEN', encodeURIComponent(unsubUrl));

        await this.emailService.sendEmail(
          subscriber.email,
          subject,
          finalHtml
        );
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    // Log delivery
    this.logDelivery(results);

    return results;
  }

  // Delete subscriptions by email (for data deletion requests)
  deleteByEmail(email) {
    const subscribers = this.getAllSubscribers();
    const filtered = subscribers.filter(s => s.email !== email.toLowerCase());

    if (filtered.length === subscribers.length) {
      return false; // Not found
    }

    this.saveSubscribers(filtered);
    return true;
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get subscription statistics
  getStatistics() {
    const subscribers = this.getAllSubscribers();
    const active = subscribers.filter(s => !s.unsubscribedAt);

    return {
      total: subscribers.length,
      active: active.length,
      unsubscribed: subscribers.length - active.length
    };
  }

  // Send newsletter to all active subscribers
  async sendNewsletter(subject, content) {
    const activeSubscribers = this.getActiveSubscribers();

    if (activeSubscribers.length === 0) {
      return { success: true, sent: 0, message: 'No active subscribers' };
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const subscriber of activeSubscribers) {
      try {
        await this.emailService.sendEmail(subscriber.email, subject, content);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get unsubscribe URL
  getUnsubscribeUrl(token) {
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    return `${baseUrl}/newsletter/unsubscribe?token=${token}`;
  }
}

module.exports = { NewsletterService };
