#!/usr/bin/env node
// Test runner for all test suites

const { execSync } = require('child_process');
const path = require('path');

let totalPassed = 0;
let totalFailed = 0;
let testsRun = 0;

function runTestFile(testPath, testName) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testName}`);
    console.log('='.repeat(60));

    execSync(`node "${testPath}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    return true;
  } catch (error) {
    console.error(`\n❌ ${testName} failed`);
    return false;
  }
}

function main() {
  console.log('\n========================================');
  console.log('  Running All Tests');
  console.log('========================================');

  const baseDir = path.join(__dirname);

  // Run main test suite
  const mainResult = runTestFile(
    path.join(baseDir, 'index.js'),
    'Main Test Suite (GameLoader, GameAPI, Validator)'
  );
  testsRun++;

  // Run service tests
  const servicesDir = path.join(baseDir, 'services');
  try {
    const servicesFiles = require('fs').readdirSync(servicesDir)
      .filter(f => f.endsWith('.test.js'));

    for (const file of servicesFiles) {
      const result = runTestFile(
        path.join(servicesDir, file),
        `Service Test: ${file}`
      );
      testsRun++;
    }
  } catch (error) {
    console.log('No service tests found');
  }

  // Run utility tests
  const utilsDir = path.join(baseDir, 'utils');
  try {
    const utilsFiles = require('fs').readdirSync(utilsDir)
      .filter(f => f.endsWith('.test.js'));

    for (const file of utilsFiles) {
      const result = runTestFile(
        path.join(utilsDir, file),
        `Utility Test: ${file}`
      );
      testsRun++;
    }
  } catch (error) {
    console.log('No utility tests found');
  }

  // Run middleware tests
  const middlewareDir = path.join(baseDir, 'middleware');
  try {
    const middlewareFiles = require('fs').readdirSync(middlewareDir)
      .filter(f => f.endsWith('.test.js'));

    for (const file of middlewareFiles) {
      const result = runTestFile(
        path.join(middlewareDir, file),
        `Middleware Test: ${file}`
      );
      testsRun++;
    }
  } catch (error) {
    console.log('No middleware tests found');
  }

  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');
  console.log(`Tests Run: ${testsRun}`);
  console.log('\nDone!');
  console.log();
}

main();
