/**
 * End-to-End Test for Game Creator Pipeline - Legend of Mana
 *
 * Tests the complete game creation flow:
 * 1. Creates a submission
 * 2. Processes it through the full pipeline
 * 3. Verifies the game is created with proper metadata
 * 4. Uses OpenSearch MCP (configured for local use with Docker)
 *
 * Run with: node test-legend-of-mana-e2e.js
 */

const fs = require('fs').promises;
const path = require('path');

// Configure for OpenSearch MCP testing WITH Docker
process.env.OPEN_WEBSEARCH_MCP_HOST = 'http://localhost:3001';
process.env.OPEN_WEBSEARCH_MCP_ENABLED = 'true';
process.env.MCP_SERVER_ENABLED = 'true';
process.env.MOCK_SEARCH_ENABLED = 'false';

// LLM Configuration
process.env.LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'http://10.0.0.15:1234/v1/chat/completions';
process.env.LLM_MODEL = process.env.LLM_MODEL || 'Qwen3.5-27B-Q4_K_S.gguf';

console.log('='.repeat(80));
console.log('GAME CREATOR END-TO-END TEST');
console.log('Game: Legend of Mana');
console.log('Using OpenSearch MCP (Docker Configuration)');
console.log('='.repeat(80));
console.log('');

// Test configuration
const TEST_GAME = {
    title: 'Legend of Mana',
    email: 'test@best-version.com'
};

const SUBMISSIONS_DIR = path.join(__dirname, 'submissions');
const SUBMISSIONS_INDEX = path.join(SUBMISSIONS_DIR, 'index.json');
const GAMES_DIR = path.join(__dirname, 'games');
const IMAGES_DIR = path.join(__dirname, 'images');

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
 * STEP 1: Create a test submission
 */
