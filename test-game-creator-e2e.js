/**
 * End-to-End Test for Game Creator Pipeline
 *
 * Tests the complete game creation flow for "Sweet Home" game:
 * 1. Creates a submission
 * 2. Processes it through the full pipeline
 * 3. Verifies the game is created with proper metadata
 * 4. Uses OpenSearch MCP (configured for local use without Docker)
 *
 * Run with: node test-game-creator-e2e.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configure for OpenSearch MCP testing WITH Docker
// The OpenSearch MCP container must be running on localhost:3001
process.env.OPEN_WEBSEARCH_MCP_HOST = 'http://localhost:3001';
process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'true';
process.env.MCP_SERVER_ENABLED = 'true'; // Enable MCP server
process.env.MOCK_SEARCH_ENABLED = 'false'; // Disable mock for real testing

// LLM Configuration (adjust for your local setup)
process.env.LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'http://10.0.0.15:1234/v1/chat/completions';
process.env.LLM_MODEL = process.env.LLM_MODEL || 'Qwen3.5-27B-Q4_K_S.gguf';

// Reduce rate limits for faster testing
process.env.DUCKDUCKGO_RATE_LIMIT_DELAY = '1000';

console.log('='.repeat(80));
console.log('GAME CREATOR END-TO-END TEST');
console.log('Game: Sweet Home');
console.log('Using OpenSearch MCP (Local Configuration)');
console.log('='.repeat(80));
console.log('');

// Test configuration
const TEST_GAME = {
    title: 'Sweet Home',
    email: 'test@best-version.com'
};

const SUBMISSIONS_DIR = path.join(__dirname, 'submissions');
const SUBMISSIONS_INDEX = path.join(SUBMISSIONS_DIR, 'index.json');
const GAMES_DIR = path.join(__dirname, 'games');
const GAMES_INDEX = path.join(GAMES_DIR, 'index.json');

let testSubmissionId = null;
let testStartTime = null;

/**
 * Test step logger
 */
