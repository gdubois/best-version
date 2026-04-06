// Submission service for handling game submissions

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { EmailService } = require('./emailService');
const { InappropriateLanguageFilter } = require('./inappropriateLanguageFilter');

class SubmissionService {
  constructor(submissionStorage, emailService, gamesStorage) {
    this.submissionStorage = submissionStorage;
    this.emailService = emailService || new EmailService();
    this.gamesStorage = gamesStorage;

    // Initialize language filter
    this.languageFilter = new InappropriateLanguageFilter(path.join(__dirname, '../.language_filters.json'));
  }

  // Get all submissions
  getAllSubmissions() {
    return this.submissionStorage.getAllSubmissions();
  }

  // Get submissions flagged for inappropriate language
  getFlaggedSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.languageFilterResult?.flagged || s.status === 'flagged_for_review');
  }

  // Get submission by ID
  getSubmissionById(id) {
    const submissions = this.getAllSubmissions();
    return submissions.find(s => s.id === id) || null;
  }

  // Create a new submission
  createSubmission(submissionData) {
    const submissions = this.getAllSubmissions();

    // Check for inappropriate language
    const filterResult = this.languageFilter.filterSubmission(submissionData);

    // Flag submissions with inappropriate language for admin review
    let status = 'pending';
    if (filterResult.flagged) {
      status = 'flagged_for_review';
    }

    const newSubmission = {
      id: uuidv4(),
      ...submissionData,
      status: status,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      approvedAt: null,
      // Add language filter metadata
      languageFilterResult: filterResult.flagged ? {
        flagged: true,
        flaggedFields: filterResult.flaggedFields,
        detectedWords: filterResult.reasons,
        flaggedAt: new Date().toISOString()
      } : null
    };

    submissions.push(newSubmission);
    this.saveSubmissions(submissions);

    return newSubmission;
  }

  // Update submission status and send notifications
  async updateSubmissionStatus(id, status, reviewData = {}) {
    const submissions = this.getAllSubmissions();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      return null;
    }

    const submission = submissions[index];
    const oldStatus = submission.status;
    submission.status = status;
    submission.reviewedAt = new Date().toISOString();
    submission.reviewedBy = reviewData.reviewedBy || null;

    if (status === 'approved') {
      submission.approvedAt = new Date().toISOString();
      // Publish submission to games database
      await this.publishSubmissionToGames(submission);
      // Send approval email if submitter provided email
      if (submission.email) {
        let gameSlug = this.extractGameSlug(submission);
        await this.emailService.sendApprovalEmail(submission.email, submission.title, gameSlug);
      }
    } else if (status === 'rejected' && oldStatus === 'pending') {
      submission.rejectionReason = reviewData.rejectionReason || null;
      // Send rejection email if submitter provided email
      if (submission.email && submission.rejectionReason) {
        await this.emailService.sendRejectionEmail(submission.email, submission.title, submission.rejectionReason);
      }
    }

    this.saveSubmissions(submissions);
    return submissions[index];
  }

  // Save submissions to file
  saveSubmissions(submissions) {
    try {
      this.submissionStorage.fileWriter.writeAtomic('index.json', submissions);
      return true;
    } catch (error) {
      console.error('Error saving submissions:', error);
      return false;
    }
  }

  // Get pending submissions
  getPendingSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'pending');
  }

  // Get approved submissions
  getApprovedSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'approved');
  }

  // Get rejected submissions
  getRejectedSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'rejected');
  }

  // Delete submission by ID (for rejected submissions cleanup)
  deleteSubmission(id) {
    return this.submissionStorage.deleteSubmission(id);
  }

  // Archive rejected submission (moves to rejected archive instead of deleting)
  archiveSubmission(id) {
    const submissions = this.getAllSubmissions();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      return null;
    }

    const submission = submissions[index];
    submission.archivedAt = new Date().toISOString();

    // Remove from active submissions
    submissions.splice(index, 1);
    this.saveSubmissions(submissions);

    // Save to archive
    this.archiveSubmissionData(submission);
    return submission;
  }

  // Get submission by ID (delegated to storage)
  getSubmissionById(id) {
    return this.submissionStorage.getSubmissionById(id);
  }

  // Clear language filter flag (admin action after review)
  clearLanguageFilterFlag(id) {
    const submissions = this.getAllSubmissions();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      return false;
    }

    submissions[index].languageFilterResult = null;
    this.saveSubmissions(submissions);
    return true;
  }

  // Archive submission data separately
  archiveSubmissionData(submission) {
    try {
      const archiveDir = path.join(this.submissionsDir, 'archive');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const archiveFile = path.join(archiveDir, `${submission.id}.json`);
      fs.writeFileSync(archiveFile, JSON.stringify(submission, null, 2));
      return true;
    } catch (error) {
      console.error('Error archiving submission:', error);
      return false;
    }
  }

  // Get submission statistics
  getStatistics() {
    const submissions = this.getAllSubmissions();
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      flaggedForReview: submissions.filter(s => s.status === 'flagged_for_review').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    };
  }

  // Extract game slug from submission title
  extractGameSlug(submission) {
    // Convert title to slug format (lowercase, spaces to hyphens, remove special chars)
    return submission.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown';
  }

  // Publish an approved submission to the games database
  async publishSubmissionToGames(submission) {
    try {
      const gameSlug = this.extractGameSlug(submission);

      // Convert submission to full game format
      const gameData = {
        basic_info: {
          title: submission.title,
          alternative_names: submission.alternativeNames || [],
          genres: [],
          themes: [],
          difficulty_rating: 3,
          reception_score: 0,
          platforms: submission.platforms || [],
          url_slug: gameSlug,
          cover_art_url: null,
          release_info: {}
        },
        recommendations: submission.recommendations || [],
        resources: [],
        notes: submission.notes || ''
      };

      // Use storage service to write game atomically
      const savedGame = this.gamesStorage.createGame(gameData);

      if (!savedGame) {
        console.error('Failed to save game via storage service');
        return false;
      }

      console.log(`Published game: ${submission.title} (${gameSlug})`);
      return true;
    } catch (error) {
      console.error('Error publishing submission to games:', error);
      return false;
    }
  }
}

module.exports = { SubmissionService };
