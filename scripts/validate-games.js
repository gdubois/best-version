/**
 * Validate all game JSON files against the schema
 */

const fs = require('fs').promises;
const path = require('path');

const GAMES_DIR = path.join(__dirname, '../games');

// Schema constants
const VALID_GENRES = [
    'Action', 'Action RPG', 'Adventure', 'Fighting', 'FPS', 'JRPG',
    'Platform', 'Puzzle', 'Racing', 'RPG', 'Role-Playing Game (RPG)',
    'RTS', "Shoot 'em up", 'Simulator', 'Social Simulation', 'Sports',
    'Stealth', 'Strategy', 'Survival Horror', 'Tactical Role-Playing'
];

const VALID_REGIONS = ['Japan', 'North America', 'Europe', 'Australia', 'Asia', 'Brazil', 'World'];

const VALID_EMULATOR_PLATFORMS = ['Windows', 'Android', 'Linux', 'macOS'];

/**
 * Validate a single game file against the schema
 */
function validateGame(gameData, fileName) {
    const errors = [];
    const warnings = [];

    // Check basic_info
    if (!gameData.basic_info) {
        errors.push('Missing basic_info object');
    } else {
        const bi = gameData.basic_info;

        if (!bi.url_slug || typeof bi.url_slug !== 'string' || !bi.url_slug.startsWith('/games/')) {
            errors.push(`basic_info.url_slug is invalid: ${JSON.stringify(bi.url_slug)}`);
        }

        if (!bi.title || typeof bi.title !== 'string') {
            errors.push('basic_info.title is missing or invalid');
        }

        if (!bi.genres || !Array.isArray(bi.genres) || bi.genres.length === 0) {
            errors.push('basic_info.genres is missing or empty');
        } else {
            for (const genre of bi.genres) {
                if (!VALID_GENRES.includes(genre)) {
                    errors.push(`Invalid genre: "${genre}" (must be one of: ${VALID_GENRES.join(', ')})`);
                }
            }
        }

        if (bi.modes && typeof bi.modes !== 'object') {
            errors.push('basic_info.modes must be an object');
        }

        if (bi.reception_score !== undefined) {
            if (typeof bi.reception_score !== 'number' || bi.reception_score < 1.0 || bi.reception_score > 10.0) {
                errors.push(`basic_info.reception_score must be a float between 1.0 and 10.0, got: ${bi.reception_score}`);
            }
        }

        if (!bi.developers || !Array.isArray(bi.developers) || bi.developers.length === 0) {
            errors.push('basic_info.developers is missing or empty');
        }

        if (!bi.publishers || !Array.isArray(bi.publishers) || bi.publishers.length === 0) {
            errors.push('basic_info.publishers is missing or empty');
        }
    }

    // Check release
    if (!gameData.release) {
        errors.push('Missing release object');
    } else {
        const rel = gameData.release;

        if (!rel.platforms || !Array.isArray(rel.platforms) || rel.platforms.length === 0) {
            errors.push('release.platforms is missing or empty');
        } else {
            for (const plat of rel.platforms) {
                if (!plat.name || typeof plat.name !== 'string') {
                    errors.push('Platform missing name');
                }
                if (!plat.region || !VALID_REGIONS.includes(plat.region)) {
                    errors.push(`Invalid platform region: "${plat.region}" (must be one of: ${VALID_REGIONS.join(', ')})`);
                }
                if (!plat.release_date || !/^\d{4}-\d{2}-\d{2}$/.test(plat.release_date)) {
                    errors.push(`Invalid platform release_date: "${plat.release_date}" (must be YYYY-MM-DD)`);
                }
            }
        }
    }

    // Check serie
    if (gameData.serie) {
        const serie = gameData.serie;
        if (typeof serie.is_part_of_serie !== 'boolean') {
            errors.push('serie.is_part_of_serie must be a boolean');
        }
        if (typeof serie.serie_name !== 'string') {
            errors.push('serie.serie_name must be a string');
        }
        if (serie.part_number === undefined || typeof serie.part_number !== 'number' || serie.part_number < 1) {
            errors.push('serie.part_number must be a positive integer >= 1');
        }
    }

    // Check similar_games
    if (gameData.similar_games && !Array.isArray(gameData.similar_games)) {
        errors.push('similar_games must be an array');
    } else if (gameData.similar_games) {
        for (const sg of gameData.similar_games) {
            if (!sg.title || !sg.url_slug) {
                errors.push('similar_games entry missing title or url_slug');
            }
        }
    }

    // Check play_today
    if (!gameData.play_today || !Array.isArray(gameData.play_today)) {
        errors.push('play_today is missing or not an array');
    } else {
        for (const pt of gameData.play_today) {
            if (!pt.platform || typeof pt.platform !== 'string') {
                errors.push('play_today entry missing platform');
            }
            if (!pt.details || typeof pt.details !== 'string') {
                errors.push('play_today entry missing details');
            }
            if (!pt.available_in_english || typeof pt.available_in_english !== 'object') {
                errors.push('play_today entry missing available_in_english object');
            }
            if (pt.recommended_patches && !Array.isArray(pt.recommended_patches)) {
                errors.push('play_today.recommended_patches must be an array');
            } else if (pt.recommended_patches) {
                for (const patch of pt.recommended_patches) {
                    if (!patch.name || !patch.description) {
                        errors.push('Patch missing name or description');
                    }
                }
            }
            if (pt.emulators && !Array.isArray(pt.emulators)) {
                errors.push('play_today.emulators must be an array');
            } else if (pt.emulators) {
                for (const emu of pt.emulators) {
                    if (!VALID_EMULATOR_PLATFORMS.includes(emu.platform)) {
                        errors.push(`Invalid emulator platform: "${emu.platform}" (must be one of: ${VALID_EMULATOR_PLATFORMS.join(', ')})`);
                    }
                    if (!emu.recommended_emulator) {
                        errors.push('Emulator missing recommended_emulator');
                    }
                    if (!emu.optimal_settings || !Array.isArray(emu.optimal_settings) || emu.optimal_settings.length === 0) {
                        errors.push('Emulator missing optimal_settings');
                    }
                }
            }
        }
    }

    // Check description
    if (!gameData.description) {
        errors.push('Missing description object');
    } else {
        const desc = gameData.description;
        if (!desc.synopsis || typeof desc.synopsis !== 'string') {
            errors.push('description.synopsis is missing or invalid');
        }
        if (!desc.long_description || typeof desc.long_description !== 'string') {
            errors.push('description.long_description is missing or invalid');
        }
        if (!desc.key_features || !Array.isArray(desc.key_features) || desc.key_features.length === 0) {
            errors.push('description.key_features is missing or empty');
        }
        if (!desc.legacy_and_impact || !Array.isArray(desc.legacy_and_impact) || desc.legacy_and_impact.length === 0) {
            warnings.push('description.legacy_and_impact is missing or empty');
        }
    }

    // Check that basic_info.url_slug matches filename
    const fileNameSlug = fileName.replace('.json', '');
    const expectedUrlSlug = `/games/${fileNameSlug}`;
    if (gameData.basic_info?.url_slug && gameData.basic_info.url_slug !== expectedUrlSlug) {
        errors.push(`url_slug mismatch: file is "${fileNameSlug}" but url_slug is "${gameData.basic_info.url_slug}"`);
    }

    return { errors, warnings };
}

