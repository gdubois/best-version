/**
 * Validation Service Tests
 */

const validationService = require('../../../src/services/game-creator/validation');

describe('Validation Service', () => {
    const validMetadata = {
        basic_info: {
            url_slug: '/games/test-game',
            title: 'Test Game',
            genres: ['RPG', 'Adventure'],
            modes: { single_player: true },
            developers: ['Test Dev'],
            publishers: ['Test Publisher']
        },
        release: {
            platforms: [
                { name: 'PlayStation', region: 'Japan', release_date: '1997-01-31' }
            ]
        },
        description: {
            synopsis: 'This is a test game with an engaging story and gameplay.',
            long_description: 'Test Game is a role-playing game that features turn-based combat and a compelling narrative. Developed by Test Dev, it was first released in 1997.'
        }
    };

    describe('validateMetadata', () => {
        it('should validate complete metadata with high confidence', () => {
            const result = validationService.validateMetadata(validMetadata);

            expect(result.valid).toBe(true);
            expect(result.confidenceScore).toBeGreaterThan(0.7);
            expect(result.recommendation).toBe('approve');
        });

        it('should reject metadata with missing required fields', () => {
            const invalidMetadata = {
                basic_info: {
                    title: 'Test Game'
                    // Missing: url_slug, genres, modes, developers, publishers
                },
                release: {},
                description: {}
            };

            const result = validationService.validateMetadata(invalidMetadata);

            expect(result.valid).toBe(false);
            expect(result.recommendation).toBe('reject');
            expect(result.issues.length).toBeGreaterThan(0);
        });

        it('should recommend review for partial metadata', () => {
            const partialMetadata = {
                basic_info: {
                    url_slug: '/games/test',
                    title: 'Test',
                    genres: ['RPG'],
                    modes: { single_player: true },
                    developers: ['Dev'],
                    publishers: ['Pub']
                },
                release: {
                    platforms: [{ name: 'PC', region: 'World', release_date: '2020-01-01' }]
                },
                description: {
                    synopsis: 'Short.',
                    long_description: 'Medium length description here.'
                }
            };

            const result = validationService.validateMetadata(partialMetadata);

            expect(result.recommendation).toBe('review');
            expect(result.confidenceScore).toBeGreaterThan(0.3);
            expect(result.confidenceScore).toBeLessThan(0.8);
        });
    });

    describe('calculateFieldScores', () => {
        it('should score complete fields at 1.0', () => {
            const scores = validationService.calculateFieldScores(validMetadata);

            expect(scores.title).toBe(1.0);
            expect(scores.genres).toBeGreaterThan(0);
            expect(scores.platforms).toBeGreaterThan(0);
            expect(scores.developers).toBe(1.0);
            expect(scores.publishers).toBe(1.0);
            expect(scores.modes).toBe(1.0);
            expect(scores.releaseDate).toBe(1.0);
        });

        it('should score missing fields at 0', () => {
            const emptyMetadata = {};
            const scores = validationService.calculateFieldScores(emptyMetadata);

            expect(scores.title).toBe(0);
            expect(scores.genres).toBe(0);
            expect(scores.platforms).toBe(0);
        });
    });

    describe('identifyMissingFields', () => {
        it('should identify all missing required fields', () => {
            const emptyMetadata = {};
            const missing = validationService.identifyMissingFields(emptyMetadata);

            expect(missing).toContain('basic_info.title');
            expect(missing).toContain('basic_info.url_slug');
            expect(missing).toContain('basic_info.genres');
            expect(missing).toContain('release.platforms');
            expect(missing).toContain('description.synopsis');
            expect(missing).toContain('description.long_description');
        });

        it('should return empty array for complete metadata', () => {
            const missing = validationService.identifyMissingFields(validMetadata);

            expect(missing).toHaveLength(0);
        });
    });

    describe('categorizeIssues', () => {
        it('should categorize issues by severity', () => {
            const issues = [
                { severity: 'critical', message: 'Missing title' },
                { severity: 'critical', message: 'Missing genres' },
                { severity: 'high', message: 'Invalid format' },
                { severity: 'medium', message: 'Short description' },
                { severity: 'low', message: 'Missing optional field' }
            ];

            const categories = validationService.categorizeIssues(issues);

            expect(categories.critical).toHaveLength(2);
            expect(categories.high).toHaveLength(1);
            expect(categories.medium).toHaveLength(1);
            expect(categories.low).toHaveLength(1);
        });
    });

    describe('isAutoApproveable', () => {
        it('should return true for high confidence valid metadata', () => {
            const result = validationService.validateMetadata(validMetadata);
            expect(validationService.isAutoApproveable(result)).toBe(true);
        });

        it('should return false for low confidence metadata', () => {
            const result = { recommendation: 'review', confidenceScore: 0.5 };
            expect(validationService.isAutoApproveable(result)).toBe(false);
        });
    });

    describe('getThresholds', () => {
        it('should return validation thresholds', () => {
            const thresholds = validationService.getThresholds();

            expect(thresholds.autoApprove).toBe(0.8);
            expect(thresholds.rejection).toBe(0.3);
        });
    });
});
