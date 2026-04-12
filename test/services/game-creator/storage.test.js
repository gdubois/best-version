/**
 * Storage Service Tests
 */

// Mock proper-lockfile
jest.mock('proper-lockfile', () => ({
    lock: jest.fn().mockResolvedValue(() => Promise.resolve())
}));

// Mock fs
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn()
    }
}));

const storageService = require('../../../src/services/game-creator/storage');
const fs = require('fs').promises;

describe('Storage Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateSlug', () => {
        it('should generate proper slug from title', () => {
            expect(storageService.generateSlug('Final Fantasy VII')).toBe('/games/final-fantasy-vii');
            expect(storageService.generateSlug('Chrono Trigger')).toBe('/games/chrono-trigger');
            expect(storageService.generateSlug('Super Mario Bros.')).toBe('/games/super-mario-bros');
        });

        it('should handle special characters', () => {
            expect(storageService.generateSlug('Zelda: Ocarina of Time')).toBe('/games/zelda-ocarina-of-time');
            expect(storageService.generateSlug('Metal Gear Solid (PS1)')).toBe('/games/metal-gear-solid-ps1');
        });
    });

    describe('assembleGameData', () => {
        it('should assemble complete game data from research', () => {
            const researchData = {
                title: 'Test Game',
                genres: ['RPG', 'Adventure'],
                platforms: ['PlayStation', 'PC'],
                releaseDate: '1997-01-31',
                developers: ['Test Dev'],
                publishers: ['Test Publisher'],
                description: 'A test game description.',
                confidence: 0.9
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.slug).toBe('/games/test-game');
            expect(result.data.basic_info.title).toBe('Test Game');
            expect(result.data.basic_info.genres).toEqual(['RPG', 'Adventure']);
            expect(result.data.release.platforms).toHaveLength(2);
            expect(result.data._metadata.source).toBe('game_creator');
            expect(result.data._metadata.confidence_score).toBe(0.9);
        });

        it('should handle missing research data with defaults', () => {
            const minimalData = {
                title: 'Unknown Game',
                confidence: 0.3
            };

            const result = storageService.assembleGameData(minimalData);

            expect(result.data.basic_info.title).toBe('Unknown Game');
            expect(result.data.basic_info.genres).toEqual(['RPG']);
            expect(result.data.basic_info.developers).toEqual(['Unknown']);
            expect(result.data.description.synopsis).toBe('No synopsis available.');
        });

        it('should include reception data when available', () => {
            const researchData = {
                title: 'Test Game',
                confidence: 0.9,
                reception: {
                    scores: [90, 85, 88],
                    reviews: ['Amazing game!'],
                    legacy: 'Revolutionary for its time.'
                }
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.basic_info.reception_score).toBeCloseTo(9, 0);
            expect(result.data.basic_info.review).toBe('Amazing game!');
            expect(result.data.description.legacy_and_impact).toContain('Revolutionary for its time.');
        });
    });

    describe('gameExists', () => {
        it('should return true when game exists in index', async () => {
            const mockIndex = {
                games: [
                    { title: 'Test Game', slug: '/games/test-game', alternativeNames: [] }
                ]
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const exists = await storageService.gameExists('/games/test-game');

            expect(exists).toBe(true);
        });

        it('should return false when game does not exist in index', async () => {
            const mockIndex = {
                games: [
                    { title: 'Other Game', slug: '/games/other-game', alternativeNames: [] }
                ]
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const exists = await storageService.gameExists('/games/nonexistent');

            expect(exists).toBe(false);
        });

        it('should check by slugId when slug not exact match', async () => {
            const mockIndex = {
                games: [
                    { title: 'Test Game', slug: '/games/test-game', alternativeNames: [] }
                ]
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const exists = await storageService.gameExists('/games/test-game');

            expect(exists).toBe(true);
        });

        it('should fall back to file check when index does not exist', async () => {
            fs.readFile.mockRejectedValue({ code: 'ENOENT' });
            fs.access.mockResolvedValue();

            const exists = await storageService.gameExists('/games/test-game');

            expect(exists).toBe(true);
        });
    });

    describe('getGame', () => {
        it('should return game data when it exists', async () => {
            const mockGameData = {
                basic_info: { title: 'Test Game', url_slug: '/games/test-game' }
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockGameData));

            const result = await storageService.getGame('/games/test-game');

            expect(result).toEqual(mockGameData);
        });

        it('should return null when game does not exist', async () => {
            fs.readFile.mockRejectedValue({ code: 'ENOENT' });

            const result = await storageService.getGame('/games/nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getAllGames', () => {
        it('should return all games from index', async () => {
            const mockIndex = {
                games: [
                    { title: 'Game 1', slug: '/games/game-1' },
                    { title: 'Game 2', slug: '/games/game-2' }
                ]
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const result = await storageService.getAllGames();

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Game 1');
        });
    });

    describe('getLibraryStats', () => {
        it('should return library statistics', async () => {
            const mockIndex = {
                games: [
                    { title: 'Game 1', slug: '/games/game-1' }
                ]
            };
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const stats = await storageService.getLibraryStats();

            expect(stats).toHaveProperty('totalGames');
            expect(stats).toHaveProperty('genres');
            expect(stats.totalGames).toBe(1);
        });
    });

    describe('saveGame', () => {
        it('should save game file and update index', async () => {
            const mockGameData = {
                basic_info: { title: 'Test Game', url_slug: '/games/test-game' },
                release: { alternative_names: [] }
            };
            const mockIndex = { games: [] };

            // Mock gameExists to return false (new game)
            storageService.gameExists = jest.fn().mockResolvedValue(false);
            fs.readFile.mockResolvedValue(JSON.stringify(mockIndex));

            const result = await storageService.saveGame('/games/test-game', mockGameData);

            expect(result).toHaveProperty('slug');
            expect(result).toHaveProperty('filePath');
            expect(result).toHaveProperty('title');
        });

        it('should throw error when game already exists', async () => {
            const mockGameData = {
                basic_info: { title: 'Test Game', url_slug: '/games/test-game' }
            };

            // Mock gameExists to return true
            storageService.gameExists = jest.fn().mockResolvedValue(true);

            await expect(storageService.saveGame('/games/test-game', mockGameData))
                .rejects.toThrow('Game file already exists');
        });
    });

    describe('processAndSave', () => {
        it('should return failure when validation fails', async () => {
            const researchData = {
                title: 'Test Game',
                confidence: 0.3
            };
            const validationResult = {
                valid: false,
                confidenceScore: 0.3,
                recommendation: 'SKIP'
            };

            const result = await storageService.processAndSave(researchData, validationResult);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('validation_failed');
        });

        it('should save game when validation passes', async () => {
            const researchData = {
                title: 'Test Game',
                confidence: 0.9
            };
            const validationResult = {
                valid: true,
                confidenceScore: 0.9,
                recommendation: 'PROCEED'
            };

            // Mock assembleGameData and saveGame
            const mockGameData = {
                basic_info: { title: 'Test Game', url_slug: '/games/test-game' },
                release: { alternative_names: [] }
            };
            storageService.assembleGameData = jest.fn().mockReturnValue({
                slug: '/games/test-game',
                data: mockGameData
            });
            storageService.saveGame = jest.fn().mockResolvedValue({
                slug: '/games/test-game',
                filePath: '/games/test-game.json',
                title: 'Test Game'
            });

            const result = await storageService.processAndSave(researchData, validationResult);

            expect(result.success).toBe(true);
            expect(result.slug).toBe('/games/test-game');
        });

        it('should handle save errors gracefully', async () => {
            const researchData = {
                title: 'Test Game',
                confidence: 0.9
            };
            const validationResult = {
                valid: true,
                confidenceScore: 0.9,
                recommendation: 'PROCEED'
            };

            // Mock saveGame to throw error
            storageService.assembleGameData = jest.fn().mockReturnValue({
                slug: '/games/test-game',
                data: { basic_info: { title: 'Test Game' } }
            });
            storageService.saveGame = jest.fn().mockRejectedValue(new Error('Disk full'));

            const result = await storageService.processAndSave(researchData, validationResult);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('save_error');
            expect(result.error).toBe('Disk full');
        });
    });

    describe('assembleGameData', () => {
        it('should handle structured platform objects', () => {
            const researchData = {
                title: 'Test Game',
                platforms: [
                    { name: 'PlayStation 5', region: 'Global', release_date: '2020-11-12' },
                    { name: 'PC', region: 'World', release_date: '2021-01-15' }
                ]
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.release.platforms).toHaveLength(2);
            expect(result.data.release.platforms[0].region).toBe('World'); // Global -> World
        });

        it('should handle play_today with recommended patches', () => {
            const researchData = {
                title: 'Test Game',
                playToday: [
                    {
                        platform: 'PC',
                        details: 'Best version',
                        recommended_patches: [
                            { name: 'HD Patch', description: 'Enhanced graphics', url: 'https://example.com/patch' }
                        ]
                    }
                ]
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.play_today).toHaveLength(1);
            expect(result.data.play_today[0].recommended_patches).toHaveLength(1);
        });

        it('should handle emulators in play_today', () => {
            const researchData = {
                title: 'Test Game',
                playToday: [
                    {
                        platform: 'NES',
                        details: 'Play on emulator',
                        emulators: [
                            {
                                platform: 'Windows',
                                recommended_emulator: 'Nestopia',
                                optimal_settings: ['Enable sound', 'Bilinear filtering']
                            }
                        ]
                    }
                ]
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.play_today[0].emulators).toHaveLength(1);
            expect(result.data.play_today[0].emulators[0].recommended_emulator).toBe('Nestopia');
        });

        it('should handle series data', () => {
            const researchData = {
                title: 'Final Fantasy VII',
                serie: {
                    is_part_of_serie: true,
                    serie_name: 'Final Fantasy',
                    part_number: 7
                }
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.serie.is_part_of_serie).toBe(true);
            expect(result.data.serie.serie_name).toBe('Final Fantasy');
            expect(result.data.serie.part_number).toBe(7);
        });

        it('should handle similar games', () => {
            const researchData = {
                title: 'Test Game',
                similarGames: [
                    { title: 'Similar Game 1', url_slug: '/games/similar-game-1' },
                    { title: 'Similar Game 2', url_slug: '/games/similar-game-2' }
                ]
            };

            const result = storageService.assembleGameData(researchData);

            expect(result.data.similar_games).toHaveLength(2);
        });
    });
});