/**
 * Main validation function
 */
async function validateAllGames() {
    console.log('\n=== Validating Game JSON Files ===\n');

    const files = await fs.readdir(GAMES_DIR);
    const gameFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');

    const results = {
        valid: [],
        invalid: [],
        warnings: []
    };

    for (const file of gameFiles) {
        const filePath = path.join(GAMES_DIR, file);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const gameData = JSON.parse(content);

            const { errors, warnings } = validateGame(gameData, file);

            if (errors.length > 0) {
                results.invalid.push({
                    file,
                    errors,
                    warnings
                });
            } else if (warnings.length > 0) {
                results.warnings.push({
                    file,
                    warnings
                });
            } else {
                results.valid.push(file);
            }

        } catch (error) {
            results.invalid.push({
                file,
                errors: [`JSON parse error: ${error.message}`],
                warnings: []
            });
        }
    }

    // Print results
    console.log(`Valid: ${results.valid.length}`);
    console.log(`With warnings: ${results.warnings.length}`);
    console.log(`Invalid: ${results.invalid.length}`);

    if (results.invalid.length > 0) {
        console.log('\n=== INVALID FILES ===\n');
        for (const item of results.invalid) {
            console.log(`\n${item.file}:`);
            for (const error of item.errors) {
                console.log(`  ERROR: ${error}`);
            }
            for (const warn of item.warnings) {
                console.log(`  WARNING: ${warn}`);
            }
        }
    }

    if (results.warnings.length > 0) {
        console.log('\n=== FILES WITH WARNINGS ===\n');
        for (const item of results.warnings) {
            console.log(`${item.file}:`);
            for (const warn of item.warnings) {
                console.log(`  WARNING: ${warn}`);
            }
        }
    }

    return results;
}

validateAllGames().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
