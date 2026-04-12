/**
 * Fix all game JSON files to comply with the schema
 */

const fs = require('fs').promises;
const path = require('path');

const GAMES_DIR = path.join(__dirname, '../games');

const VALID_REGIONS = ['Japan', 'North America', 'Europe', 'Australia', 'Asia', 'Brazil', 'World'];

/**
 * Fix a single game file
 */
function fixGame(gameData, fileName) {
    const fixes = [];
    const fixedData = JSON.parse(JSON.stringify(gameData));

    // Fix url_slug to match filename
    const fileNameSlug = fileName.replace('.json', '');
    const expectedUrlSlug = `/games/${fileNameSlug}`;
    if (fixedData.basic_info?.url_slug !== expectedUrlSlug) {
        fixedData.basic_info.url_slug = expectedUrlSlug;
        fixes.push(`Fixed url_slug: "${gameData.basic_info.url_slug}" -> "${expectedUrlSlug}"`);
    }

    // Fix platform regions: "Worldwide" -> "World"
    if (fixedData.release?.platforms) {
        for (const plat of fixedData.release.platforms) {
            if (plat.region === 'Worldwide') {
                plat.region = 'World';
                fixes.push(`Fixed platform region: "Worldwide" -> "World" for ${plat.name}`);
            }
        }
    }

    // Fix serie fields if invalid
    if (fixedData.serie) {
        if (!fixedData.serie.serie_name || typeof fixedData.serie.serie_name !== 'string') {
            fixedData.serie.serie_name = '';
            fixes.push('Fixed serie.serie_name: set to empty string');
        }
        if (!fixedData.serie.part_number || fixedData.serie.part_number < 1) {
            fixedData.serie.part_number = 1;
            fixes.push('Fixed serie.part_number: set to 1');
        }
    }

    return { fixedData, fixes };
}

/**
 * Main fix function
 */
async function fixAllGames() {
    console.log('\n=== Fixing Game JSON Files ===\n');

    const files = await fs.readdir(GAMES_DIR);
    const gameFiles = files.filter(f => f.endsWith('.json') && f !== 'index.json');

    const results = {
        fixed: 0,
        unchanged: 0,
        errors: 0
    };

    for (const file of gameFiles) {
        const filePath = path.join(GAMES_DIR, file);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const gameData = JSON.parse(content);

            const { fixedData, fixes } = fixGame(gameData, file);

            if (fixes.length > 0) {
                console.log(`\n${file}:`);
                for (const fix of fixes) {
                    console.log(`  ${fix}`);
                }

                // Write the fixed data
                await fs.writeFile(filePath, JSON.stringify(fixedData, null, 2), 'utf8');
                results.fixed++;
            } else {
                results.unchanged++;
            }

        } catch (error) {
            console.log(`\n${file}: ERROR - ${error.message}`);
            results.errors++;
        }
    }

    console.log('\n=== Summary ===\n');
    console.log(`Fixed: ${results.fixed}`);
    console.log(`Unchanged: ${results.unchanged}`);
    console.log(`Errors: ${results.errors}`);
    console.log('\n=== Complete ===\n');
}

fixAllGames().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
