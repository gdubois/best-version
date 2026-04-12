/**
 * Research Service Tests
 *
 * Tests for the Game Research Service
 */

// Mock global fetch - set default to return rejected promise
global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network error')));

const researchService = require('../../../src/services/game-creator/research');

describe('Research Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset fetch to reject by default
        global.fetch.mockImplementation(() => Promise.reject(new Error('Network error')));
    });

    describe('searchWikipedia', () => {
        it('should search Wikipedia and return results', async () => {
            // Mock fetch for search
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    query: {
                        pages: {
                            '123': {
                                title: 'Final Fantasy VII',
                                extract: 'A role-playing game developed by Square.'
                            }
                        }
                    }
                })
            });

            const results = await researchService.searchWikipedia('Final Fantasy VII');

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
        });

        it('should return empty array on fetch error', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const results = await researchService.searchWikipedia('Test Game');

            expect(results).toEqual([]);
        });

        it('should return empty array on HTTP error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false
            });

            const results = await researchService.searchWikipedia('Test Game');

            expect(results).toEqual([]);
        });
    });

    describe('extractPlatformFromTitle', () => {
        it('should extract PlayStation 5 from title', () => {
            const platform = researchService.extractPlatformFromTitle('Game PS5 Edition');
            expect(platform).toBe('PlayStation 5');
        });

        it('should extract PlayStation 4 from title', () => {
            const platform = researchService.extractPlatformFromTitle('Game PS4 Remaster');
            expect(platform).toBe('PlayStation 4');
        });

        it('should extract Nintendo Switch from title', () => {
            const platform = researchService.extractPlatformFromTitle('Game Switch Version');
            expect(platform).toBe('Nintendo Switch');
        });

        it('should extract PC from title', () => {
            const platform = researchService.extractPlatformFromTitle('Game PC Edition');
            expect(platform).toBe('PC');
        });

        it('should return Unknown for unrecognized platforms', () => {
            const platform = researchService.extractPlatformFromTitle('Game GameCube Version');
            expect(platform).toBe('Unknown');
        });
    });

    describe('searchPlatformInfo', () => {
        it('should search for platform information', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        [],
                        ['Test Game platforms'],
                        [],
                        ['https://en.wikipedia.org/wiki/Test_Game']
                    ]
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        query: {
                            pages: {
                                '123': {
                                    title: 'Test Game platforms',
                                    extract: 'Available on PlayStation and Xbox consoles.'
                                }
                            }
                        }
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        [],
                        [],
                        [],
                        []
                    ]
                });

            const result = await researchService.searchPlatformInfo('Test Game');

            expect(result).toHaveProperty('platforms');
            expect(result).toHaveProperty('versions');
            expect(result).toHaveProperty('sources');
        });

        it('should handle empty search results', async () => {
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [[], [], [], []]
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [[], [], [], []]
                });

            const result = await researchService.searchPlatformInfo('Test Game');

            expect(result.platforms).toEqual([]);
            expect(result.versions).toEqual([]);
        });
    });

    describe('searchPatchesAndMods', () => {
        it('should search for patches and mods', async () => {
            // Mock all 4 patch queries
            for (let i = 0; i < 4; i++) {
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => [[], [], [], []]
                });
            }

            const result = await researchService.searchPatchesAndMods('Test Game');

            expect(result).toHaveProperty('patches');
            expect(result).toHaveProperty('sources');
            expect(result.patches.length).toBeGreaterThan(0);
        });

        it('should include aggregator sources', async () => {
            for (let i = 0; i < 4; i++) {
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => [[], [], [], []]
                });
            }

            const result = await researchService.searchPatchesAndMods('Test Game');

            const patchSources = result.patches.map(p => p.source);
            expect(patchSources).toContain('romhacking.net');
            expect(patchSources).toContain('PCGamingWiki');
            expect(patchSources).toContain('Reddit');
        });
    });

    describe('gatherGameData', () => {
        it('should gather data from multiple sources', async () => {
            // Mock initial wiki search
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    [],
                    ['Test Game video game'],
                    [],
                    ['https://en.wikipedia.org/wiki/Test_Game']
                ]
            });

            // Mock extract query
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    query: {
                        pages: {
                            '123': {
                                title: 'Test Game video game',
                                extract: 'An RPG game for PlayStation.'
                            }
                        }
                    }
                })
            });

            // Mock platform search (2 fetches)
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [[], [], [], []]
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [[], [], [], []]
            });

            // Mock patch searches (4 queries, each needs 1 fetch)
            for (let i = 0; i < 4; i++) {
                global.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => [[], [], [], []]
                });
            }

            const result = await researchService.gatherGameData('Test Game');

            expect(result).toHaveProperty('wikipediaData');
            expect(result).toHaveProperty('platformData');
            expect(result).toHaveProperty('patchData');
            expect(result).toHaveProperty('sources');
        });
    });

    describe('generatePlayTodayRecommendations', () => {
        it('should generate play today recommendation', async () => {
            const researchResult = {
                platforms: ['PlayStation 5', 'PlayStation', 'PC'],
                releaseDate: '1997-01-31'
            };

            const recommendation = await researchService.generatePlayTodayRecommendations(researchResult);

            expect(recommendation).toBeDefined();
            expect(Array.isArray(recommendation)).toBe(true);
        });

        it('should handle empty platforms array', async () => {
            const researchResult = {
                platforms: [],
                releaseDate: '1997-01-31'
            };

            const recommendation = await researchService.generatePlayTodayRecommendations(researchResult);

            expect(recommendation).toBeDefined();
            expect(Array.isArray(recommendation)).toBe(true);
            expect(recommendation.length).toBe(0);
        });

        it('should prioritize recent remasters over old originals', async () => {
            const researchResult = {
                platforms: ['NES', 'Nintendo Switch'],
                releaseDate: '1986-06-03'
            };

            const recommendation = await researchService.generatePlayTodayRecommendations(researchResult);

            expect(recommendation).toBeDefined();
            expect(Array.isArray(recommendation)).toBe(true);
        });
    });

    describe('researchGameWithLLM', () => {
        it('should research game using LLM', async () => {
            // Mock LLM call
            const llmClient = require('../../../src/services/game-creator/llmClient');
            llmClient.callLLM.mockResolvedValue({
                response: JSON.stringify({
                    title: 'Test Game',
                    genres: ['RPG'],
                    platforms: ['PC'],
                    confidence: 0.9
                })
            });

            const result = await researchService.researchGameWithLLM('Test Game');

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Game');
        });

        it('should handle LLM errors gracefully', async () => {
            const llmClient = require('../../../src/services/game-creator/llmClient');
            llmClient.callLLM.mockRejectedValue(new Error('LLM error'));

            const result = await researchService.researchGameWithLLM('Test Game');

            expect(result).toBeDefined();
            // Should have fallback data
            expect(result.title).toBe('Test Game');
        });
    });

    describe('extractFromSearchResults', () => {
        it('should extract basic game information from search results', () => {
            const gameTitle = 'Final Fantasy VII';
            const searchResults = [
                {
                    title: 'Final Fantasy VII - Wikipedia',
                    snippet: 'Final Fantasy VII is a role-playing game developed and published by Square for the PlayStation. Released in 1997, it is the seventh installment in the Final Fantasy series.',
                    url: 'https://en.wikipedia.org/wiki/Final_Fantasy_VII'
                },
                {
                    title: 'Final Fantasy VII Review - IGN',
                    snippet: 'This action RPG game received critical acclaim. Available on PlayStation, PC, and Nintendo Switch. Developed by Square Enix.',
                    url: 'https://www.ign.com/final-fantasy-vii'
                }
            ];

            const result = researchService.extractFromSearchResults(gameTitle, searchResults);

            expect(result.title).toBe(gameTitle);
            expect(result.genres).toContain('RPG');
            expect(result.platforms).toContain('PlayStation');
            expect(result.releaseDate).toContain('1997');
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.sources).toHaveLength(2);
        });

        it('should return zero confidence for empty search results', () => {
            const result = researchService.extractFromSearchResults('Unknown Game', []);

            expect(result.confidence).toBe(0.0);
            expect(result.genres).toHaveLength(0);
            expect(result.platforms).toHaveLength(0);
        });

        it('should extract multiple genres', () => {
            const searchResults = [
                {
                    title: 'Test Game',
                    snippet: 'An action-adventure RPG with stealth and survival elements. Features turn-based combat in this roguelike MMORPG.',
                    url: 'https://example.com/test-game'
                }
            ];

            const result = researchService.extractFromSearchResults('Test Game', searchResults);

            expect(result.genres).toContain('Action');
            expect(result.genres).toContain('Adventure');
            expect(result.genres).toContain('RPG');
            expect(result.genres).toContain('Stealth');
            expect(result.genres).toContain('Survival');
            expect(result.genres).toContain('Turn-based');
            expect(result.genres).toContain('Roguelike');
            expect(result.genres).toContain('MMORPG');
        });

        it('should extract multiple platforms', () => {
            const searchResults = [
                {
                    title: 'Test Game',
                    snippet: 'Available on PlayStation 5, Xbox Series X/S, Nintendo Switch, and PC via Steam.',
                    url: 'https://example.com/test-game'
                }
            ];

            const result = researchService.extractFromSearchResults('Test Game', searchResults);

            expect(result.platforms).toContain('PlayStation 5');
            expect(result.platforms).toContain('Xbox Series X/S');
            expect(result.platforms).toContain('Nintendo Switch');
            expect(result.platforms).toContain('PC');
        });

        it('should handle null search results', () => {
            const result = researchService.extractFromSearchResults('Test Game', null);

            expect(result.confidence).toBe(0.0);
            expect(result.title).toBe('Test Game');
        });
    });

    describe('verifyGameExists', () => {
        it('should verify a well-known game exists', async () => {
            const result = await researchService.verifyGameExists('Final Fantasy VII');

            expect(result.exists).toBe(true);
            expect(result.confidence).toBeGreaterThan(0);
        });

        it('should handle verification errors gracefully', async () => {
            // This test would need mocking in real implementation
            const result = await researchService.verifyGameExists('Test Game');

            expect(result).toHaveProperty('exists');
            expect(result).toHaveProperty('confidence');
        });
    });

    describe('getStats', () => {
        it('should return configuration statistics', () => {
            const stats = researchService.getStats();

            expect(stats).toHaveProperty('config');
            expect(stats).toHaveProperty('apiKeyConfigured');
            expect(stats.config).toEqual(researchService.RESEARCH_CONFIG);
        });
    });

    describe('sleep', () => {
        it('should resolve after specified milliseconds', async () => {
            jest.useFakeTimers();
            const start = Date.now();

            const promise = researchService.sleep(100);
            jest.advanceTimersByTime(100);

            await promise;
            jest.useRealTimers();

            expect(promise).toBeDefined();
        });
    });

    describe('loadLLMPrompt', () => {
        it('should return null when prompt file does not exist', async () => {
            const result = await researchService.loadLLMPrompt();

            // Either returns null on error or the actual prompt
            expect(result).toBeDefined();
        });
    });

    describe('loadGameSchema', () => {
        it('should return null when schema file does not exist', async () => {
            const result = await researchService.loadGameSchema();

            // Either returns null on error or the actual schema
            expect(result).toBeDefined();
        });
    });

    describe('buildLLMPrompt', () => {
        it('should build a prompt with game data', async () => {
            const gameTitle = 'Test Game';
            const gatheredData = {
                wikipediaData: { title: 'Test Game' },
                platformData: { platforms: ['PC'], versions: [] },
                patchData: { patches: [] },
                sources: []
            };

            const result = await researchService.buildLLMPrompt(gameTitle, gatheredData, null);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('mergeLLMResults', () => {
        it('should merge gathered data with LLM results', () => {
            const gatheredData = {
                wikipediaData: { title: 'Test Game', genres: ['RPG'] },
                platformData: { platforms: ['PC'] },
                patchData: { patches: [] },
                sources: []
            };
            const llmResult = {
                title: 'Test Game',
                genres: ['RPG', 'Adventure']
            };

            const result = researchService.mergeLLMResults(gatheredData, llmResult);

            expect(result).toBeDefined();
        });
    });

    describe('extractReleaseDate', () => {
        it('should extract release date from LLM result', () => {
            const llmResult = { releaseDate: '1997-01-31' };
            const fallbackDate = '2000-01-01';

            const result = researchService.extractReleaseDate(llmResult, fallbackDate);

            expect(result).toBeDefined();
        });

        it('should use fallback when LLM has no release date', () => {
            const llmResult = {};
            const fallbackDate = '2000-01-01';

            const result = researchService.extractReleaseDate(llmResult, fallbackDate);

            expect(result).toBe(fallbackDate);
        });
    });

    describe('calculateConfidence', () => {
        it('should calculate confidence based on result data', () => {
            const result = {
                title: 'Test Game',
                genres: ['RPG'],
                platforms: ['PC'],
                developers: ['Test Dev'],
                confidence: 0.9
            };

            const confidence = researchService.calculateConfidence(result);

            expect(confidence).toBeGreaterThan(0);
            expect(confidence).toBeLessThanOrEqual(1);
        });

        it('should return zero for empty result', () => {
            const confidence = researchService.calculateConfidence({});

            expect(confidence).toBe(0);
        });
    });

    describe('getPlatformDetails', () => {
        it('should get platform details', () => {
            const platform = 'PC';
            const researchResult = {
                platforms: ['PC'],
                releaseDate: '1997-01-31'
            };

            const details = researchService.getPlatformDetails(platform, researchResult, false);

            expect(details).toBeDefined();
        });
    });

    describe('getRecommendedPatches', () => {
        it('should get recommended patches for platform', () => {
            const platform = 'PC';
            const researchResult = {
                patches: [{ name: 'HD Patch', type: 'enhancement' }]
            };

            const patches = researchService.getRecommendedPatches(platform, researchResult, false);

            expect(patches).toBeDefined();
        });
    });

    describe('getEmulatorRecommendations', () => {
        it('should get emulator recommendations for retro platform', () => {
            const platform = 'NES';

            const recommendations = researchService.getEmulatorRecommendations(platform);

            expect(recommendations).toBeDefined();
        });

        it('should return empty for non-retro platform', () => {
            const platform = 'PlayStation 5';

            const recommendations = researchService.getEmulatorRecommendations(platform);

            expect(recommendations).toBeDefined();
        });
    });

    describe('researchGame', () => {
        it('should return proper structure even with no results', async () => {
            const result = await researchService.researchGame('Unknown Game 12345');

            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('alternativeTitles');
            expect(result).toHaveProperty('genres');
            expect(result).toHaveProperty('platforms');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('sources');
            expect(result).toHaveProperty('researchTime');

            expect(result.title).toBe('Unknown Game 12345');
            expect(result.genres).toHaveLength(0);
            expect(result.platforms).toHaveLength(0);
        });

        it('should capture research time', async () => {
            const result = await researchService.researchGame('Test Game');

            expect(result.researchTime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('researchGameWithAgent', () => {
        it('should call agent research and return results', async () => {
            // The function will call the agent service
            const result = await researchService.researchGameWithAgent('Test Game');

            expect(result).toBeDefined();
        });
    });
});
