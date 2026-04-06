// Image optimization service
// Story 6.6: Performance Optimization

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ImageService {
  constructor(options = {}) {
    this.options = {
      // ImageMagick / GraphicsMagick preference
      useImageMagick: options.useImageMagick !== false,
      // Output formats
      outputFormats: options.outputFormats || ['webp', 'avif'],
      // Quality settings
      quality: options.quality || 80,
      // Thumbnail sizes
      thumbnails: options.thumbnails || {
        small: { width: 150, height: 200 },
        medium: { width: 300, height: 400 },
        large: { width: 600, height: 800 }
      },
      // Cache directory for optimized images
      cacheDir: options.cacheDir || 'public/images/cache',
      // Lazy loading placeholder
      placeholder: options.placeholder || 'data:image/svg+xml,...'
    };

    // Ensure cache directory exists
    if (!fs.existsSync(this.options.cacheDir)) {
      fs.mkdirSync(this.options.cacheDir, { recursive: true });
    }

    // Check for ImageMagick availability
    this.hasImageMagick = false;
    this.hasGraphicsMagick = false;
    this.hasSharp = false;

    this.checkImageTools();
  }

  /**
   * Check for available image processing tools
   */
  async checkImageTools() {
    try {
      // Check for ImageMagick
      try {
        await execAsync('convert -version');
        this.hasImageMagick = true;
      } catch (e) {
        // Not installed
      }

      // Check for GraphicsMagick
      try {
        await execAsync('gm -version');
        this.hasGraphicsMagick = true;
      } catch (e) {
        // Not installed
      }

      // Check for sharp (Node.js library)
      try {
        require.resolve('sharp');
        this.hasSharp = true;
      } catch (e) {
        // Not installed
      }

      console.log(`Image tools available: ImageMagick=${this.hasImageMagick}, GraphicsMagick=${this.hasGraphicsMagick}, Sharp=${this.hasSharp}`);
    } catch (error) {
      console.error('Error checking image tools:', error.message);
    }
  }

  /**
   * Optimize an image file
   * @param {string} inputPath - Path to input image
   * @param {object} options - Optimization options
   * @returns {object} - Result with paths to optimized images
   */
  async optimizeImage(inputPath, options = {}) {
    const finalOptions = { ...this.options, ...options };

    // Check if image exists
    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        error: `Image not found: ${inputPath}`
      };
    }

    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const outputDir = path.dirname(inputPath);

    const results = {
      original: inputPath,
      optimized: [],
      thumbnails: {}
    };

    // Convert to WebP/AVIF using available tools
    if (this.hasSharp) {
      await this.optimizeWithSharp(inputPath, finalOptions, results);
    } else if (this.hasImageMagick || this.hasGraphicsMagick) {
      await this.optimizeWithGraphicsTools(inputPath, finalOptions, results);
    }

    // Generate thumbnails
    await this.generateThumbnails(inputPath, finalOptions, results);

    return {
      success: true,
      ...results
    };
  }

  /**
   * Optimize using Sharp library
   */
  async optimizeWithSharp(inputPath, options, results) {
    const sharp = require('sharp');

    for (const format of options.outputFormats) {
      const outputPath = path.join(path.dirname(inputPath), `${results.original}_optim.${format}`);
      const quality = options.quality || 80;

      await sharp(inputPath)
        .toFormat(format, { quality })
        .toFile(outputPath);

      results.optimized.push(outputPath);
    }
  }

  /**
   * Optimize using ImageMagick/GraphicsMagick
   */
  async optimizeWithGraphicsTools(inputPath, options, results) {
    const tools = this.hasImageMagick ? 'convert' : 'gm convert';
    const ext = path.extname(inputPath).toLowerCase();

    for (const format of options.outputFormats) {
      const outputPath = path.join(path.dirname(inputPath), `${path.basename(inputPath, ext)}_optim.${format}`);

      try {
        // Convert using ImageMagick/GraphicsMagick
        await execAsync(
          `${tools} "${inputPath}" -quality ${options.quality} "${outputPath}"`
        );

        results.optimized.push(outputPath);
      } catch (error) {
        console.error(`Error optimizing with ${tools}:`, error.message);
      }
    }
  }

  /**
   * Generate thumbnails for an image
   */
  async generateThumbnails(inputPath, options, results) {
    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const thumbnailDir = path.join(path.dirname(inputPath), 'thumbnails');

    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    for (const [size, dimensions] of Object.entries(options.thumbnails)) {
      const thumbPath = path.join(thumbnailDir, `${baseName}_${size}${ext}`);

      try {
        if (this.hasSharp) {
          const sharp = require('sharp');
          await sharp(inputPath)
            .resize(dimensions.width, dimensions.height, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toFile(thumbPath);
        } else if (this.hasImageMagick) {
          await execAsync(
            `convert "${inputPath}" -resize ${dimensions.width}x${dimensions.height}> "${thumbPath}"`
          );
        } else if (this.hasGraphicsMagick) {
          await execAsync(
            `gm convert "${inputPath}" -resize ${dimensions.width}x${dimensions.height}! "${thumbPath}"`
          );
        }

        results.thumbnails[size] = thumbPath;
      } catch (error) {
        console.error(`Error creating ${size} thumbnail:`, error.message);
      }
    }
  }

  /**
   * Get image optimization placeholder (lazy load)
   * @returns {string} - SVG placeholder data URI
   */
  getPlaceholder() {
    if (this.options.placeholder) {
      return this.options.placeholder;
    }

    // Generate a simple SVG placeholder
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" %3E%3Crect fill="%23222" width="300" height="400"/%3E%3Ctext fill="%23444" font-family="sans-serif" font-size="24" text-anchor="middle" x="150" y="200"%3ENo Image%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Generate responsive image srcset
   * @param {string} basePath - Base path to image
   * @returns {string} - srcset attribute value
   */
  generateSrcSet(basePath, options = {}) {
    const finalOptions = { ...this.options, ...options };
    const ext = path.extname(basePath).toLowerCase();
    const baseName = path.basename(basePath, ext);

    const sources = [];

    // Add thumbnails
    for (const [size, dimensions] of Object.entries(finalOptions.thumbnails)) {
      const thumbPath = path.join(path.dirname(basePath), 'thumbnails', `${baseName}_${size}${ext}`);
      if (fs.existsSync(thumbPath)) {
        sources.push(`${thumbPath} ${dimensions.width}w`);
      }
    }

    // Add optimized versions
    for (const format of finalOptions.outputFormats) {
      const optimizedPath = `${path.join(path.dirname(basePath), `${baseName}_optim.${format}`)}`;
      if (fs.existsSync(optimizedPath)) {
        sources.push(`${optimizedPath} ${this.options.quality}w`);
      }
    }

    return sources.join(', ');
  }

  /**
   * Get lazy loading HTML for an image
   * @param {string} src - Image source
   * @param {string} alt - Alt text
   * @param {string} srcSet - Source set for responsive images
   * @returns {string} - Image HTML with lazy loading
   */
  getLazyLoadImage(src, alt, srcSet = '') {
    const lazyPlaceholder = this.getPlaceholder();

    let html = `<img src="${lazyPlaceholder}" data-src="${src}" alt="${alt}" loading="lazy"`;

    if (srcSet) {
      html += ` srcset="${srcSet}"`;
    }

    html += ` class="lazy-image"`;
    html += `>`;

    return html;
  }

  /**
   * Get optimization statistics
   * @returns {object} - Statistics
   */
  getStatistics() {
    return {
      hasImageMagick: this.hasImageMagick,
      hasGraphicsMagick: this.hasGraphicsMagick,
      hasSharp: this.hasSharp,
      cacheDir: this.options.cacheDir,
      outputFormats: this.options.outputFormats,
      quality: this.options.quality
    };
  }
}

module.exports = { ImageService };
