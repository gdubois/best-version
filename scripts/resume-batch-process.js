/**
 * Resume Batch Game Processor
 *
 * Resumes processing from a specified game index.
 *
 * Usage: node scripts/resume-batch-process.js [--start-at <index>]
 */

const fs = require('fs').promises;
const path = require('path');
const researchService = require('../src/services/game-creator/research');
const storageService = require('../src/services/game-creator/storage');
const imagesService = require('../src/services/game-creator/images');

const GAMES_DIR = path.join(__dirname, '../games');

// Parse command line arguments
const START_INDEX = process.argv.includes('--start-at')
    ? parseInt(process.argv[process.argv.indexOf('--start-at') + 1], 10)
    : 1;

/**
 * Get list of existing game files
 */
async function getExistingGames() {
    const files = await fs.readdir(GAMES_DIR);
    return files
        .filter(f => f.endsWith('.json') && f !== 'index.json')
        .map(f => f.replace('.json', ''))
        .sort();
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

    const newReception = newGame.basic_info?.reception_score;
    const oldReception = oldGame.basic_info?.reception_score;

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

    const newPlatforms = newGame.release?.platforms?.length || 0;
    const oldPlatforms = oldGame.release?.platforms?.length || 0;
    if (newPlatforms > oldPlatforms) {
        scores.new += (newPlatforms - oldPlatforms) * 0.5;
        reasons.new.push(`More platforms: ${newPlatforms} vs ${oldPlatforms}`);
    }

    const newPlayToday = newGame.play_today?.length || 0;
    const oldPlayToday = oldGame.play_today?.length || 0;
    if (newPlayToday > oldPlayToday) {
        scores.new += (newPlayToday - oldPlayToday) * 2;
        reasons.new.push(`More play_today options: ${newPlayToday} vs ${oldPlayToday}`);
    }

    const countPatches = (game) => {
        return game.play_today?.reduce((acc, pt) =>
            acc + (pt.recommended_patches?.length || 0), 0) || 0;
    };

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

    const newSimilar = newGame.similar_games?.length || 0;
    const oldSimilar = oldGame.similar_games?.length || 0;
    if (newSimilar > oldSimilar) {
        scores.new += (newSimilar - oldSimilar) * 0.5;
        reasons.new.push(`More similar games: ${newSimilar} vs ${oldSimilar}`);
    }

    if (newGame.description?.legacy_and_impact?.length > (oldGame.description?.legacy_and_impact?.length || 0)) {
        scores.new += 1;
        reasons.new.push('More legacy and impact information');
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

    if (oldGame.serie?.previous_game) {
        merged.serie.previous_game = oldGame.serie.previous_game;
    }
    if (oldGame.serie?.next_game) {
        merged.serie.next_game = oldGame.serie.next_game;
    }

    if (oldGame.play_today && newGame.play_today) {
        const platformMap = {};

        for (const pt of oldGame.play_today) {
            platformMap[pt.platform.toLowerCase()] = pt;
        }

        for (const pt of newGame.play_today) {
            const key = pt.platform.toLowerCase();
            if (platformMap[key]) {
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
    console.log('\n=== Resume Batch Game Processor ===\n');
    console.log(`Starting from game index: ${START_INDEX}`);
    console.log('');

    const games = await getExistingGames();
    console.log(`Total games: ${games.length}`);
    console.log(`Starting from: ${games[START_INDEX - 1] || 'N/A'}`);
    console.log('');

    const results = {
        processed: 0,
        improved: 0,
        skipped: 0,
        errors: 0,
        details: []
    };

    for (let i = START_INDEX - 1; i < games.length; i++) {
        const gameSlug = games[i];
        const title = getTitleFromSlug(gameSlug);
        const filePath = path.join(GAMES_DIR, `${gameSlug}.json`);

        console.log(`\n[${i + 1}/${games.length}] Processing: ${title}`);
        console.log('  Researching...');

        try {
            const researchResult = await researchService.researchGameWithAgent(title);

            if (researchResult.error) {
                console.log(`  Error: ${researchResult.error}`);
                results.errors++;
                results.details.push({ game: title, error: researchResult.error });
                continue;
            }

            console.log(`  Confidence: ${(researchResult.confidence * 100).toFixed(0)}%`);

            const { data: newGameData } = storageService.assembleGameData(researchResult);

            const existingContent = await fs.readFile(filePath, 'utf8');
            const oldGameData = JSON.parse(existingContent);

            const comparison = compareGames(oldGameData, newGameData);

            console.log(`  Comparison: New=${comparison.newScore.toFixed(1)} vs Old=${comparison.oldScore.toFixed(1)}`);

            let finalGameData = newGameData;

            if (comparison.winner === 'new') {
                finalGameData = mergeGames(oldGameData, newGameData, gameSlug);

                const reasons = comparison.reasons.new.slice(0, 3).join('; ');
                console.log(`  Improvement: ${reasons}`);

                console.log('  Fetching cover image...');
                await imagesService.fetchAndStoreCover(title, gameSlug);

                const newContent = JSON.stringify(finalGameData, null, 2);
                await fs.writeFile(filePath, newContent, 'utf8');

                console.log(`  Saved improved version`);
                results.improved++;

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

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

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

processGames().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
