// Service for handling data deletion requests (GDPR "right to be forgotten")

const fs = require('fs');
const path = require('path');

class DeletionRequestService {
  constructor(submissionsDir, submissionsService, newsletterService, gamesDir, options = {}) {
    this.deletionsFile = options.deletionsFile || path.join(__dirname, '../.deletion_requests.json');
    this.submissionsDir = submissionsDir;
    this.submissionsService = submissionsService;
    this.newsletterService = newsletterService;
    this.gamesDir = gamesDir;

    // Ensure deletions file exists
    if (!fs.existsSync(this.deletionsFile)) {
      fs.writeFileSync(this.deletionsFile, JSON.stringify([], null, 2));
    }
  }

  // Get all deletion requests
  getAllRequests() {
    try {
      const data = fs.readFileSync(this.deletionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading deletion requests:', error);
      return [];
    }
  }

  // Save deletion requests
  saveRequests(requests) {
    try {
      fs.writeFileSync(this.deletionsFile, JSON.stringify(requests, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving deletion requests:', error);
      return false;
    }
  }

  // Create a new deletion request
  createRequest(email, status = 'pending') {
    const requests = this.getAllRequests();

    // Check if request already exists
    const existingIndex = requests.findIndex(r => r.email.toLowerCase() === email.toLowerCase());

    if (existingIndex !== -1) {
      // Update existing request
      const request = requests[existingIndex];
      request.status = status;
      request.email = email.toLowerCase().trim(); // Normalize email
      request.updatedAt = new Date().toISOString();
      if (status === 'pending') {
        request.processedBy = null;
        request.processedAt = null;
      }
      requests[existingIndex] = request;
    } else {
      // Create new request
      const newRequest = {
        id: this.generateId(),
        email: email.toLowerCase().trim(),
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: null,
        processedBy: null,
        notes: ''
      };
      requests.push(newRequest);
    }

    this.saveRequests(requests);
    return requests.find(r => r.email === email.toLowerCase().trim());
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Update request status and processing info
  updateRequest(email, updates) {
    const requests = this.getAllRequests();
    const index = requests.findIndex(r => r.email.toLowerCase() === email.toLowerCase());

    if (index === -1) {
      return null;
    }

    const request = requests[index];
    Object.assign(request, updates);
    request.updatedAt = new Date().toISOString();

    this.saveRequests(requests);
    return request;
  }

  // Process deletion request - remove all user data
  processDeletion(email) {
    const request = this.updateRequest(email, {
      status: 'processing',
      processedBy: 'system',
      processedAt: new Date().toISOString()
    });

    if (!request) {
      return { success: false, error: 'Deletion request not found' };
    }

    const results = {
      newsletter: false,
      submissions: 0,
      games: 0,
      errors: []
    };

    try {
      // 1. Unsubscribe from newsletter
      const unsubscribed = this.newsletterService.deleteByEmail(email);
      results.newsletter = unsubscribed;

      // 2. Get all submissions by this user
      const submissions = this.submissionsService.getAllSubmissions();
      const userSubmissions = submissions.filter(s => s.email === email);

      // 3. Delete submissions by filtering out user's submissions
      const filteredSubmissions = submissions.filter(s => s.email !== email);
      this.submissionsService.saveSubmissions(filteredSubmissions);
      results.submissions = userSubmissions.length;

      // 4. Delete games by submission ID reference (not title to prevent collisions)
      const userSubmissionIds = new Set(userSubmissions.map(s => s.id));
      const gamesDirPath = path.join(this.gamesDir);
      const files = fs.readdirSync(gamesDirPath);
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'index.json') {
          // Validate file path to prevent traversal
          const fullPath = path.join(gamesDirPath, file);
          const resolvedPath = path.resolve(fullPath);
          const resolvedGamesDir = path.resolve(this.gamesDir);

          if (!resolvedPath.startsWith(resolvedGamesDir)) {
            results.errors.push({ file, error: 'Invalid file path' });
            continue;
          }

          const gameData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          // Match by submission_id instead of title to prevent accidental deletion
          if (gameData.submission_id && userSubmissionIds.has(gameData.submission_id)) {
            fs.unlinkSync(fullPath);
            results.games++;
          }
        }
      }

      // 6. Mark as completed
      this.updateRequest(email, {
        status: 'completed',
        results: results
      });

      return { success: true, results };
    } catch (error) {
      console.error('Error processing deletion:', error);
      this.updateRequest(email, {
        status: 'error',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  // Get request by email
  getRequestByEmail(email) {
    const requests = this.getAllRequests();
    return requests.find(r => r.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // Get statistics
  getStatistics() {
    const requests = this.getAllRequests();
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed').length,
      error: requests.filter(r => r.status === 'error').length
    };
  }
}

module.exports = { DeletionRequestService };
