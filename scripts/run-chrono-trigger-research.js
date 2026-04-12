/**
 * Chrono Trigger Research Pipeline
 *
 * Runs the game research agent pipeline for Chrono Trigger and outputs:
 * 1. The generated JSON data to a new file (chrono-trigger-researched.json)
 * 2. Fetches and stores the cover image
 * 3. Displays a comparison with the existing file
 *
 * This does NOT overwrite the existing chrono-trigger.json file.
 */

const fs = require('fs').promises;
const path = require('path');
const { researchGameWithAgent } = require('../src/services/game-creator/agent');
const imagesService = require('../src/services/game-creator/images');

const GAME_TITLE = 'Chrono Trigger';
const OUTPUT_DIR = path.join(__dirname, '../temp');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'chrono-trigger-researched.json');

// Ensure temp directory exists
async function ensureTempDir() {
    try {
        await fs.access(OUTPUT_DIR);
    } catch {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log('Created temp directory:', OUTPUT_DIR);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(70));
    console.log('Chrono Trigger Research Pipeline');
    console.log('='.repeat(70));
    console.log();

    await ensureTempDir();

    // Step 1: Run agent research
    console.log('[1/4] Starting agent research for:', GAME_TITLE);
    console.log('      Using Open WebSearch MCP for web search...');
    console.log();

    const researchStart = Date.now();
    const researchResult = await researchGameWithAgent(GAME_TITLE);
    const researchTime = Date.now() - researchStart;

    if (!researchResult.success) {
        console.error('Research failed:', researchResult.error);
        process.exit(1);
    }

    console.log('Research completed in', Math.round(researchTime / 1000), 'seconds');
    console.log('Confidence score:', researchResult.confidence.toFixed(2));
    console.log('Queries executed:', researchResult.queriesExecuted?.length || 0);
    console.log('Source URLs found:', researchResult.sourceUrls?.length || 0);
    console.log();

    // Step 2: Get game data directly from LLM output
    // The LLM now outputs the correct schema-compliant format directly
    console.log('[2/4] Processing game data...');

    // The metadata field contains the LLM output which is already in correct format
    const gameData = researchResult.metadata;

    // Generate slug from title
    const slug = '/games/' + GAME_TITLE
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    console.log('Generated slug:', slug);
    console.log();

    // Step 3: Fetch and store cover image
    console.log('[3/4] Fetching cover image...');
    const imageResult = await imagesService.fetchAndStoreCover(GAME_TITLE, slug);

    if (imageResult.found) {
        console.log('Cover image found and stored!');
        console.log('  Source:', imageResult.source);
        console.log('  Path:', imageResult.path);
        console.log('  URL:', imageResult.url);
    } else {
        console.log('Cover image not found:', imageResult.reason);
    }
    console.log();

    // Step 4: Save research results to output file
    console.log('[4/4] Saving research results...');

    const outputData = {
        metadata: gameData,
        research: {
            confidence: researchResult.confidence,
            queriesExecuted: researchResult.queriesExecuted || [],
            sourceUrls: researchResult.sourceUrls || [],
            duration: researchTime,
            timestamp: new Date().toISOString()
        },
        image: {
            found: imageResult.found,
            source: imageResult.source,
            url: imageResult.url,
            path: imageResult.path
        }
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');
    console.log('Results saved to:', OUTPUT_FILE);
    console.log();

    // Display summary
    console.log('='.repeat(70));
    console.log('RESEARCH SUMMARY');
    console.log('='.repeat(70));
    console.log();

    // Extract key info from generated data
    const playToday = gameData.play_today || [];
    console.log('Best way to play today:');
    playToday.forEach((pt, i) => {
        console.log(`  ${i + 1}. ${pt.platform}: ${pt.details?.substring(0, 100)}...`);
    });
    console.log();

    // Check for patches
    let totalPatches = 0;
    playToday.forEach(pt => {
        totalPatches += (pt.recommended_patches?.length || 0);
    });
    console.log('Recommended patches found:', totalPatches);
    console.log();

    // Compare with existing file
    const existingFile = path.join(__dirname, '../games/chrono-trigger.json');
    try {
        const existing = JSON.parse(await fs.readFile(existingFile, 'utf8'));
        console.log('Existing file comparison:');
        console.log('  Existing play_today entries:', (existing.play_today?.length || 0));
        console.log('  New play_today entries:', playToday.length);
        console.log();

        // Count patch differences
        const existingPatches = existing.play_today?.reduce((acc, pt) => acc + (pt.recommended_patches?.length || 0), 0) || 0;
        console.log('  Existing patches:', existingPatches);
        console.log('  New patches:', totalPatches);

        if (totalPatches > existingPatches) {
            console.log('  → New research found MORE patches!');
        } else if (totalPatches < existingPatches) {
            console.log('  → Existing file has MORE patches');
        } else {
            console.log('  → Same number of patches');
        }
    } catch (error) {
        console.log('Could not read existing file for comparison');
    }

    console.log();
    console.log('='.repeat(70));
    console.log('DONE!');
    console.log('='.repeat(70));
    console.log();
    console.log('Output file:', OUTPUT_FILE);
    console.log('The existing chrono-trigger.json was NOT modified.');
}

// Run
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
