/**
 * Fetch cover image for Legend of Mana
 * Source: Wikipedia Commons
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const IMAGES_PATH = path.join(__dirname, 'images');

console.log('Fetching cover image for Legend of Mana...');
console.log('Source: Wikipedia (File:Legend of Mana.jpg)');
console.log('');

async function ensureImagesDir() {
    try {
        await fs.access(IMAGES_PATH);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(IMAGES_PATH, { recursive: true });
            console.log('Created images directory');
        }
    }
}

async function downloadImage(url, outputPath) {
    console.log(`Downloading from: ${url}`);

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        await fs.writeFile(outputPath, response.data);

        const stat = await fs.stat(outputPath);
        console.log(`Image saved: ${outputPath}`);
        console.log(`Size: ${stat.size} bytes`);

        return { success: true, path: outputPath, size: stat.size };
    } catch (error) {
        console.error(`Download failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    await ensureImagesDir();

    // Wikipedia Commons image
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/en/0/09/Legend_of_Mana.jpg';
    const outputPath = path.join(IMAGES_PATH, 'legend-of-mana.jpg');

    // Check if already exists
    try {
        await fs.access(outputPath);
        console.log(`Image already exists: ${outputPath}`);
        const stat = await fs.stat(outputPath);
        console.log(`Size: ${stat.size} bytes`);
        return;
    } catch (error) {
        // File doesn't exist, continue to download
    }

    const result = await downloadImage(imageUrl, outputPath);

    if (result.success) {
        console.log('');
        console.log('✓ Image downloaded successfully!');
        console.log(`  Path: ${result.path}`);
        console.log(`  Size: ${result.size} bytes`);
        console.log(`  URL: /images/legend-of-mana.jpg`);
    } else {
        console.log('');
        console.log('✗ Download failed');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
