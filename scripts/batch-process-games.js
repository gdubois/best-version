/**
 * Batch Game Processor
 *
 * Processes all existing games through the game creator pipeline,
 * compares results with existing files, and replaces with better versions.
 *
 * Usage: node scripts/batch-process-games.js [--game <title>] [--dry-run]
 */

const fs = require('fs').promises;
const path = require('path');
const researchService = require('../src/services/game-creator/research');
// Skip validation - existing files are already validated
const storageService = require('../src/services/game-creator/storage');
const imagesService = require('../src/services/game-creator/images');
const { createLogger } = require('../src/services/game-creator/logger');

const logger = createLogger('batch-processor', { redactApiKey: false });

// Configuration
const GAMES_DIR = path.join(__dirname, '../games');
const REPLACE_IF_BETTER = true;
const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE_GAME = process.argv.includes('--game')
    ? process.argv[process.argv.indexOf('--game') + 1]
    : null;

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        game: null,
        dryRun: false
    };

    for (let i = 2; i < process.argv.length; i++) {
        if (process.argv[i] === '--game' && process.argv[i + 1]) {
            args.game = process.argv[i + 1];
            i++;
        } else if (process.argv[i] === '--dry-run') {
            args.dryRun = true;
        }
    }

    return args;
}

/**
 * Get list of existing game files
 */
async function getExistingGames() {
    const files = await fs.readdir(GAMES_DIR);
    const gameFiles = files
        .filter(f => f.endsWith('.json') && f !== 'index.json')
        .map(f => f.replace('.json', ''));

    if (SINGLE_GAME) {
        return gameFiles.filter(f =>
            f.includes(SINGLE_GAME.toLowerCase().replace(/\s+/g, '-'))
        );
    }

    return gameFiles;
}

/**
 * Extract game title from filename
 */
