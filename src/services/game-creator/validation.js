/**
 * Game Metadata Validation Service
 *
 * Validates generated game metadata against the schema.
 * Calculates confidence scores and identifies issues.
 *
 * @module services/game-creator/validation
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { createLogger } = require('./logger');

// Load schema
const schema = require('../../../game_metadata_schema.json');

// Remove $schema reference for AJV 8 compatibility
delete schema.$schema;

// Initialize AJV validator (AJV 8 uses draft-07 by default)
const ajv = new Ajv({
    allErrors: true,
    strict: false
});
addFormats(ajv);
const validate = ajv.compile(schema);

// Configuration
const AUTO_APPROVE_THRESHOLD = 0.8;
const REJECTION_THRESHOLD = 0.3;

/**
 * Logger instance for validation component
 * @private
 */
const logger = createLogger('validation', { redactApiKey: true });

/**
 * Logger helper (wraps structured logger)
 * @private
 */
async function log(message, level = 'info', context = {}) {
    switch (level) {
        case 'debug':
            await logger.debug(message, context);
            break;
        case 'warn':
            await logger.warn(message, context);
            break;
        case 'error':
            await logger.error(message, context);
            break;
        default:
            await logger.info(message, context);
    }
}

/**
 * Issue severity levels
 */
const Severity = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

/**
 * Validate game metadata against the schema
 * @param {Object} metadata - The game metadata to validate
 * @returns {Object}
 */
function validateMetadata(metadata) {
    const result = {
        valid: false,
        confidenceScore: 0.0,
        issues: [],
        recommendation: 'reject', // 'approve', 'review', or 'reject'
        details: {
            fieldScores: {},
            missingFields: [],
            warnings: []
        }
    };

    // Run AJV validation
    const ajvValid = validate(metadata);

    if (!ajvValid) {
        for (const error of validate.errors || []) {
            const severity = error.keyword === 'required' ? Severity.CRITICAL : Severity.HIGH;
            result.issues.push({
                severity,
                field: error.instancePath || '/',
                message: `${error.message} (${error.keyword})`,
                schemaPath: error.schemaPath
            });
        }
    }

    // Calculate field-level scores
    const fieldScores = calculateFieldScores(metadata);
    result.details.fieldScores = fieldScores;

    // Calculate overall confidence score
    result.confidenceScore = calculateOverallScore(fieldScores, metadata);

    // Determine recommendation
    if (result.confidenceScore >= AUTO_APPROVE_THRESHOLD && result.issues.filter(i => i.severity === Severity.CRITICAL).length === 0) {
        result.recommendation = 'approve';
        result.valid = true;
    } else if (result.confidenceScore >= REJECTION_THRESHOLD) {
        result.recommendation = 'review';
        result.valid = false;
    } else {
        result.recommendation = 'reject';
        result.valid = false;
    }

    // Identify missing required fields
    result.details.missingFields = identifyMissingFields(metadata);

    log(`Validation completed`, 'info', {
        confidence: result.confidenceScore,
        recommendation: result.recommendation,
        issueCount: result.issues.length
    });

    return result;
}

/**
 * Calculate individual field scores
 * @param {Object} metadata
 * @returns {Object}
 */
function calculateFieldScores(metadata) {
    const scores = {
        title: 0,
        genres: 0,
        platforms: 0,
        developers: 0,
        publishers: 0,
        synopsis: 0,
        longDescription: 0,
        releaseDate: 0,
        modes: 0,
        alternativeNames: 0,
        keyFeatures: 0,
        legacyAndImpact: 0
    };

    // Title (required, critical)
    if (metadata?.basic_info?.title && metadata.basic_info.title.length > 2) {
        scores.title = 1.0;
    }

    // Genres (required, critical)
    const genres = metadata?.basic_info?.genres || [];
    if (genres.length > 0) {
        scores.genres = Math.min(genres.length / 3, 1.0);
    }

    // Platforms (required, critical)
    const platforms = metadata?.release?.platforms || [];
    if (platforms.length > 0) {
        scores.platforms = Math.min(platforms.length / 2, 1.0);
    }

    // Developers (required, critical)
    const developers = metadata?.basic_info?.developers || [];
    if (developers.length > 0 && developers[0].length > 1) {
        scores.developers = 1.0;
    }

    // Publishers (required, critical)
    const publishers = metadata?.basic_info?.publishers || [];
    if (publishers.length > 0 && publishers[0].length > 1) {
        scores.publishers = 1.0;
    }

    // Synopsis (required, high importance)
    const synopsis = metadata?.description?.synopsis || '';
    if (synopsis.length > 50) {
        scores.synopsis = Math.min(synopsis.length / 200, 1.0);
    }

    // Long description (required, high importance)
    const longDescription = metadata?.description?.long_description || '';
    if (longDescription.length > 100) {
        scores.longDescription = Math.min(longDescription.length / 500, 1.0);
    }

    // Release date (extracted from platforms)
    const hasReleaseDate = platforms.some(p => p.release_date);
    if (hasReleaseDate) {
        scores.releaseDate = 1.0;
    }

    // Modes (required, medium importance)
    const modes = metadata?.basic_info?.modes;
    if (modes && typeof modes.single_player === 'boolean') {
        scores.modes = 1.0;
    }

    // Alternative names (optional, low importance)
    const alternativeNames = metadata?.release?.alternative_names || [];
    if (alternativeNames.length > 0) {
        scores.alternativeNames = Math.min(alternativeNames.length / 2, 1.0);
    }

    // Key features (optional, medium importance)
    const keyFeatures = metadata?.description?.key_features || [];
    if (keyFeatures.length > 0) {
        scores.keyFeatures = Math.min(keyFeatures.length / 5, 1.0);
    }

    // Legacy and impact (optional, low importance)
    const legacyAndImpact = metadata?.description?.legacy_and_impact || [];
    if (legacyAndImpact.length > 0) {
        scores.legacyAndImpact = Math.min(legacyAndImpact.length / 3, 1.0);
    }

    return scores;
}

