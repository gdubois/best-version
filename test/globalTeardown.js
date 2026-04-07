// Global test teardown to clean up intervals
async function globalTeardown() {
  try {
    // Stop cleanup intervals from security middleware
    const security = require('../src/middleware/security');
    if (security.sessionStore && security.sessionStore.stopCleanup) {
      security.sessionStore.stopCleanup();
    }
  } catch (e) {
    // Ignore errors in teardown
  }

  try {
    // Stop cleanup intervals from concurrency middleware
    const concurrency = require('../src/middleware/concurrency');
    if (concurrency.stopCleanup) {
      concurrency.stopCleanup();
    }
  } catch (e) {
    // Ignore errors in teardown
  }

  try {
    // Stop cleanup intervals from adminAuth middleware
    const adminAuth = require('../src/middleware/adminAuth');
    if (adminAuth.stopAdminAuthCleanup) {
      adminAuth.stopAdminAuthCleanup();
    }
  } catch (e) {
    // Ignore errors in teardown
  }
}

module.exports = globalTeardown;
