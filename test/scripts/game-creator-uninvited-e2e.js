/**
 * E2E Test for Game Creator - "Uninvited"
 *
 * This script runs the complete game creation pipeline for the game "Uninvited"
 * to prove the Game Creator agent works end-to-end.
 */

const { researchGameWithLLM } = require('../../src/services/game-creator/research');
const { validateMetadata } = require('../../src/services/game-creator/validation');
const { assembleGameData, saveGame } = require('../../src/services/game-creator/storage');
const { fetchAndStoreCover } = require('../../src/services/game-creator/images');
const { getConfig } = require('../../src/services/game-creator/llmClient');

async function runE2ETest() {
    const GAME_TITLE = 'Uninvited';

    console.log('='.repeat(70));
    console.log('GAME CREATOR E2E TEST - "Uninvited"');
    console.log('='.repeat(70));
    console.log();

    // Step 1: Configuration Check
    console.log('Step 1: Configuration Check');
    console.log('-'.repeat(70));
    const config = getConfig();
    console.log(`  Endpoint: ${config.endpoint}`);
    console.log(`  Model: ${config.model}`);
    console.log(`  API Type: ${config.apiType}`);
    console.log(`  Timeout: ${config.timeout}ms`);
    console.log(`  Temperature: ${config.temperature}`);
    console.log();

    if (config.apiType !== 'openai') {
        console.error('ERROR: API Type should be "openai" for /v1/chat/completions endpoint');
        process.exit(1);
    }
    console.log('  Configuration validated successfully');
    console.log();

    // Step 2: Research with Agent
    console.log('Step 2: Research with Agent');
    console.log('-'.repeat(70));
    console.log(`  Researching game: "${GAME_TITLE}"`);

    const researchStart = Date.now();
    const researchResult = await researchGameWithLLM(GAME_TITLE);
    const researchDuration = Date.now() - researchStart;

    console.log(`  Research duration: ${researchDuration}ms`);
    console.log(`  Confidence: ${researchResult.confidence}`);

    if (researchResult.error) {
        console.error('  Error:', researchResult.error);
        console.error('  Failed to research game');
        process.exit(1);
    }

    console.log(`  Source URLs: ${researchResult.sources?.length || 0} found`);
    console.log();

    // Display metadata
    console.log('  Extracted Metadata:');
    const metadata = researchResult;
    console.log(`    Title: ${metadata.title}`);
    console.log(`    Genres: ${metadata.genres?.join(', ') || 'N/A'}`);
    console.log(`    Platforms: ${metadata.platforms?.join(', ') || 'N/A'}`);
    console.log(`    Release Date: ${metadata.releaseDate || 'N/A'}`);
    console.log(`    Developers: ${metadata.developers?.join(', ') || 'N/A'}`);
    console.log(`    Publishers: ${metadata.publishers?.join(', ') || 'N/A'}`);
    console.log(`    Description length: ${metadata.description?.length || 0} chars`);
    console.log();

    // Step 3: Storage Assembly
    console.log('Step 3: Storage Assembly');
    console.log('-'.repeat(70));
    const assembled = assembleGameData(metadata, researchResult);
    console.log(`  Slug: ${assembled.slug}`);
    console.log(`  Data structure valid: ${!!assembled.data}`);

    // Debug: Show platforms structure
    console.log('  Platforms structure:');
    if (assembled.data?.release?.platforms) {
        assembled.data.release.platforms.slice(0, 3).forEach((p, i) => {
            console.log(`    [${i}] name: "${p.name}", region: "${p.region}", release_date: "${p.release_date}"`);
        });
        if (assembled.data.release.platforms.length > 3) {
            console.log(`    ... and ${assembled.data.release.platforms.length - 3} more`);
        }
    }

    // Step 4: Validation (validate assembled data, not raw metadata)
    console.log();
    console.log('Step 4: Validation');
    console.log('-'.repeat(70));
    const validation = validateMetadata(assembled.data);
    console.log(`  Valid: ${validation.valid}`);
    console.log(`  Confidence Score: ${validation.confidenceScore}`);
    console.log(`  Recommendation: ${validation.recommendation}`);
    console.log(`  Issues: ${validation.issues?.length || 0}`);

    if (validation.issues && validation.issues.length > 0) {
        console.log('  Issue details (with field paths):');
        validation.issues.slice(0, 5).forEach(issue => {
            console.log(`    - Field: ${issue.field}, Message: ${issue.message}`);
        });
        if (validation.issues.length > 5) {
            console.log(`    ... and ${validation.issues.length - 5} more issues`);
        }
    }
    console.log();

    if (assembled.data) {
        console.log(`    basic_info.title: ${assembled.data.basic_info?.title || 'N/A'}`);
        console.log(`    basic_info.genres: ${assembled.data.basic_info?.genres?.join(', ') || 'N/A'}`);
        console.log(`    description.synopsis length: ${assembled.data.description?.synopsis?.length || 0} chars`);
    }
    console.log();

    // Step 5: Image Fetch
    console.log('Step 5: Image Fetch');
    console.log('-'.repeat(70));
    const imageStart = Date.now();
    const imageResult = await fetchAndStoreCover(GAME_TITLE, assembled.slug);
    const imageDuration = Date.now() - imageStart;

    console.log(`  Image fetch duration: ${imageDuration}ms`);
    console.log(`  Success: ${imageResult.success}`);
    console.log(`  Found: ${imageResult.found}`);

    if (imageResult.found) {
        console.log(`  Path: ${imageResult.path}`);
        console.log(`  URL: ${imageResult.url}`);
        console.log(`  Source: ${imageResult.source}`);
    } else {
        console.log(`  Reason: ${imageResult.reason}`);
    }
    console.log();

    // Step 6: Save Game
    console.log('Step 6: Save Game');
    console.log('-'.repeat(70));
    const saveStart = Date.now();
    const saveResult = await saveGame(assembled.slug, assembled.data);
    const saveDuration = Date.now() - saveStart;

    console.log(`  Save duration: ${saveDuration}ms`);
    console.log(`  Success: ${!!saveResult.filePath}`);
    console.log(`  Slug: ${saveResult.slug}`);
    console.log(`  File path: ${saveResult.filePath}`);
    console.log(`  Title: ${saveResult.title}`);
    console.log();

    // Final Summary
    console.log('='.repeat(70));
    console.log('E2E TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`  Game: ${GAME_TITLE}`);
    console.log(`  Research: ${!researchResult.error ? 'PASS' : 'FAIL'} (${researchDuration}ms)`);
    console.log(`  Validation: ${validation.valid ? 'PASS' : 'FAIL'} (confidence: ${validation.confidenceScore})`);
    console.log(`  Assembly: ${assembled.slug ? 'PASS' : 'FAIL'}`);
    console.log(`  Image: ${imageResult.found ? 'FOUND' : 'NOT FOUND'} (${imageDuration}ms)`);
    console.log(`  Save: ${saveResult.filePath ? 'PASS' : 'FAIL'} (${saveDuration}ms)`);
    console.log();

    const totalDuration = researchDuration + imageDuration + saveDuration;
    console.log(`  Total Duration: ${totalDuration}ms`);
    console.log();

    // Overall result
    const allPassed = !researchResult.error && validation.valid && assembled.slug && saveResult.filePath;

    if (allPassed) {
        console.log('  OVERALL: SUCCESS ✓');
        console.log();
        console.log('The Game Creator agent successfully processed "Uninvited" end-to-end!');
        process.exit(0);
    } else {
        console.log('  OVERALL: FAILED ✗');
        console.log();
        console.log('Some steps failed. Check the output above for details.');
        process.exit(1);
    }
}

// Run the E2E test
runE2ETest().catch(error => {
    console.error('FATAL ERROR:', error);
    process.exit(1);
});