function getTitleFromSlug(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Compare two game files and determine which is better
 */
function compareGames(oldGame, newGame) {
    const scores = { old: 0, new: 0 };
    const reasons = { old: [], new: [] };

    // Check basic_info completeness
    const newReception = newGame.basic_info?.reception_score;
    const oldReception = oldGame.basic_info?.reception_score;

    // Reception score should be a float between 1.0 and 10.0
    if (newReception && typeof newReception === 'number' && newReception >= 1.0 && newReception <= 10.0) {
        if (!oldReception || typeof oldReception !== 'number') {
            scores.new += 2;
            reasons.new.push('Has valid reception score (float)');
        }
    }

    if (newGame.basic_info?.review && !oldGame.basic_info?.review) {
        scores.new += 2;
        reasons.new.push('Has review');
    }

    // Check platforms
    const newPlatforms = newGame.release?.platforms?.length || 0;
    const oldPlatforms = oldGame.release?.platforms?.length || 0;
    if (newPlatforms > oldPlatforms) {
        scores.new += (newPlatforms - oldPlatforms) * 0.5;
        reasons.new.push(`More platforms: ${newPlatforms} vs ${oldPlatforms}`);
    }

    // Check play_today entries
    const newPlayToday = newGame.play_today?.length || 0;
    const oldPlayToday = oldGame.play_today?.length || 0;
    if (newPlayToday > oldPlayToday) {
        scores.new += (newPlayToday - oldPlayToday) * 2;
        reasons.new.push(`More play_today options: ${newPlayToday} vs ${oldPlayToday}`);
    }

    // Check patches quality (presence and ordering)
    const countPatches = (game) => {
        return game.play_today?.reduce((acc, pt) =>
            acc + (pt.recommended_patches?.length || 0), 0) || 0;
    };

    const newPatches = countPatches(newGame);
    const oldPatches = countPatches(oldGame);

    // Prefer having patches with URLs
    const patchesWithUrls = (game) => {
        return game.play_today?.reduce((acc, pt) =>
            acc + (pt.recommended_patches?.filter(p => p.url)?.length || 0), 0) || 0;
    };

    const newPatchesWithUrls = patchesWithUrls(newGame);
    const oldPatchesWithUrls = patchesWithUrls(oldGame);

    if (newPatchesWithUrls > oldPatchesWithUrls) {
        scores.new += (newPatchesWithUrls - oldPatchesWithUrls) * 1.5;
        reasons.new.push(`More patches with URLs: ${newPatchesWithUrls} vs ${oldPatchesWithUrls}`);
    }

    // Check similar_games
    const newSimilar = newGame.similar_games?.length || 0;
    const oldSimilar = oldGame.similar_games?.length || 0;
    if (newSimilar > oldSimilar) {
        scores.new += (newSimilar - oldSimilar) * 0.5;
        reasons.new.push(`More similar games: ${newSimilar} vs ${oldSimilar}`);
    }

    // Check description completeness
    if (newGame.description?.legacy_and_impact?.length > (oldGame.description?.legacy_and_impact?.length || 0)) {
        scores.new += 1;
        reasons.new.push('More legacy and impact information');
    }

    // Check for extra fields in old that new doesn't have
    const extraOldFields = ['previous_game', 'next_game', 'fan_translation', 'retro_achievements_support'];
    for (const field of extraOldFields) {
        if (oldGame.serie?.[field] && !newGame.serie?.[field]) {
            scores.old += 0.5;
            reasons.old.push(`Has serie.${field}`);
        }
    }

    return {
        winner: scores.new > scores.old ? 'new' : 'old',
        newScore: scores.new,
        oldScore: scores.old,
        reasons: reasons
    };
}

/**
 * Merge best fields from both old and new game files
 * @param {Object} oldGame - Existing game data
 * @param {Object} newGame - Newly researched game data
 * @param {string} gameSlug - The filename slug (without /games/ prefix)
 * @returns {Object} Merged game data with url_slug enforced
 */
function mergeGames(oldGame, newGame, gameSlug) {
    const merged = JSON.parse(JSON.stringify(newGame));

    // ENFORCE: Ensure basic_info.url_slug matches the filename
    merged.basic_info.url_slug = `/games/${gameSlug}`;

    // Preserve serie relationships from old if they exist
    if (oldGame.serie?.previous_game) {
        merged.serie.previous_game = oldGame.serie.previous_game;
    }
    if (oldGame.serie?.next_game) {
        merged.serie.next_game = oldGame.serie.next_game;
    }

    // Merge play_today entries - keep those with more detailed patches
    if (oldGame.play_today && newGame.play_today) {
        const platformMap = {};

        // Add old entries
        for (const pt of oldGame.play_today) {
            platformMap[pt.platform.toLowerCase()] = pt;
        }

        // Merge with new entries
        for (const pt of newGame.play_today) {
            const key = pt.platform.toLowerCase();
            if (platformMap[key]) {
                // Merge patches - keep unique ones
                const oldPatches = platformMap[key].recommended_patches || [];
                const newPatches = pt.recommended_patches || [];

                const mergedPatches = [...newPatches];
                for (const oldPatch of oldPatches) {
                    if (!mergedPatches.find(p => p.name === oldPatch.name)) {
                        mergedPatches.push(oldPatch);
                    }
                }
                pt.recommended_patches = mergedPatches;
            }
            platformMap[key] = pt;
        }

        merged.play_today = Object.values(platformMap);
    }

    return merged;
}

/**
 * Main processing function
 */
async function processGames() {
    const args = parseArgs();
    const isDryRun = args.dryRun;

    console.log('\n=== Batch Game Processor ===\n');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no files will be modified)' : 'LIVE'}`);
    console.log(`Target: ${SINGLE_GAME ? SINGLE_GAME : 'All games'}`);
    console.log('');

    const games = await getExistingGames();
    console.log(`Found ${games.length} game(s) to process:\n`);
    games.forEach(g => console.log(`  - ${g}`));
    console.log('');

    const results = {
        processed: 0,
        improved: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    for (const gameSlug of games) {
        const title = getTitleFromSlug(gameSlug);
        const filePath = path.join(GAMES_DIR, `${gameSlug}.json`);

        console.log(`\n[${++results.processed}/${games.length}] Processing: ${title}`);
        console.log('  Researching...');

        try {
            // Step 1: Research the game
            const researchResult = await researchService.researchGameWithAgent(title);

            if (researchResult.error) {
                console.log(`  Error: ${researchResult.error}`);
                results.errors++;
                results.details.push({ game: title, error: researchResult.error });
                continue;
            }

            console.log(`  Confidence: ${(researchResult.confidence * 100).toFixed(0)}%`);

            // Step 2: Assemble the game data
            const { data: newGameData } = storageService.assembleGameData(researchResult);

            // Step 4: Read existing game file
            const existingContent = await fs.readFile(filePath, 'utf8');
            const oldGameData = JSON.parse(existingContent);

            // Step 5: Compare games
            const comparison = compareGames(oldGameData, newGameData);

            console.log(`  Comparison: New=${comparison.newScore.toFixed(1)} vs Old=${comparison.oldScore.toFixed(1)}`);

            let finalGameData = newGameData;

            if (comparison.winner === 'new') {
                // Merge best of both
                finalGameData = mergeGames(oldGameData, newGameData, gameSlug);

                const reasons = comparison.reasons.new.slice(0, 3).join('; ');
                console.log(`  Improvement: ${reasons}`);

                if (!DRY_RUN) {
                    // Step 6: Fetch and store cover image
                    console.log('  Fetching cover image...');
                    await imagesService.fetchAndStoreCover(title, gameSlug);

                    // Step 7: Save the improved game
                    const newContent = JSON.stringify(finalGameData, null, 2);
                    await fs.writeFile(filePath, newContent, 'utf8');

                    console.log(`  Saved improved version`);
                    results.improved++;
                } else {
                    console.log(`  [DRY RUN] Would save improved version`);
                    results.improved++;
                }

                results.details.push({
                    game: title,
                    action: 'improved',
                    comparison: comparison
                });
            } else {
                console.log(`  Existing version is better or equal - skipping`);
                results.skipped++;
                results.details.push({
                    game: title,
                    action: 'skipped',
                    comparison: comparison
                });
            }

        } catch (error) {
            console.log(`  Error: ${error.message}`);
            results.errors++;
            results.details.push({ game: title, error: error.message });
        }

        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log('\n=== Summary ===\n');
    console.log(`Processed: ${results.processed}`);
    console.log(`Improved: ${results.improved}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);

    if (results.details.length > 0) {
        console.log('\n=== Details ===\n');
        for (const detail of results.details) {
            if (detail.error) {
                console.log(`${detail.game}: ERROR - ${detail.error}`);
            } else {
                console.log(`${detail.game}: ${detail.action.toUpperCase()}`);
                if (detail.comparison) {
                    const reasons = detail.comparison.reasons.new.slice(0, 2);
                    if (reasons.length > 0) {
                        console.log(`  Reasons: ${reasons.join('; ')}`);
                    }
                }
            }
        }
    }

    console.log('\n=== Complete ===\n');
}

// Run the processor
processGames().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
