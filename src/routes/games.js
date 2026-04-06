// Game API routes

const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const { SubmissionService } = require('../services/submissionService');
const { AdminDashboardService } = require('../services/adminDashboardService');
const { BackupAdminService } = require('../services/backupAdminService');
const { adminAuth } = require('../middleware/adminAuth');
const { hCaptchaMiddleware } = require('../middleware/hCaptcha');
const path = require('path');
const { authRateLimiter } = require('../middleware/security');

router.use(cookieParser());

class GamesRoutes {
  constructor(gameAPI, submissionService, gameLoader, newsletterService, deletionRequestService, dmcaService, adminDashboard = null, backupAdminService = null) {
    this.gameAPI = gameAPI;
    this.submissionService = submissionService;
    this.gameLoader = gameLoader;
    this.adminDashboard = adminDashboard || new AdminDashboardService(submissionService, gameLoader);
    this.backupAdmin = backupAdminService || new BackupAdminService(
      path.join(__dirname, '../games'),
      path.join(__dirname, '../submissions'),
      path.join(__dirname, '../backups')
    );
    this.newsletterService = newsletterService;
    this.deletionRequestService = deletionRequestService;
    this.dmcaService = dmcaService;
  }

  setupRoutes() {
    // GET /api/games - Get all games
    router.get('/games', (req, res) => {
      try {
        const games = this.gameAPI.getAllGames();
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/games/stats - Get game statistics
    router.get('/games/stats', (req, res) => {
      try {
        const games = this.gameAPI.getAllGames();
        const platforms = this.gameAPI.getUniquePlatforms();

        // Calculate total curated versions from play_today entries
        let totalVersions = 0;
        games.forEach(game => {
          if (game.play_today && Array.isArray(game.play_today)) {
            totalVersions += game.play_today.length;
          }
        });

        res.json({
          success: true,
          data: {
            total_games: games.length,
            total_platforms: platforms.length,
            total_versions: totalVersions
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/games/:slug - Get single game by slug
    router.get('/games/:slug', (req, res) => {
      try {
        const game = this.gameAPI.getGameBySlug(req.params.slug);
        if (!game) {
          return res.status(404).json({ success: false, error: 'Game not found' });
        }
        res.json({ success: true, data: game });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/games/search?q=query - Search games by title
    router.get('/games/search', (req, res) => {
      try {
        const query = req.query.q;
        if (!query) {
          return res.status(400).json({ success: false, error: 'Search query parameter required' });
        }
        const games = this.gameAPI.searchByTitle(query);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/games/genre/:genre - Get games by genre
    router.get('/games/genre/:genre', (req, res) => {
      try {
        const games = this.gameAPI.getGamesByGenre(req.params.genre);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/theme/:theme - Get games by theme
    router.get('/games/theme/:theme', (req, res) => {
      try {
        const games = this.gameAPI.getGamesByTheme(req.params.theme);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/platform/:platform - Get games by platform
    router.get('/games/platform/:platform', (req, res) => {
      try {
        const games = this.gameAPI.getGamesByPlatform(req.params.platform);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/:slug/similar - Get similar games
    router.get('/games/:slug/similar', (req, res) => {
      try {
        const limit = parseInt(req.query.limit);
        if (isNaN(limit) || limit < 1 || limit > 20) {
          return res.status(400).json({ success: false, error: 'limit parameter must be a number between 1 and 20' });
        }
        const similarGames = this.gameAPI.getSimilarGames(req.params.slug, limit);
        res.json({ success: true, data: similarGames, count: similarGames.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/difficulty - Get games by difficulty range
    router.get('/games/difficulty', (req, res) => {
      try {
        const min = parseInt(req.query.min);
        const max = parseInt(req.query.max);
        if (isNaN(min) || isNaN(max)) {
          return res.status(400).json({ success: false, error: 'min and max parameters must be valid numbers' });
        }
        const games = this.gameAPI.getGamesByDifficulty(min, max);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/reception - Get games by reception score range
    router.get('/games/reception', (req, res) => {
      try {
        const min = parseFloat(req.query.min);
        const max = parseFloat(req.query.max);
        if (isNaN(min) || isNaN(max)) {
          return res.status(400).json({ success: false, error: 'min and max parameters must be valid numbers' });
        }
        const games = this.gameAPI.getGamesByReceptionScore(min, max);
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /games/filters - Get available filters
    router.get('/games/filters', (req, res) => {
      try {
        const filters = {
          genres: this.gameAPI.getUniqueGenres(),
          themes: this.gameAPI.getUniqueThemes(),
          platforms: this.gameAPI.getUniquePlatforms()
        };
        res.json({ success: true, data: filters });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/submissions - Create a new game submission
    router.post('/submissions', hCaptchaMiddleware, async (req, res) => {
      try {
        const { title, alternativeNames, platforms, recommendations, notes, email } = req.body;

        // Validate required fields
        if (!title || !title.trim()) {
          return res.status(400).json({ success: false, error: 'Game title is required' });
        }

        // Platforms and recommendations are optional
        const validPlatforms = platforms && Array.isArray(platforms) ? platforms : undefined;
        const validRecommendations = recommendations && Array.isArray(recommendations) ? recommendations : undefined;

        // Create submission
        const submission = this.submissionService.createSubmission({
          title: title.trim(),
          alternativeNames: Array.isArray(alternativeNames) ? alternativeNames : [],
          platforms: validPlatforms,
          recommendations: validRecommendations.map(r => ({
            emulator: r.emulator.trim(),
            version: r.version ? r.version.trim() : null,
            configLink: r.configLink ? r.configLink.trim() : null
          })),
          notes: notes ? notes.trim() : null,
          email: email ? email.trim() : null
        });

        res.status(201).json({ success: true, data: submission, message: 'Submission received' });
      } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/submissions/pending - Get pending submissions (admin only)
    router.get('/submissions/pending', adminAuth.requireAdmin, (req, res) => {
      try {
        const pending = this.submissionService.getPendingSubmissions();
        res.json({ success: true, data: pending, count: pending.length });
      } catch (error) {
        console.error('Error getting pending submissions:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/submissions/approved - Get approved submissions (admin only)
    router.get('/submissions/approved', adminAuth.requireAdmin, (req, res) => {
      try {
        const approved = this.submissionService.getApprovedSubmissions();
        res.json({ success: true, data: approved, count: approved.length });
      } catch (error) {
        console.error('Error getting approved submissions:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/submissions/:id/approve - Approve a submission (admin only)
    router.post('/submissions/:id/approve', adminAuth.requireAdmin, (req, res) => {
      try {
        const { id } = req.params;
        const { reviewedBy } = req.body;

        const updated = this.submissionService.updateSubmissionStatus(id, 'approved', { reviewedBy });

        if (!updated) {
          return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        res.json({ success: true, data: updated, message: 'Submission approved' });
      } catch (error) {
        console.error('Error approving submission:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/submissions/:id/reject - Reject a submission (admin only)
    router.post('/submissions/:id/reject', adminAuth.requireAdmin, (req, res) => {
      try {
        const { id } = req.params;
        const { rejectionReason, reviewedBy } = req.body;

        if (!rejectionReason || !rejectionReason.trim()) {
          return res.status(400).json({ success: false, error: 'Rejection reason is required' });
        }

        const updated = this.submissionService.updateSubmissionStatus(id, 'rejected', {
          rejectionReason: rejectionReason.trim(),
          reviewedBy
        });

        if (!updated) {
          return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        res.json({ success: true, data: updated, message: 'Submission rejected' });
      } catch (error) {
        console.error('Error rejecting submission:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== ADMIN DASHBOARD ROUTES ====================

    // GET /api/admin/dashboard/stats - Get dashboard statistics (admin only)
    router.get('/admin/dashboard/stats', adminAuth.requireAdmin, (req, res) => {
      try {
        const stats = this.adminDashboard.getDashboardStatistics();
        res.json({ success: true, data: stats });
      } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dashboard/pending - Get pending submissions with optional date filter (admin only)
    router.get('/admin/dashboard/pending', adminAuth.requireAdmin, (req, res) => {
      try {
        const dateRange = {
          startDate: req.query.startDate,
          endDate: req.query.endDate
        };
        const pending = this.adminDashboard.getPendingSubmissions(dateRange);
        res.json({ success: true, data: pending, count: pending.length });
      } catch (error) {
        console.error('Error getting pending submissions:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dashboard/approved - Get approved submissions (admin only)
    router.get('/admin/dashboard/approved', adminAuth.requireAdmin, (req, res) => {
      try {
        const approved = this.adminDashboard.getApprovedSubmissions();
        res.json({ success: true, data: approved, count: approved.length });
      } catch (error) {
        console.error('Error getting approved submissions:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dashboard/rejected - Get rejected submissions (admin only)
    router.get('/admin/dashboard/rejected', adminAuth.requireAdmin, (req, res) => {
      try {
        const rejected = this.adminDashboard.getRejectedSubmissions();
        res.json({ success: true, data: rejected, count: rejected.length });
      } catch (error) {
        console.error('Error getting rejected submissions:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/submissions/:id - Get single submission details (admin only)
    router.get('/admin/submissions/:id', adminAuth.requireAdmin, (req, res) => {
      try {
        const submission = this.adminDashboard.getSubmissionById(req.params.id);
        if (!submission) {
          return res.status(404).json({ success: false, error: 'Submission not found' });
        }
        res.json({ success: true, data: submission });
      } catch (error) {
        console.error('Error getting submission:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/submissions/:id/delete - Delete a submission (admin only)
    router.post('/admin/submissions/:id/delete', adminAuth.requireAdmin, (req, res) => {
      try {
        const { id } = req.params;
        const deleted = this.adminDashboard.deleteSubmission(id);

        if (!deleted) {
          return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        res.json({ success: true, message: 'Submission deleted' });
      } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/login - Request verification token (email verification)
    router.post('/admin/login', (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ success: false, error: 'Email address required' });
        }

        const tokenData = adminAuth.generateVerificationToken(email);

        if (!tokenData) {
          return res.status(403).json({ success: false, error: 'Access denied. Admin email required.' });
        }

        const verificationUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/admin?token=${tokenData.token}`;

        res.json({
          success: true,
          message: 'Verification link generated',
          verificationUrl,
          email: adminAuth.ADMIN_EMAIL,
          expiresIn: '15 minutes'
        });
      } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/logout - Logout and clear session
    router.post('/admin/logout', adminAuth.logout);

    // POST /api/admin/login/verify - Verify token and create session
    router.post('/admin/login/verify', authRateLimiter, (req, res) => {
      try {
        const { token } = req.body;

        if (!token) {
          return res.status(400).json({
            success: false,
            error: 'Verification token required',
            code: 'TOKEN_REQUIRED'
          });
        }

        const session = adminAuth.verifyToken(token);

        if (!session) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or expired verification token',
            code: 'TOKEN_INVALID'
          });
        }

        // Set session cookie
        res.cookie('admin_session', session.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });

        res.json({
          success: true,
          message: 'Login successful',
          user: {
            email: session.email
          }
        });
      } catch (error) {
        console.error('Admin login verify error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication service error',
          code: 'AUTH_ERROR'
        });
      }
    });

    // ==================== GAME MANAGEMENT ROUTES ====================

    // GET /api/admin/games - Get all games (admin only)
    router.get('/admin/games', adminAuth.requireAdmin, (req, res) => {
      try {
        const games = this.adminDashboard.getAllGames();
        res.json({ success: true, data: games, count: games.length });
      } catch (error) {
        console.error('Error getting games:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/games/:slug - Get single game (admin only)
    router.get('/admin/games/:slug', adminAuth.requireAdmin, (req, res) => {
      try {
        const game = this.adminDashboard.getGame(req.params.slug);
        if (!game) {
          return res.status(404).json({ success: false, error: 'Game not found' });
        }
        res.json({ success: true, data: game });
      } catch (error) {
        console.error('Error getting game:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // PUT /api/admin/games/:slug - Update game metadata (admin only)
    router.put('/admin/games/:slug', adminAuth.requireAdmin, (req, res) => {
      try {
        const slug = req.params.slug;
        const gameData = req.body;

        if (!gameData.basic_info || !gameData.basic_info.url_slug) {
          return res.status(400).json({ success: false, error: 'Game data must include url_slug' });
        }

        const success = this.adminDashboard.updateGame(gameData);

        if (!success) {
          return res.status(500).json({ success: false, error: 'Failed to update game' });
        }

        res.json({ success: true, message: 'Game updated' });
      } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // DELETE /api/admin/games/:slug - Delete game (admin only)
    router.delete('/admin/games/:slug', adminAuth.requireAdmin, (req, res) => {
      try {
        const slug = req.params.slug;
        const success = this.adminDashboard.deleteGame(slug);

        if (!success) {
          return res.status(404).json({ success: false, error: 'Game not found' });
        }

        res.json({ success: true, message: 'Game deleted' });
      } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/games/:slug/history - Get submission history for game (admin only)
    router.get('/admin/games/:slug/history', adminAuth.requireAdmin, (req, res) => {
      try {
        const history = this.adminDashboard.getGameSubmissionHistory(req.params.slug);
        res.json({ success: true, data: history, count: history.length });
      } catch (error) {
        console.error('Error getting game history:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== NEWSLETTER ROUTES ====================

    // POST /api/newsletter/subscribe - Subscribe to newsletter
    router.post('/newsletter/subscribe', hCaptchaMiddleware, async (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ success: false, error: 'Email address required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const result = this.newsletterService.subscribe(email, ip);

        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        res.status(201).json({ success: true, data: result.data, message: 'Successfully subscribed to newsletter' });
      } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /newsletter/unsubscribe - Unsubscribe page
    router.get('/newsletter/unsubscribe', (req, res) => {
      try {
        const { token } = req.query;

        if (!token) {
          return res.status(400).json({ success: false, error: 'Subscription token required' });
        }

        const result = this.newsletterService.unsubscribe(token);

        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        // Redirect to homepage with success message
        const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
        res.redirect(`${baseUrl}/?unsubscribed=true`);
      } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/newsletter/stats - Get newsletter statistics (admin only)
    router.get('/api/newsletter/stats', adminAuth.requireAdmin, (req, res) => {
      try {
        const stats = this.newsletterService.getStatistics();
        res.json({ success: true, data: stats });
      } catch (error) {
        console.error('Newsletter stats error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/newsletter/subscribers - Get all subscribers (admin only)
    router.get('/api/newsletter/subscribers', adminAuth.requireAdmin, (req, res) => {
      try {
        const subscribers = this.newsletterService.getAllSubscribers();
        const active = this.newsletterService.getActiveSubscribers();
        res.json({ success: true, data: subscribers, activeCount: active.length, totalCount: subscribers.length });
      } catch (error) {
        console.error('Newsletter subscribers error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/newsletter/content - Get newsletter content (admin only)
    router.get('/api/newsletter/content', adminAuth.requireAdmin, (req, res) => {
      try {
        const content = this.newsletterService.getNewsletterContent();
        res.json({ success: true, data: content });
      } catch (error) {
        console.error('Newsletter content error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // PUT /api/newsletter/content - Update newsletter content (admin only)
    router.put('/api/newsletter/content', adminAuth.requireAdmin, (req, res) => {
      try {
        const content = req.body;

        if (!content.featuredGames || !content.newAdditions || !content.updatedEntries) {
          return res.status(400).json({ success: false, error: 'Missing required content fields' });
        }

        const success = this.newsletterService.updateNewsletterContent(content);

        if (!success) {
          return res.status(500).json({ success: false, error: 'Failed to save newsletter content' });
        }

        res.json({ success: true, message: 'Newsletter content updated' });
      } catch (error) {
        console.error('Newsletter content update error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/newsletter/send - Send newsletter to subscribers (admin only)
    router.post('/api/newsletter/send', adminAuth.requireAdmin, (req, res) => {
      try {
        const { subject } = req.body;

        if (!subject) {
          return res.status(400).json({ success: false, error: 'Subject line required' });
        }

        const content = this.newsletterService.getNewsletterContent();
        const result = this.newsletterService.sendNewsletter(subject, content);

        res.json({
          success: true,
          message: 'Newsletter sent successfully',
          ...result
        });
      } catch (error) {
        console.error('Newsletter send error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/newsletter/delivery-logs - Get newsletter delivery logs (admin only)
    router.get('/api/newsletter/delivery-logs', adminAuth.requireAdmin, (req, res) => {
      try {
        const logs = this.newsletterService.getDeliveryLogs();
        res.json({ success: true, data: logs, count: logs.length });
      } catch (error) {
        console.error('Newsletter delivery logs error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== DELETION REQUEST ROUTES ====================

    // POST /api/deletion-request - Create a deletion request (user-facing)
    router.post('/deletion-request', (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ success: false, error: 'Email address required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        const request = this.deletionRequestService.createRequest(email, 'pending');

        res.status(201).json({
          success: true,
          data: request,
          message: 'Deletion request created. You will receive a confirmation email once processed.'
        });
      } catch (error) {
        console.error('Deletion request error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/deletion-request/:email - Get deletion request status (admin only)
    router.get('/api/admin/deletion-requests', adminAuth.requireAdmin, (req, res) => {
      try {
        const requests = this.deletionRequestService.getAllRequests();
        const stats = this.deletionRequestService.getStatistics();
        res.json({ success: true, data: requests, stats });
      } catch (error) {
        console.error('Deletion requests error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/deletion-requests/:email/process - Process a deletion request (admin only)
    router.post('/api/admin/deletion-requests/:email/process', adminAuth.requireAdmin, (req, res) => {
      try {
        const { email } = req.params;
        const result = this.deletionRequestService.processDeletion(email);

        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        res.json({ success: true, message: 'Deletion request processed', results: result.results });
      } catch (error) {
        console.error('Deletion processing error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== INAPPROPRIATE LANGUAGE FILTER ROUTES ====================

    // GET /api/admin/language-filters - Get current filter list (admin only)
    router.get('/api/admin/language-filters', adminAuth.requireAdmin, (req, res) => {
      try {
        // Access the language filter service via submission service
        const words = this.submissionService.languageFilter.getAllWords();
        res.json({ success: true, data: { words }, count: words.length });
      } catch (error) {
        console.error('Language filters error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/language-filters/add - Add word to filter list (admin only)
    router.post('/api/admin/language-filters/add', adminAuth.requireAdmin, (req, res) => {
      try {
        const { word } = req.body;

        if (!word || !word.trim()) {
          return res.status(400).json({ success: false, error: 'Word is required' });
        }

        const success = this.submissionService.languageFilter.addWord(word.trim().toLowerCase());

        if (success) {
          res.json({ success: true, message: `Word "${word}" added to filter list` });
        } else {
          res.json({ success: true, message: `Word "${word}" already in filter list` });
        }
      } catch (error) {
        console.error('Add language filter error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // DELETE /api/admin/language-filters/remove/:word - Remove word from filter list (admin only)
    router.delete('/api/admin/language-filters/remove/:word', adminAuth.requireAdmin, (req, res) => {
      try {
        const word = decodeURIComponent(req.params.word);
        const success = this.submissionService.languageFilter.removeWord(word.toLowerCase());

        if (success) {
          res.json({ success: true, message: `Word "${word}" removed from filter list` });
        } else {
          res.status(404).json({ success: false, error: `Word "${word}" not found in filter list` });
        }
      } catch (error) {
        console.error('Remove language filter error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/submissions/flagged - Get submissions flagged for inappropriate language (admin only)
    router.get('/api/admin/submissions/flagged', adminAuth.requireAdmin, (req, res) => {
      try {
        const flagged = this.submissionService.getFlaggedSubmissions();
        res.json({ success: true, data: flagged, count: flagged.length });
      } catch (error) {
        console.error('Flagged submissions error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/submissions/:id/clear-language-flag - Clear language filter flag (admin only)
    router.post('/api/admin/submissions/:id/clear-language-flag', adminAuth.requireAdmin, (req, res) => {
      try {
        const { id } = req.params;
        const success = this.submissionService.clearLanguageFilterFlag(id);

        if (success) {
          res.json({ success: true, message: 'Language filter flag cleared' });
        } else {
          res.status(404).json({ success: false, error: 'Submission not found' });
        }
      } catch (error) {
        console.error('Clear language flag error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== DMCA TAKEDOWN ROUTES ====================

    // POST /api/dmca-request - Create a DMCA takedown request (user-facing)
    router.post('/dmca-request', (req, res) => {
      try {
        const {
          complainantName,
          complainantEmail,
          complainantPhone,
          complainantAddress,
          copyrightWork,
          infringingUrl,
          infringingTitle,
          goodFaithBelief,
          accuracyStatement,
          underPenaltyPerjury,
          signature
        } = req.body;

        // Validate required fields
        if (!complainantName || !complainantEmail || !infringingTitle) {
          return res.status(400).json({
            success: false,
            error: 'Name, email, and infringing content title are required'
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(complainantEmail)) {
          return res.status(400).json({ success: false, error: 'Invalid email format' });
        }

        // Validate copyright work is specified
        if (!copyrightWork || !copyrightWork.trim()) {
          return res.status(400).json({ success: false, error: 'Description of copyrighted work is required' });
        }

        // Validate DMCA requirements
        if (goodFaithBelief !== true || accuracyStatement !== true || underPenaltyPerjury !== true) {
          return res.status(400).json({
            success: false,
            error: 'All DMCA statements (good faith belief, accuracy, penalty of perjury) must be confirmed'
          });
        }

        // Create DMCA request
        const request = this.dmcaService.createRequest({
          complainantName: complainantName.trim(),
          complainantEmail: complainantEmail.toLowerCase(),
          complainantPhone: complainantPhone ? complainantPhone.trim() : null,
          complainantAddress: complainantAddress ? complainantAddress.trim() : null,
          copyrightWork: copyrightWork.trim(),
          infringingUrl: infringingUrl ? infringingUrl.trim() : null,
          infringingTitle: infringingTitle.trim(),
          goodFaithBelief,
          accuracyStatement,
          underPenaltyPerjury,
          signature: signature ? signature.trim() : null
        });

        // Send acknowledgment email
        this.dmcaService.sendAcknowledgmentEmail(request.id);

        res.status(201).json({
          success: true,
          data: request,
          message: 'DMCA takedown request received. A confirmation email has been sent to you.',
          requestId: request.id
        });
      } catch (error) {
        console.error('DMCA request error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dmca-requests - Get all DMCA requests (admin only)
    router.get('/api/admin/dmca-requests', adminAuth.requireAdmin, (req, res) => {
      try {
        const requests = this.dmcaService.getAllRequests();
        const stats = this.dmcaService.getStatistics();
        res.json({ success: true, data: requests, stats });
      } catch (error) {
        console.error('DMCA requests error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dmca-requests/repeat-offenders - Get repeat offenders list (admin only)
    router.get('/api/admin/dmca-requests/repeat-offenders', adminAuth.requireAdmin, (req, res) => {
      try {
        const offenders = this.dmcaService.getRepeatOffenders();
        res.json({ success: true, data: offenders, count: offenders.length });
      } catch (error) {
        console.error('Repeat offenders error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/dmca-requests/:id - Get DMCA request details (admin only)
    router.get('/api/admin/dmca-requests/:id', adminAuth.requireAdmin, (req, res) => {
      try {
        const request = this.dmcaService.getRequestById(req.params.id);
        if (!request) {
          return res.status(404).json({ success: false, error: 'DMCA request not found' });
        }
        res.json({ success: true, data: request });
      } catch (error) {
        console.error('DMCA request error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/dmca-requests/:id/process - Process a DMCA request (admin only)
    router.post('/api/admin/dmca-requests/:id/process', adminAuth.requireAdmin, (req, res) => {
      try {
        const { id } = req.params;
        const adminEmail = req.headers['x-admin-email'] || 'admin';

        const result = this.dmcaService.processRequest(id, adminEmail);

        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        res.json({
          success: true,
          message: 'DMCA request processed',
          results: result.results
        });
      } catch (error) {
        console.error('DMCA processing error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ==================== BACKUP ROUTES ====================

    // GET /api/admin/backups - List all backups (admin only)
    router.get('/admin/backups', adminAuth.requireAdmin, (req, res) => {
      try {
        const result = this.backupAdmin.listBackups();
        res.json(result);
      } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/backups/stats - Get backup statistics (admin only)
    router.get('/admin/backups/stats', adminAuth.requireAdmin, (req, res) => {
      try {
        const result = this.backupAdmin.getStatistics();
        res.json(result);
      } catch (error) {
        console.error('Error getting backup stats:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // GET /api/admin/backups/:id - Get specific backup details (admin only)
    router.get('/admin/backups/:id', adminAuth.requireAdmin, (req, res) => {
      try {
        const result = this.backupAdmin.getBackup(req.params.id);
        if (!result.success) {
          return res.status(404).json(result);
        }
        res.json(result);
      } catch (error) {
        console.error('Error getting backup:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/backups - Create new backup (admin only)
    router.post('/admin/backups', adminAuth.requireAdmin, async (req, res) => {
      try {
        const { name } = req.body;
        const result = await this.backupAdmin.createBackup(name);

        if (result.success) {
          res.status(201).json(result);
        } else {
          res.status(500).json(result);
        }
      } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/backups/:id/restore - Restore from backup (admin only)
    router.post('/admin/backups/:id/restore', adminAuth.requireAdmin, async (req, res) => {
      try {
        const result = await this.backupAdmin.restoreBackup(req.params.id);

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // DELETE /api/admin/backups/:id - Delete backup (admin only)
    router.delete('/admin/backups/:id', adminAuth.requireAdmin, async (req, res) => {
      try {
        const result = await this.backupAdmin.deleteBackup(req.params.id);

        if (result.success) {
          res.json(result);
        } else {
          res.status(404).json(result);
        }
      } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // POST /api/admin/backups/cleanup - Remove old backups (admin only)
    router.post('/admin/backups/cleanup', adminAuth.requireAdmin, async (req, res) => {
      try {
        const result = await this.backupAdmin.cleanupOldBackups();
        res.json(result);
      } catch (error) {
        console.error('Error cleaning up backups:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    return router;
  }
}

module.exports = { GamesRoutes };
