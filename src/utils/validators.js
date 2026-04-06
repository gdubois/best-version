// Schema validators for game metadata validation

const fs = require('fs');
const path = require('path');

class JsonSchemaValidator {
  constructor(schemaPath) {
    this.schemaPath = schemaPath;
    this.schema = null;
    this.errors = [];
  }

  loadSchema() {
    try {
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);
      return true;
    } catch (error) {
      console.error(`Failed to load schema from ${this.schemaPath}:`, error.message);
      return false;
    }
  }

  validate(data) {
    this.errors = [];

    if (!this.schema) {
      this.errors.push('Schema not loaded');
      return false;
    }

    // Basic JSON structure validation
    if (!data || typeof data !== 'object') {
      this.errors.push('Data must be a non-null object');
      return false;
    }

    // Validate required top-level properties
    const requiredProperties = ['basic_info', 'release', 'serie', 'similar_games'];
    for (const prop of requiredProperties) {
      if (!data[prop]) {
        this.errors.push(`Missing required property: ${prop}`);
      }
    }

    // Validate basic_info structure
    if (data.basic_info) {
      this.validateBasicInfo(data.basic_info);
    }

    // Validate release structure
    if (data.release) {
      this.validateRelease(data.release);
    }

    return this.errors.length === 0;
  }

  validateBasicInfo(basicInfo) {
    const requiredFields = ['url_slug', 'title', 'genres', 'themes'];
    for (const field of requiredFields) {
      if (!basicInfo[field]) {
        this.errors.push(`basic_info.${field} is required`);
      }
    }

    // Validate genres is an array
    if (basicInfo.genres && !Array.isArray(basicInfo.genres)) {
      this.errors.push('basic_info.genres must be an array');
    }

    // Validate themes is an array
    if (basicInfo.themes && !Array.isArray(basicInfo.themes)) {
      this.errors.push('basic_info.themes must be an array');
    }

    // Validate modes object
    if (basicInfo.modes && typeof basicInfo.modes === 'object') {
      const modeFields = ['single_player', 'multiplayer_local', 'multiplayer_online', 'co_op'];
      for (const field of modeFields) {
        if (typeof basicInfo.modes[field] !== 'boolean') {
          this.errors.push(`basic_info.modes.${field} must be a boolean`);
        }
      }
    }
  }

  validateRelease(release) {
    // Validate platforms is an array
    if (release.platforms && !Array.isArray(release.platforms)) {
      this.errors.push('release.platforms must be an array');
    }

    // Validate each platform entry
    if (release.platforms) {
      for (let i = 0; i < release.platforms.length; i++) {
        const platform = release.platforms[i];
        if (!platform.name) {
          this.errors.push(`release.platforms[${i}].name is required`);
        }
        if (!platform.region) {
          this.errors.push(`release.platforms[${i}].region is required`);
        }
        if (!platform.release_date) {
          this.errors.push(`release.platforms[${i}].release_date is required`);
        }
      }
    }
  }

  getErrors() {
    return this.errors;
  }
}

module.exports = { JsonSchemaValidator };
