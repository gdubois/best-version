// Environment variable helpers for tests

/**
 * Save current environment variable state and return restore function
 * @param {Array<string>} keys - Environment variable keys to save
 * @returns {Function} Restore function
 */
const saveEnv = (keys = []) => {
  const snapshot = {};
  keys.forEach(key => {
    snapshot[key] = process.env[key];
  });

  return () => {
    keys.forEach(key => {
      if (snapshot[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = snapshot[key];
      }
    });
  };
};

/**
 * Temporarily set environment variables for a test
 * @param {Object} vars - Environment variables to set
 * @param {Function} testFn - Test function to run
 * @returns {any} Result of test function
 */
const withEnv = (vars, testFn) => {
  const restore = saveEnv(Object.keys(vars));
  const originalTestFn = Object.assign(() => {
    Object.assign(process.env, vars);
    try {
      return testFn();
    } finally {
      restore();
    }
  }, testFn);
  return originalTestFn;
};

module.exports = {
  saveEnv,
  withEnv
};