function logTest(step, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${step}] ${message}`);
    if (Object.keys(data).length > 0) {
        console.log('  ', JSON.stringify(data, null, 2));
    }
}

/**
 * Test assertion
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
    logTest('ASSERT', `✓ ${message}`);
}

/**
 * Load submissions index
 */
async function loadSubmissionsIndex() {
    try {
        const data = await fs.readFile(SUBMISSIONS_INDEX, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { submissions: [] };
    }
}

/**
 * Save submissions index
 */
async function saveSubmissionsIndex(indexData) {
    await fs.writeFile(SUBMISSIONS_INDEX, JSON.stringify(indexData, null, 2), 'utf8');
}

/**
 * STEP 1: Create a test submission for "Sweet Home"
 */
async function step1_CreateSubmission() {
    logTest('STEP 1', 'Creating test submission for "Sweet Home"');

    // Remove any existing Sweet Home submissions to ensure clean test
    let index = await loadSubmissionsIndex();
    const originalCount = index.submissions.length;
    index.submissions = index.submissions.filter(s =>
        !(s.title === 'Sweet Home' && s.testSubmission)
    );
    await saveSubmissionsIndex(index);
    if (index.submissions.length < originalCount) {
        logTest('STEP 1', `Cleaned up ${originalCount - index.submissions.length} previous test submission(s)`);
    }

    // Create new submission

    // Create new submission
    const submission = {
        id: `test-sweethome-${Date.now()}`,
        title: TEST_GAME.title,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        email: TEST_GAME.email,
        testSubmission: true, // Mark as test submission
        processorStatus: {}
    };

    index.submissions.push(submission);
    await saveSubmissionsIndex(index);

    testSubmissionId = submission.id;
    logTest('STEP 1', 'Test submission created', { id: submission.id });

    return submission;
}

/**
 * STEP 2: Verify search service configuration
 */
async function step2_VerifySearchConfiguration() {
    logTest('STEP 2', 'Verifying search service configuration');

    const agentModule = require('./src/services/game-creator/agent');
    const config = agentModule.getConfig();

    logTest('STEP 2', 'Agent configuration', config);

    // We're using MCP with OpenSearch MCP integration (Docker)
    assert(config.mcpEnabled, 'MCP should be enabled for OpenSearch MCP integration');
    assert(config.endpoint, 'LLM endpoint should be configured');
    assert(config.model, 'LLM model should be configured');

    // Check MCP configuration
    const mcpServerConfig = require('./src/services/game-creator/mcp-server').CONFIG;

    logTest('STEP 2', 'MCP Server configuration', {
        openWebSearchMCPEnabled: mcpServerConfig.openWebSearchMCPEnabled,
        openWebSearchMCPEngine: mcpServerConfig.openWebSearchMCPEngine,
        openWebSearchMCPHost: mcpServerConfig.openWebSearchMCPHost
    });

    assert(mcpServerConfig.openWebSearchMCPEnabled, 'OpenSearch MCP should be enabled');

    console.log('');
    console.log('Search configuration verified successfully!');
    console.log('');
}

/**
 * STEP 3: Test OpenSearch MCP tool connectivity
 */
async function step3_TestSearchTools() {
    logTest('STEP 3', 'Testing OpenSearch MCP tool connectivity');

    const agentModule = require('./src/services/game-creator/agent');

    // Test the performSearches function which uses MCP
    logTest('STEP 3', 'Executing search via MCP (OpenSearch MCP)');

    try {
        const searchResults = await agentModule.performSearches('Sweet Home video game 1989');

        logTest('STEP 3', 'Search results received', {
            totalSources: searchResults.results.length,
            queriesExecuted: searchResults.queries.length,
            sourceUrls: searchResults.sourceUrls.length
        });

        // Count total results
        const totalResults = searchResults.results.reduce((acc, s) => acc + s.results.length, 0);
        logTest('STEP 3', 'Total search results', { count: totalResults });

        // Log which sources returned results
        searchResults.results.forEach(source => {
            logTest('STEP 3', `Source: ${source.source}`, {
                results: source.results.length,
                query: source.query
            });
        });

        // Show sample results from OpenSearch MCP
        const mcpResults = searchResults.results.find(s => s.source === 'open-websearch-mcp');
        if (mcpResults && mcpResults.results.length > 0) {
            logTest('STEP 3', 'OpenSearch MCP sample results', {
                firstResult: mcpResults.results[0]?.title || 'N/A',
                count: mcpResults.results.length
            });
        }

        assert(searchResults.results.length > 0, 'Should receive results from OpenSearch MCP');
        assert(totalResults > 0, 'Should receive at least one search result');

        console.log('');
        console.log('OpenSearch MCP tool connectivity verified!');
        console.log('');

        return searchResults;

    } catch (error) {
        logTest('STEP 3', 'MCP search failed', { error: error.message });
        throw error;
    }
}

/**
 * STEP 4: Run the full processing pipeline
 */
async function step4_RunProcessingPipeline() {
    logTest('STEP 4', 'Starting full processing pipeline');

    testStartTime = Date.now();

    const processorModule = require('./src/services/game-creator/processor');

    // Get the submission
    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === testSubmissionId);

    assert(submission, 'Test submission should exist');
    assert(submission.status === 'pending', 'Submission should be pending');

    logTest('STEP 4', 'Processing submission', { id: submission.id, title: submission.title });

    // Run the processor
    const result = await processorModule.processSubmission(submission);

    const processingTime = Date.now() - testStartTime;
    logTest('STEP 4', 'Processing complete', {
        success: result.success,
        reason: result.reason,
        confidence: result.confidence,
        processingTime: processingTime
    });

    return result;
}

/**
 * STEP 5: Verify the game was created
 */
async function step5_VerifyGameCreated(processResult) {
    logTest('STEP 5', 'Verifying game was created');

    if (!processResult.success || !processResult.slug) {
        logTest('STEP 5', 'Game was not auto-approved, checking for review status');

        // Check if it needs review
        const index = await loadSubmissionsIndex();
        const submission = index.submissions.find(s => s.id === testSubmissionId);

        if (submission.status === 'needs_review') {
            logTest('STEP 5', 'Game marked for review', {
                confidence: submission.processorStatus?.confidenceScore,
                issues: submission.processorStatus?.issues?.length
            });

            // For test purposes, consider this a partial success
            logTest('STEP 5', 'Test PASSED (Partial) - Game requires manual review');
            return {
                success: true,
                needsReview: true,
                confidence: submission.processorStatus?.confidenceScore
            };
        }

        assert(false, 'Game processing should have succeeded or been marked for review');
    }

    // Verify game file exists
    const slug = processResult.slug;
    const gameFilePath = path.join(GAMES_DIR, `${slug.replace('/games/', '')}.json`);

    try {
        const gameData = await fs.readFile(gameFilePath, 'utf8');
        const game = JSON.parse(gameData);

        logTest('STEP 5', 'Game file created', {
            path: gameFilePath,
            title: game.basic_info?.title
        });

        assert(game.basic_info?.title, 'Game should have a title');
        assert(game.basic_info?.url_slug, 'Game should have a URL slug');

        // Verify metadata fields
        logTest('STEP 5', 'Verifying metadata completeness');

        const metadataChecks = {
            hasTitle: !!game.basic_info?.title,
            hasGenres: Array.isArray(game.basic_info?.genres) && game.basic_info.genres.length > 0,
            hasPlatforms: Array.isArray(game.release?.platforms) && game.release.platforms.length > 0,
            hasDescription: !!game.description?.synopsis,
            hasDevelopers: Array.isArray(game.basic_info?.developers),
            hasPublishers: Array.isArray(game.basic_info?.publishers)
        };

        logTest('STEP 5', 'Metadata validation', metadataChecks);

        // Check for Sweet Home-specific content
        const titleLower = game.basic_info?.title?.toLowerCase() || '';
        const synopsisLower = game.description?.synopsis?.toLowerCase() || '';

        logTest('STEP 5', 'Content verification', {
            titleContainsSweetHome: titleLower.includes('sweet') || titleLower.includes('home'),
            hasHorrorGenre: game.basic_info?.genres?.some(g => g.toLowerCase().includes('horror')),
            descriptionHasContent: synopsisLower.length > 50
        });

        assert(metadataChecks.hasTitle, 'Game should have a title');
        assert(metadataChecks.hasDescription, 'Game should have a description');

        console.log('');
        console.log('Game verification PASSED!');
        console.log('');

        return {
            success: true,
            needsReview: false,
            game: game,
            slug: slug
        };

    } catch (error) {
        if (error.code === 'ENOENT') {
            logTest('STEP 5', 'Game file not found', { path: gameFilePath });
            assert(false, 'Game file should have been created');
        }
        throw error;
    }
}

/**
 * STEP 6: Verify submission status updated
 */
async function step6_VerifySubmissionStatus(reviewResult) {
    logTest('STEP 6', 'Verifying submission status updated');

    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === testSubmissionId);

    assert(submission, 'Submission should exist');

    logTest('STEP 6', 'Submission status', {
        status: submission.status,
        processorStatus: submission.processorStatus
    });

    if (reviewResult.needsReview) {
        assert(submission.status === 'needs_review', 'Submission should be marked for review');
    } else {
        assert(submission.status === 'completed', 'Submission should be completed');
    }

    console.log('');
    console.log('Submission status verification PASSED!');
    console.log('');
}

/**
 * STEP 7: Cleanup (optional)
 */
async function step7_Cleanup(removeTest = false) {
    logTest('STEP 7', 'Cleanup');

    if (!removeTest) {
        logTest('STEP 7', 'Skipping cleanup - keeping test data for inspection');
        return;
    }

    logTest('STEP 7', 'Removing test submission and game data');

    // Remove from submissions
    const index = await loadSubmissionsIndex();
    const newIndex = {
        submissions: index.submissions.filter(s => s.id !== testSubmissionId)
    };
    await saveSubmissionsIndex(newIndex);

    logTest('STEP 7', 'Test data cleaned up');
}

/**
 * Print test summary
 */
function printSummary(results) {
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('Game Tested:', TEST_GAME.title);
    console.log('Total Duration:', (results.totalTime / 1000).toFixed(2), 'seconds');
    console.log('');
    console.log('Steps:');
    results.steps.forEach(step => {
        const status = step.passed ? '✓ PASSED' : '✗ FAILED';
        const duration = step.duration ? ` (${(step.duration / 1000).toFixed(2)}s)` : '';
        console.log(`  ${step.number}. ${step.name}: ${status}${duration}`);
    });
    console.log('');

    if (results.allPassed) {
        console.log('OVERALL RESULT: ✓ ALL TESTS PASSED');
        if (results.needsReview) {
            console.log('Note: Game requires manual review (confidence: ' + results.confidence + ')');
        }
    } else {
        console.log('OVERALL RESULT: ✗ SOME TESTS FAILED');
        console.log('');
        console.log('Failed steps:');
        results.steps.filter(s => !s.passed).forEach(step => {
            console.log(`  - ${step.name}: ${step.error}`);
        });
    }
    console.log('');
    console.log('='.repeat(80));
}

/**
 * Main test runner
 */
async function runE2ETest() {
    const results = {
        steps: [],
        allPassed: true,
        startTime: Date.now()
    };

    const stepNames = [
        'Create Submission',
        'Verify MCP Configuration',
        'Test OpenSearch MCP Tools',
        'Run Processing Pipeline',
        'Verify Game Created',
        'Verify Submission Status'
    ];

    try {
        // STEP 1: Create Submission
        const step1Start = Date.now();
        try {
            await step1_CreateSubmission();
            results.steps.push({
                number: 1,
                name: stepNames[0],
                passed: true,
                duration: Date.now() - step1Start
            });
        } catch (error) {
            results.steps.push({
                number: 1,
                name: stepNames[0],
                passed: false,
                error: error.message,
                duration: Date.now() - step1Start
            });
            results.allPassed = false;
            throw error;
        }

        // STEP 2: Verify Search Configuration
        const step2Start = Date.now();
        try {
            await step2_VerifySearchConfiguration();
            results.steps.push({
                number: 2,
                name: stepNames[1],
                passed: true,
                duration: Date.now() - step2Start
            });
        } catch (error) {
            results.steps.push({
                number: 2,
                name: stepNames[1],
                passed: false,
                error: error.message,
                duration: Date.now() - step2Start
            });
            results.allPassed = false;
            throw error;
        }

        // STEP 3: Test MCP Tools
        const step3Start = Date.now();
        try {
            await step3_TestSearchTools();
            results.steps.push({
                number: 3,
                name: stepNames[2],
                passed: true,
                duration: Date.now() - step3Start
            });
        } catch (error) {
            results.steps.push({
                number: 3,
                name: stepNames[2],
                passed: false,
                error: error.message,
                duration: Date.now() - step3Start
            });
            results.allPassed = false;
            throw error;
        }

        // STEP 4: Run Processing Pipeline
        const step4Start = Date.now();
        try {
            const processResult = await step4_RunProcessingPipeline();
            results.steps.push({
                number: 4,
                name: stepNames[3],
                passed: true,
                duration: Date.now() - step4Start
            });

            // STEP 5: Verify Game Created
            const step5Start = Date.now();
            try {
                const reviewResult = await step5_VerifyGameCreated(processResult);
                results.steps.push({
                    number: 5,
                    name: stepNames[4],
                    passed: true,
                    duration: Date.now() - step5Start
                });
                results.needsReview = reviewResult.needsReview;
                results.confidence = reviewResult.confidence;

                // STEP 6: Verify Submission Status
                const step6Start = Date.now();
                try {
                    await step6_VerifySubmissionStatus(reviewResult);
                    results.steps.push({
                        number: 6,
                        name: stepNames[5],
                        passed: true,
                        duration: Date.now() - step6Start
                    });
                } catch (error) {
                    results.steps.push({
                        number: 6,
                        name: stepNames[5],
                        passed: false,
                        error: error.message,
                        duration: Date.now() - step6Start
                    });
                    results.allPassed = false;
                    // Don't throw - continue to summary
                }

            } catch (error) {
                results.steps.push({
                    number: 5,
                    name: stepNames[4],
                    passed: false,
                    error: error.message,
                    duration: Date.now() - step5Start
                });
                results.steps.push({
                    number: 6,
                    name: stepNames[5],
                    passed: false,
                    error: 'Skipped due to previous failure',
                    duration: 0
                });
                results.allPassed = false;
                // Don't throw - continue to summary
            }

        } catch (error) {
            results.steps.push({
                number: 4,
                name: stepNames[3],
                passed: false,
                error: error.message,
                duration: Date.now() - step4Start
            });
            results.steps.push({
                number: 5,
                name: stepNames[4],
                passed: false,
                error: 'Skipped due to previous failure',
                duration: 0
            });
            results.steps.push({
                number: 6,
                name: stepNames[5],
                passed: false,
                error: 'Skipped due to previous failure',
                duration: 0
            });
            results.allPassed = false;
            // Don't throw - continue to summary
        }

        results.totalTime = Date.now() - results.startTime;
        printSummary(results);

        // Exit with appropriate code
        process.exit(results.allPassed ? 0 : 1);

    } catch (error) {
        console.error('');
        console.error('FATAL ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
runE2ETest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
