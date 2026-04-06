// File-based storage service for games and submissions
// Story 6.4: File-Based Data Storage

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Atomic file operations to prevent corruption
 * Uses write-to-temp-then-rename pattern for atomicity
 */
class AtomicFileWriter {
  constructor(directory) {
    this.directory = directory;
  }

  /**
   * Write data atomically using temp file + rename
   * @param {string} filename - Name of the file (not full path)
   * @param {object} data - Data to write
   * @returns {boolean} - Success status
   */
  writeAtomic(filename, data) {
    try {
      const fullPath = path.join(this.directory, filename);
      const tempPath = fullPath + `.tmp.${process.pid}`;

      // Ensure directory exists
      if (!fs.existsSync(this.directory)) {
        fs.mkdirSync(this.directory, { recursive: true });
      }

      // Write to temp file first
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));

      // Atomically rename temp file to target file
      // This is atomic on most file systems
      fs.renameSync(tempPath, fullPath);

      return true;
    } catch (error) {
      console.error('Atomic write error:', error.message);

      // Clean up temp file if it exists
      try {
        const tempPath = path.join(this.directory, filename) + `.tmp.${process.pid}`;
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }

      return false;
    }
  }

  /**
   * Read file safely with error handling
   * @param {string} filename - Name of the file
   * @param {*} defaultValue - Default value if file doesn't exist
   * @returns {*} - Parsed data or default value
   */
  readAtomic(filename, defaultValue = null) {
    try {
      const fullPath = path.join(this.directory, filename);

      if (!fs.existsSync(fullPath)) {
        return defaultValue;
      }

      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Atomic read error:', error.message);
      return defaultValue;
    }
  }

  /**
   * Delete file safely
   * @param {string} filename - Name of the file
   * @returns {boolean} - Success status
   */
  deleteAtomic(filename) {
    try {
      const fullPath = path.join(this.directory, filename);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Also clean up any leftover temp files
      const tempPath = fullPath + `.tmp.*`;
      const matches = fs.readdirSync(this.directory).filter(f =>
        f.startsWith(path.basename(fullPath) + '.tmp.')
      );

      matches.forEach(match => {
        try {
          fs.unlinkSync(path.join(this.directory, match));
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      return true;
    } catch (error) {
      console.error('Atomic delete error:', error.message);
      return false;
    }
  }
}

/**
 * GameStorageService - Manages game data storage
 * Stores individual game JSON files and maintains index
 */
class GameStorageService {
  constructor(gamesDir) {
    this.gamesDir = gamesDir;
    this.indexFile = 'index.json';
    this.fileWriter = new AtomicFileWriter(gamesDir);

    // Ensure directory exists
    if (!fs.existsSync(gamesDir)) {
      fs.mkdirSync(gamesDir, { recursive: true });
    }

    // Initialize index if it doesn't exist
    this.initializeIndex();
  }

  /**
   * Initialize empty games index
   */
  initializeIndex() {
    const index = this.fileWriter.readAtomic(this.indexFile, []);
    if (!Array.isArray(index)) {
      this.fileWriter.writeAtomic(this.indexFile, []);
    }
  }

  /**
   * Get all games from index
   * @returns {Array} - List of game entries
   */
  getAllGames() {
    const index = this.fileWriter.readAtomic(this.indexFile, []);
    return index || [];
  }

  /**
   * Get game by URL slug
   * @param {string} slug - URL slug of the game
   * @returns {object|null} - Game data or null
   */
  getGameBySlug(slug) {
    try {
      const filePath = path.join(this.gamesDir, `${slug}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading game:', error.message);
      return null;
    }
  }

  /**
   * Get game by title (case-insensitive partial match)
   * @param {string} title - Game title
   * @returns {object|null} - Game data or null
   */
  getGameByTitle(title) {
    const games = this.getAllGames();
    const slug = games.find(g =>
      g.title.toLowerCase() === title.toLowerCase()
    )?.url_slug;

    return slug ? this.getGameBySlug(slug) : null;
  }

  /**
   * Create a new game entry
   * @param {object} gameData - Complete game data
   * @returns {object|null} - Created game data or null
   */
  createGame(gameData) {
    try {
      const slug = gameData.basic_info?.url_slug ||
                   this.generateSlug(gameData.basic_info?.title);

      // Check if game already exists
      if (this.getGameBySlug(slug)) {
        console.error(`Game with slug ${slug} already exists`);
        return null;
      }

      // Ensure basic_info structure exists
      if (!gameData.basic_info) {
        gameData.basic_info = {};
      }

      // Set url_slug if not set
      if (!gameData.basic_info.url_slug) {
        gameData.basic_info.url_slug = slug;
      }

      // Write game file atomically
      const gameFile = `${slug}.json`;
      if (!this.fileWriter.writeAtomic(gameFile, gameData)) {
        return null;
      }

      // Update index atomically
      const index = this.fileWriter.readAtomic(this.indexFile, []);
      if (!index.some(g => g.url_slug === slug)) {
        index.push({
          title: gameData.basic_info.title,
          url_slug: slug
        });
        this.fileWriter.writeAtomic(this.indexFile, index);
      }

      return this.getGameBySlug(slug);
    } catch (error) {
      console.error('Error creating game:', error.message);
      return null;
    }
  }

  /**
   * Update an existing game entry
   * @param {string} slug - URL slug of the game
   * @param {object} updateData - Fields to update
   * @returns {object|null} - Updated game data or null
   */
  updateGame(slug, updateData) {
    try {
      const existingGame = this.getGameBySlug(slug);

      if (!existingGame) {
        console.error(`Game with slug ${slug} not found`);
        return null;
      }

      // Merge update data with existing game
      const updatedGame = {
        ...existingGame,
        ...updateData,
        basic_info: {
          ...existingGame.basic_info,
          ...updateData.basic_info
        }
      };

      // Update url_slug if changed
      const newSlug = updateData.basic_info?.url_slug;
      if (newSlug && newSlug !== slug) {
        // Remove old file
        this.fileWriter.deleteAtomic(`${slug}.json`);

        // Reassign slug
        updatedGame.basic_info.url_slug = newSlug;

        // Update index entry
        const index = this.fileWriter.readAtomic(this.indexFile, []);
        const indexEntry = index.find(g => g.url_slug === slug);
        if (indexEntry) {
          indexEntry.url_slug = newSlug;
          indexEntry.title = updatedGame.basic_info.title;
        }
        this.fileWriter.writeAtomic(this.indexFile, index);

        slug = newSlug;
      }

      // Write updated game file atomically
      if (!this.fileWriter.writeAtomic(`${slug}.json`, updatedGame)) {
        return null;
      }

      return updatedGame;
    } catch (error) {
      console.error('Error updating game:', error.message);
      return null;
    }
  }

  /**
   * Delete a game entry
   * @param {string} slug - URL slug of the game
   * @returns {boolean} - Success status
   */
  deleteGame(slug) {
    try {
      // Delete game file
      if (!this.fileWriter.deleteAtomic(`${slug}.json`)) {
        return false;
      }

      // Update index
      const index = this.fileWriter.readAtomic(this.indexFile, []);
      const filteredIndex = index.filter(g => g.url_slug !== slug);

      if (filteredIndex.length === index.length) {
        // Game not found in index
        return false;
      }

      this.fileWriter.writeAtomic(this.indexFile, filteredIndex);
      return true;
    } catch (error) {
      console.error('Error deleting game:', error.message);
      return false;
    }
  }

  /**
   * Search games by title (partial, case-insensitive)
   * @param {string} searchTerm - Search term
   * @returns {Array} - Matching games
   */
  searchGames(searchTerm) {
    const games = this.getAllGames();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Convert Roman numerals to digits for searching
    const digitSearch = this.convertRomanToDigit(normalizedSearch);

    return games.filter(game => {
      const title = game.basic_info?.title?.toLowerCase() || '';
      const alternatives = (game.basic_info?.alternative_names || []).map(a => a.toLowerCase());

      return title.includes(normalizedSearch) ||
             alternatives.some(a => a.includes(normalizedSearch)) ||
             title.includes(digitSearch) ||
             alternatives.some(a => a.includes(digitSearch));
    });
  }

  /**
   * Generate slug from title
   * @param {string} title - Game title
   * @returns {string} - URL-friendly slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Convert Roman numerals to digits for search normalization
   * @param {string} text - Text that may contain Roman numerals
   * @returns {string} - Text with Roman numerals converted to digits
   */
  convertRomanToDigit(text) {
    const romanToDigit = {
      i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
      x: 10, xi: 11, xii: 12
    };

    // Replace Roman numerals with digits
    return text.replace(/\b(i{1,3}|iv|v?i{0,3}|x{0,3}|xi?x?|xc|c?x{0,3})\b/g, match => {
      const lowerMatch = match.toLowerCase();
      return romanToDigit[lowerMatch] || match;
    });
  }

  /**
   * Get storage statistics
   * @returns {object} - Storage statistics
   */
  getStatistics() {
    const games = this.getAllGames();
    return {
      totalGames: games.length,
      storageDirectory: this.gamesDir,
      indexFile: path.join(this.gamesDir, this.indexFile)
    };
  }
}

/**
 * SubmissionStorageService - Manages submission data storage
 * Stores submissions with status tracking
 */
class SubmissionStorageService {
  constructor(submissionsDir) {
    this.submissionsDir = submissionsDir;
    this.indexFile = 'index.json';
    this.fileWriter = new AtomicFileWriter(submissionsDir);

    // Ensure directory exists
    if (!fs.existsSync(submissionsDir)) {
      fs.mkdirSync(submissionsDir, { recursive: true });
    }

    // Initialize submissions file if it doesn't exist
    if (!this.fileWriter.readAtomic(this.indexFile)) {
      this.fileWriter.writeAtomic(this.indexFile, []);
    }
  }

  /**
   * Get all submissions
   * @returns {Array} - List of all submissions
   */
  getAllSubmissions() {
    return this.fileWriter.readAtomic(this.indexFile, []);
  }

  /**
   * Get submission by ID
   * @param {string} id - Submission ID
   * @returns {object|null} - Submission data or null
   */
  getSubmissionById(id) {
    const submissions = this.getAllSubmissions();
    return submissions.find(s => s.id === id) || null;
  }

  /**
   * Create a new submission
   * @param {object} submissionData - Submission data
   * @returns {object|null} - Created submission or null
   */
  createSubmission(submissionData) {
    try {
      const newSubmission = {
        id: uuidv4(),
        ...submissionData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        approvedAt: null
      };

      const submissions = this.getAllSubmissions();
      submissions.push(newSubmission);

      if (!this.fileWriter.writeAtomic(this.indexFile, submissions)) {
        return null;
      }

      return newSubmission;
    } catch (error) {
      console.error('Error creating submission:', error.message);
      return null;
    }
  }

  /**
   * Update submission status
   * @param {string} id - Submission ID
   * @param {string} status - New status
   * @param {object} reviewData - Review metadata
   * @returns {object|null} - Updated submission or null
   */
  updateSubmissionStatus(id, status, reviewData = {}) {
    try {
      const submissions = this.getAllSubmissions();
      const index = submissions.findIndex(s => s.id === id);

      if (index === -1) {
        return null;
      }

      const submission = submissions[index];
      submission.status = status;
      submission.reviewedAt = new Date().toISOString();
      submission.reviewedBy = reviewData.reviewedBy || null;

      if (status === 'approved') {
        submission.approvedAt = new Date().toISOString();
      } else if (status === 'rejected') {
        submission.rejectionReason = reviewData.rejectionReason || null;
      }

      submissions[index] = submission;

      if (!this.fileWriter.writeAtomic(this.indexFile, submissions)) {
        return null;
      }

      return submission;
    } catch (error) {
      console.error('Error updating submission status:', error.message);
      return null;
    }
  }

  /**
   * Get pending submissions
   * @returns {Array} - Pending submissions
   */
  getPendingSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'pending');
  }

  /**
   * Get approved submissions
   * @returns {Array} - Approved submissions
   */
  getApprovedSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'approved');
  }

  /**
   * Get rejected submissions
   * @returns {Array} - Rejected submissions
   */
  getRejectedSubmissions() {
    const submissions = this.getAllSubmissions();
    return submissions.filter(s => s.status === 'rejected');
  }

  /**
   * Delete submission by ID
   * @param {string} id - Submission ID
   * @returns {boolean} - Success status
   */
  deleteSubmission(id) {
    try {
      const submissions = this.getAllSubmissions();
      const filtered = submissions.filter(s => s.id !== id);

      if (filtered.length === submissions.length) {
        return false; // Not found
      }

      if (!this.fileWriter.writeAtomic(this.indexFile, filtered)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting submission:', error.message);
      return false;
    }
  }

  /**
   * Get submission statistics
   * @returns {object} - Statistics
   */
  getStatistics() {
    const submissions = this.getAllSubmissions();
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    };
  }
}

/**
 * StorageManager - Coordinates both storage services
 */
class StorageManager {
  constructor(gamesDir, submissionsDir) {
    this.games = new GameStorageService(gamesDir);
    this.submissions = new SubmissionStorageService(submissionsDir);
  }

  /**
   * Get overall storage statistics
   * @returns {object} - Combined statistics
   */
  getStatistics() {
    return {
      games: this.games.getStatistics(),
      submissions: this.submissions.getStatistics()
    };
  }
}

module.exports = {
  AtomicFileWriter,
  GameStorageService,
  SubmissionStorageService,
  StorageManager
};
