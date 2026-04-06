// Test helper utilities for adding test IDs, priorities, and BDD structure
// These helpers provide a consistent way to write testable, traceable tests

/**
 * Create a test function with ID and priority support
 * @param {string} id - Test ID (e.g., '1.0-SVC-001')
 * @param {string} priority - Priority level (P0, P1, P2, P3)
 * @param {string} name - Test name
 * @param {Function} fn - Test function (sync or async)
 */
function test(id, priority, name, fn) {
  const testName = `[${id}] [${priority}] ${name}`;

  // Handle both sync and async tests
  const testFn = fn;

  try {
    const result = testFn();
    // Handle promise return for async tests
    if (result && typeof result.then === 'function') {
      result
        .then(() => {
          console.log(`✓ ${testName}`);
        })
        .catch((error) => {
          console.log(`✗ ${testName}`);
          console.log(`  Error: ${error.message}`);
          if (process.exitCode === undefined) process.exitCode = 1;
        });
    } else {
      console.log(`✓ ${testName}`);
    }
  } catch (error) {
    console.log(`✗ ${testName}`);
    console.log(`  Error: ${error.message}`);
    if (process.exitCode === undefined) process.exitCode = 1;
  }
}

/**
 * Run async tests sequentially with timeout
 * @param {Array} tests - Array of test objects with name and fn
 * @param {string} prefix - Test output prefix
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
async function runAsyncTests(tests, prefix, timeout = 10000) {
  console.log(`\n=== ${prefix} ===\n`);

  let passCount = 0;
  let failCount = 0;

  for (const { id, priority, name, fn } of tests) {
    const testName = `[${id}] [${priority}] ${name}`;
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        await Promise.race([
          result,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Test "${testName}" timed out after ${timeout}ms`)), timeout)
          )
        ]);
        console.log(`✓ ${testName}`);
        passCount++;
      } else {
        console.log(`✓ ${testName}`);
        passCount++;
      }
    } catch (error) {
      console.log(`✗ ${testName}`);
      console.log(`  Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log('');

  return { passCount, failCount };
}

/**
 * Run sync tests sequentially
 * @param {Array} tests - Array of test objects with name and fn
 * @param {string} prefix - Test output prefix
 */
function runSyncTests(tests, prefix) {
  console.log(`\n=== ${prefix} ===\n`);

  let passCount = 0;
  let failCount = 0;

  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`✓ ${name}`);
      passCount++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log('');

  return { passCount, failCount };
}

/**
 * Get a value based on conditions (BDD style assertion helper)
 * @param {boolean} condition - Condition to check
 * @param {*} value - Value to return if condition is true
 * @param {*} defaultValue - Value to return if condition is false
 * @returns {*} Result based on condition
 */
function getValueIf(condition, value, defaultValue) {
  return condition ? value : defaultValue;
}

/**
 * Log BDD section headers
 */
const bdd = {
  given: (description) => console.log(`  Given: ${description}`),
  when: (description) => console.log(`  When: ${description}`),
  then: (description) => console.log(`  Then: ${description}`),
  and: (description) => console.log(`    And: ${description}`),
  but: (description) => console.log(`    But: ${description}`)
};

module.exports = {
  test,
  runAsyncTests,
  runSyncTests,
  getValueIf,
  bdd
};
