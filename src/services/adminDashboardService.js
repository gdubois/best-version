// Admin dashboard service for managing submissions

class AdminDashboardService {
  constructor(submissionService, gameLoader, gameStorage, submissionStorage) {
    this.submissionService = submissionService;
    this.gameLoader = gameLoader;
    this.gameStorage = gameStorage;
    this.submissionStorage = submissionStorage;
  }

  // Get all pending submissions with optional date filtering
  getPendingSubmissions(dateRange = {}) {
    const submissions = this.submissionService.getAllSubmissions();
    const pending = submissions.filter(s => s.status === 'pending');

    // Filter by date range if provided
    if (dateRange.startDate || dateRange.endDate) {
      const start = dateRange.startDate ? new Date(dateRange.startDate).setHours(0, 0, 0, 0) : null;
      const end = dateRange.endDate ? new Date(dateRange.endDate).setHours(23, 59, 59, 999) : null;

      return pending.filter(submission => {
        const submittedAt = new Date(submission.submittedAt).getTime();
        if (start && end) {
          return submittedAt >= start && submittedAt <= end;
        } else if (start) {
          return submittedAt >= start;
        } else if (end) {
          return submittedAt <= end;
        }
        return true;
      });
    }

    // Sort by newest first
    return pending.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  // Get submission statistics for dashboard
  getDashboardStatistics() {
    const stats = this.submissionService.getStatistics();
    return {
      ...stats,
      pendingCount: stats.pending,
      approvedCount: stats.approved,
      rejectedCount: stats.rejected
    };
  }

  // Get submission by ID
  getSubmissionById(id) {
    return this.submissionService.getSubmissionById(id);
  }

  // Get approved games/submissions
  getApprovedSubmissions() {
    return this.submissionService.getApprovedSubmissions().sort((a, b) =>
      new Date(b.approvedAt || b.submittedAt) - new Date(a.approvedAt || a.submittedAt)
    );
  }

  // Get rejected submissions
  getRejectedSubmissions() {
    return this.submissionService.getRejectedSubmissions().sort((a, b) =>
      new Date(b.reviewedAt || b.submittedAt) - new Date(a.reviewedAt || a.submittedAt)
    );
  }

  // Get rejection reason for a submission
  getRejectionReason(id) {
    const submission = this.getSubmissionById(id);
    return submission?.rejectionReason || null;
  }

  // Approve a submission
  async approveSubmission(id, reviewBy) {
    return this.submissionService.updateSubmissionStatus(id, 'approved', { reviewedBy: reviewBy });
  }

  // Reject a submission
  async rejectSubmission(id, rejectionReason, reviewedBy) {
    return this.submissionService.updateSubmissionStatus(id, 'rejected', {
      rejectionReason,
      reviewedBy
    });
  }

  // Delete a submission (for rejected submissions cleanup)
  deleteSubmission(id) {
    return this.submissionService.deleteSubmission(id);
  }

  // Archive a rejected submission
  archiveSubmission(id) {
    return this.submissionService.archiveSubmission(id);
  }

  // Get all games
  getAllGames() {
    return this.gameLoader.getAllGamesArray();
  }

  // Get game by slug
  getGame(slug) {
    return this.gameLoader.getGameBySlug(slug);
  }

  // Update game metadata
  updateGame(gameData) {
    if (!gameData.basic_info?.url_slug) {
      return null;
    }
    // Use storage service for atomic writes
    return this.gameStorage.updateGame(gameData.basic_info.url_slug, gameData) !== null;
  }

  // Delete game
  deleteGame(slug) {
    return this.gameStorage.deleteGame(slug);
  }

  // Get game submission history
  getGameSubmissionHistory(gameSlug) {
    const submissions = this.submissionService.getAllSubmissions();
    return submissions.filter(s => {
      const gameSlugLower = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return gameSlugLower === gameSlug || (s.alternativeNames || []).some(alt => alt.toLowerCase().includes(gameSlug));
    }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }
}

module.exports = { AdminDashboardService };
