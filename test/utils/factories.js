// Test factories - reusable mock objects and helpers for test files
// These factories follow the patterns established in deletionRequestService.test.js
// and adminDashboardService.test.js

/**
 * Create a mock GameAPI instance
 * @returns {Object} Mock game API with all required methods
 */
function createMockGameAPI() {
  return {
    getAllGames: () => [],
    getGameBySlug: () => null,
    searchByTitle: () => [],
    getGamesByGenre: () => [],
    getGamesByPlatform: () => [],
    getGamesByTheme: () => [],
    getUniqueGenres: () => [],
    getUniquePlatforms: () => [],
    getUniqueThemes: () => [],
    getSimilarGames: () => [],
    getGamesByDifficulty: () => [],
    getGamesByReceptionScore: () => []
  };
}

/**
 * Create a mock Submission Service
 * @param {Array} submissions - Initial submissions array
 * @returns {Object} Mock submission service
 */
function createMockSubmissionService(submissions = []) {
  let data = [...submissions];
  return {
    createSubmission: (submissionData) => {
      const newSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...submissionData,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      data.push(newSubmission);
      return { id: newSubmission.id, status: 'pending' };
    },
    getAllSubmissions: () => data,
    getSubmissionById: (id) => data.find(s => s.id === id) || null,
    saveSubmissions: (d) => {
      data = d;
    },
    deleteSubmission: () => true,
    getPendingSubmissions: () => data.filter(s => s.status === 'pending'),
    getApprovedSubmissions: () => data.filter(s => s.status === 'approved'),
    getFlaggedSubmissions: () => data.filter(s => s.status === 'flagged'),
    updateSubmissionStatus: (id, status, dataToUpdate) => {
      const sub = data.find(s => s.id === id);
      if (sub) {
        sub.status = status;
        if (dataToUpdate) Object.assign(sub, dataToUpdate);
        return sub;
      }
      return null;
    },
    clearLanguageFilterFlag: () => false,
    languageFilter: {
      getAllWords: () => [],
      addWord: () => true,
      removeWord: () => true
    }
  };
}

/**
 * Create a mock Newsletter Service
 * @param {Array} subscribers - Initial subscribers array
 * @returns {Object} Mock newsletter service
 */
function createMockNewsletterService(subscribers = []) {
  let data = [...subscribers];
  return {
    subscribe: (email) => {
      const alreadyExists = data.find(s => s.email === email.toLowerCase());
      if (alreadyExists) {
        return { success: false, message: 'Already subscribed' };
      }
      data.push({ email: email.toLowerCase(), subscribedAt: new Date().toISOString() });
      return { success: true, data: {}, message: 'Subscribed' };
    },
    unsubscribe: (email) => {
      const idx = data.findIndex(s => s.email === email.toLowerCase());
      if (idx !== -1) {
        data.splice(idx, 1);
        return { success: true };
      }
      return { success: false, message: 'Not found' };
    },
    getStatistics: () => ({
      totalSubscribers: data.length
    }),
    getActiveSubscribers: () => data,
    getAllSubscribers: () => data,
    getNewsletterContent: () => ({}),
    updateNewsletterContent: () => true,
    sendNewsletter: () => ({ success: true }),
    getDeliveryLogs: () => []
  };
}

/**
 * Create a mock Deletion Request Service
 * @param {Array} requests - Initial deletion requests array
 * @returns {Object} Mock deletion request service
 */
function createMockDeletionRequestService(requests = []) {
  let data = [...requests];
  return {
    createRequest: (email, status = 'pending') => {
      const existingIdx = data.findIndex(r => r.email === email.toLowerCase());
      if (existingIdx !== -1) {
        data[existingIdx].status = status;
        return data[existingIdx];
      }
      const request = {
        id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        email: email.toLowerCase(),
        status,
        createdAt: new Date().toISOString(),
        processedBy: null,
        processedAt: null,
        notes: ''
      };
      data.push(request);
      return request;
    },
    getAllRequests: () => data,
    getStatistics: () => ({
      total: data.length
    }),
    processDeletion: async (email) => {
      const request = data.find(r => r.email === email.toLowerCase());
      if (request) {
        request.status = 'completed';
        request.processedBy = 'system';
        request.processedAt = new Date().toISOString();
        return { success: true, results: { newsletter: true, submissions: 1, games: 0 } };
      }
      return { success: false, error: 'Request not found' };
    }
  };
}

/**
 * Create a mock DMCA Service
 * @param {Array} requests - Initial DMCA requests array
 * @returns {Object} Mock DMCA service
 */
function createMockDmcaService(requests = []) {
  let data = [...requests];
  return {
    createRequest: (data) => {
      const request = {
        id: `dmca-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      data.push(request);
      return { id: request.id };
    },
    getAllRequests: () => data,
    getStatistics: () => ({
      total: data.length
    }),
    getRepeatOffenders: () => [],
    getRequestById: (id) => data.find(r => r.id === id) || null,
    processRequest: () => ({ success: true })
  };
}

/**
 * Create a mock request object for middleware testing
 * @param {string} path - Request path
 * @param {string} method - HTTP method
 * @param {Object} headers - Request headers
 * @param {Object} body - Request body
 * @param {Object} query - Query parameters
 * @returns {Object} Mock request object
 */
function createMockReq(path, method = 'GET', headers = {}, body = {}, query = {}) {
  return {
    path,
    method,
    headers,
    body,
    query,
    ip: '127.0.0.1',
    protocol: 'http'
  };
}

/**
 * Create a mock response object for middleware testing
 * @returns {Object} Mock response object
 */
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    headers: {},
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
    },
    set: function(key, value) {
      this.headers[key] = value;
    },
    send: function(data) {
      this.data = data;
    }
  };
  return res;
}

/**
 * Create temporary directories for test isolation
 * @returns {Object} Object containing temp directory paths and cleanup function
 */
function createTempDirs() {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  return {
    tempDir,
    cleanup: () => {
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  };
}

module.exports = {
  createMockGameAPI,
  createMockSubmissionService,
  createMockNewsletterService,
  createMockDeletionRequestService,
  createMockDmcaService,
  createMockReq,
  createMockRes,
  createTempDirs
};