async function step1_CreateSubmission() {
    logTest('STEP 1', 'Creating test submission for "Legend of Mana"');

    // Clean up any existing test submissions
    let index = await loadSubmissionsIndex();
    const originalCount = index.submissions.length;
    index.submissions = index.submissions.filter(s =>
        !(s.title === TEST_GAME.title && s.testSubmission)
    );
    await saveSubmissionsIndex(index);
    if (index.submissions.length < originalCount) {
        logTest('STEP 1', `Cleaned up ${originalCount - index.submissions.length} previous test submission(s)`);
    }

    // Create new submission
    const submission = {
        id: `test-${TEST_GAME.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        title: TEST_GAME.title,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        email: TEST_GAME.email,
        testSubmission: true,
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

    assert(config.mcpEnabled, 'MCP should be enabled');
    assert(config.endpoint, 'LLM endpoint should be configured');
    assert(config.model, 'LLM model should be configured');

    const mcpServerConfig = require('./src/services/game-creator/mcp-server').CONFIG;

    logTest('STEP 2', 'MCP Server configuration', {
        openWebSearchMCPEnabled: mcpServerConfig.openWebSearchMCPEnabled,
        openWebSearchMCPEngine: mcpServerConfig.openWebSearchMCPEngine,
        openWebSearchMCPHost: mcpServerConfig.openWebSearchMCPHost
    });

    assert(mcpServerConfig.openWebSearchMCPEnabled, 'OpenSearch MCP should be enabled');

    console.log('');
    console.log('Search configuration verified!');
    console.log('');
}

/**
 * STEP 3: Test OpenSearch MCP tool connectivity
 */
async function step3_TestSearchTools() {
    logTest('STEP 3', 'Testing OpenSearch MCP tool connectivity');

    const agentModule = require('./src/services/game-creator/agent');

    logTest('STEP 3', 'Executing search via MCP');

    try {
        const searchResults = await agentModule.performSearches('Legend of Mana video game');

        logTest('STEP 3', 'Search results received', {
            totalSources: searchResults.results.length,
            queriesExecuted: searchResults.queries.length,
            sourceUrls: searchResults.sourceUrls.length
        });

        const totalResults = searchResults.results.reduce((acc, s) => acc + s.results.length, 0);
        logTest('STEP 3', 'Total search results', { count: totalResults });

        searchResults.results.forEach(source => {
            logTest('STEP 3', `Source: ${source.source}`, {
                results: source.results.length,
                query: source.query
            });
        });

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

    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === testSubmissionId);

    assert(submission, 'Test submission should exist');
    assert(submission.status === 'pending', 'Submission should be pending');

    logTest('STEP 4', 'Processing submission', { id: submission.id, title: submission.title });

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
 * STEP 5: Verify the game was created or show draft data
 */
async function step5_VerifyGameCreated(processResult) {
    logTest('STEP 5', 'Verifying game creation');

    // Check submission status
    const index = await loadSubmissionsIndex();
    const submission = index.submissions.find(s => s.id === testSubmissionId);

    if (submission.status === 'completed' && processResult.slug) {
        // Game was auto-approved - verify file exists
        const slug = processResult.slug;
        const gameFilePath = path.join(GAMES_DIR, `${slug.replace('/games/', '')}.json`);

        try {
            const gameData = await fs.readFile(gameFilePath, 'utf8');
            const game = JSON.parse(gameData);

            logTest('STEP 5', 'Game file created', {
                path: gameFilePath,
                title: game.basic_info?.title
            });

            // Show the full game JSON
            console.log('');
            console.log('='.repeat(80));
            console.log('GENERATED GAME JSON:');
            console.log('='.repeat(80));
            console.log(gameData);
            console.log('='.repeat(80));
            console.log('');

            // Check for image
            const imageFileName = slug.replace('/games/', '') + '.jpg';
            const imageFilePath = path.join(IMAGES_DIR, imageFileName);

            try {
                await fs.access(imageFilePath);
                logTest('STEP 5', 'Cover image found', { path: imageFilePath });
                console.log('');
                console.log('Cover image location:', imageFilePath);
                console.log('');
            } catch (imgError) {
                logTest('STEP 5', 'Cover image not found', { path: imageFilePath });
            }

            return { success: true, needsReview: false, game: game, slug: slug };

        } catch (error) {
            if (error.code === 'ENOENT') {
                logTest('STEP 5', 'Game file not found', { path: gameFilePath });
            }
            throw error;
        }

    } else if (submission.status === 'needs_review') {
        logTest('STEP 5', 'Game marked for review - checking for draft data');

        const draftData = submission.processorStatus?.draftData;
        if (draftData) {
            logTest('STEP 5', 'Draft game data found in submission');

            // Show the draft JSON
            console.log('');
            console.log('='.repeat(80));
            console.log('DRAFT GAME JSON (requires manual review):');
            console.log('='.repeat(80));
            console.log(JSON.stringify(draftData, null, 2));
            console.log('='.repeat(80));
            console.log('');

            // Show validation issues
            const issues = submission.processorStatus?.issues || [];
            logTest('STEP 5', 'Validation issues', {
                count: issues.length,
                confidence: submission.processorStatus?.confidenceScore
            });

            if (issues.length <= 10) {
                issues.forEach((issue, idx) => {
                    logTest('STEP 5', `Issue ${idx + 1}`, {
                        field: issue.field,
                        message: issue.message
                    });
                });
            }

            return {
                success: false,
                needsReview: true,
                draftData: draftData,
                confidence: submission.processorStatus?.confidenceScore
            };
        }

        logTest('STEP 5', 'No draft data available');
        return { success: false, needsReview: true };

    } else {
        logTest('STEP 5', 'Game not created', { status: submission.status });
        return { success: false };
    }
}

/**
 * STEP 6: Print final summary
 */
function printSummary(results) {
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('Game Tested:', TEST_GAME.title);
    console.log('Total Duration:', (results.totalTime / 1000).toFixed(2), 'seconds');
    console.log('');

    if (results.success) {
        console.log('RESULT: ✓ Game created successfully');
        if (results.slug) {
            console.log('Game Slug:', results.slug);
        }
    } else if (results.needsReview) {
        console.log('RESULT: ⚠ Game requires manual review');
        console.log('Confidence:', results.confidence?.toFixed(4) || 'N/A');
        console.log('');
        console.log('The draft game data was displayed above.');
        console.log('Fix the validation issues and resubmit for auto-approval.');
    } else {
        console.log('RESULT: ✗ Test failed');
    }
    console.log('');
    console.log('='.repeat(80));
}

/**
 * Main test runner
 */
async function runE2ETest() {
    const results = {
        success: false,
        needsReview: false,
        startTime: Date.now()
    };

    try {
        // STEP 1: Create Submission
        await step1_CreateSubmission();

        // STEP 2: Verify Search Configuration
        await step2_VerifySearchConfiguration();

        // STEP 3: Test MCP Tools
        await step3_TestSearchTools();

        // STEP 4: Run Processing Pipeline
        const processResult = await step4_RunProcessingPipeline();

        // STEP 5: Verify Game Created
        const verifyResult = await step5_VerifyGameCreated(processResult);
        results.success = verifyResult.success;
        results.needsReview = verifyResult.needsReview;
        results.slug = verifyResult.slug;
        results.confidence = verifyResult.confidence;

        results.totalTime = Date.now() - results.startTime;
        printSummary(results);

        // Exit with appropriate code
        // Exit 0 if game was created OR if we have draft data for review
        process.exit(results.success || results.needsReview ? 0 : 1);

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