/**
 * Calculate overall confidence score from field scores
 * @param {Object} fieldScores
 * @param {Object} metadata
 * @returns {number}
 */
function calculateOverallScore(fieldScores, metadata) {
    // Weight important fields more heavily
    const weights = {
        title: 0.10,
        genres: 0.10,
        platforms: 0.12,
        developers: 0.08,
        publishers: 0.08,
        synopsis: 0.12,
        longDescription: 0.15,
        releaseDate: 0.08,
        modes: 0.05,
        alternativeNames: 0.02,
        keyFeatures: 0.05,
        legacyAndImpact: 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [field, weight] of Object.entries(weights)) {
        const score = fieldScores[field] || 0;
        weightedSum += score * weight;
        totalWeight += weight;
    }

    // Normalize
    const normalizedScore = weightedSum / totalWeight;

    // Apply penalty for schema validation errors
    const validate = ajv.getSchema(schema.$id);
    if (validate && !validate(metadata)) {
        const errorCount = validate.errors?.length || 0;
        const penalty = Math.min(errorCount * 0.05, 0.3);
        return Math.max(normalizedScore - penalty, 0);
    }

    return normalizedScore;
}

/**
 * Identify missing required fields
 * @param {Object} metadata
 * @returns {Array<string>}
 */
function identifyMissingFields(metadata) {
    const missing = [];

    // Check required fields
    if (!metadata?.basic_info?.title) {
        missing.push('basic_info.title');
    }
    if (!metadata?.basic_info?.url_slug) {
        missing.push('basic_info.url_slug');
    }
    if (!metadata?.basic_info?.genres || metadata.basic_info.genres.length === 0) {
        missing.push('basic_info.genres');
    }
    if (!metadata?.basic_info?.developers || metadata.basic_info.developers.length === 0) {
        missing.push('basic_info.developers');
    }
    if (!metadata?.basic_info?.publishers || metadata.basic_info.publishers.length === 0) {
        missing.push('basic_info.publishers');
    }
    if (!metadata?.basic_info?.modes || typeof metadata.basic_info.modes.single_player === 'undefined') {
        missing.push('basic_info.modes.single_player');
    }
    if (!metadata?.release?.platforms || metadata.release.platforms.length === 0) {
        missing.push('release.platforms');
    }
    if (!metadata?.description?.synopsis) {
        missing.push('description.synopsis');
    }
    if (!metadata?.description?.long_description) {
        missing.push('description.long_description');
    }

    return missing;
}

/**
 * Categorize issues by severity
 * @param {Array} issues
 * @returns {Object}
 */
function categorizeIssues(issues) {
    return {
        critical: issues.filter(i => i.severity === Severity.CRITICAL),
        high: issues.filter(i => i.severity === Severity.HIGH),
        medium: issues.filter(i => i.severity === Severity.MEDIUM),
        low: issues.filter(i => i.severity === Severity.LOW)
    };
}

/**
 * Check if metadata is ready for auto-approval
 * @param {Object} validationResult
 * @returns {boolean}
 */
function isAutoApproveable(validationResult) {
    return validationResult.recommendation === 'approve';
}

/**
 * Get validation thresholds
 * @returns {Object}
 */
function getThresholds() {
    return {
        autoApprove: AUTO_APPROVE_THRESHOLD,
        rejection: REJECTION_THRESHOLD
    };
}

module.exports = {
    validateMetadata,
    calculateFieldScores,
    calculateOverallScore,
    identifyMissingFields,
    categorizeIssues,
    isAutoApproveable,
    getThresholds,
    Severity,
    validate: validateMetadata // Alias for convenience
};
