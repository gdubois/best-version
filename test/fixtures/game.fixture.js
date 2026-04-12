// Test data fixtures for game-related tests

/**
 * Create a valid game object with optional overrides
 * @param {Object} overrides - Fields to override
 * @returns {Object} Valid game object
 */
const createValidGame = (overrides = {}) => ({
  basic_info: {
    url_slug: '/games/test',
    title: 'Test Game',
    genres: ['RPG'],
    themes: ['Adventure'],
    modes: {
      single_player: true,
      multiplayer_local: false,
      multiplayer_online: false,
      co_op: false
    },
    ...overrides.basic_info
  },
  release: {
    platforms: [
      {
        name: 'Super Nintendo',
        region: 'Japan',
        release_date: '1996-04-26'
      }
    ],
    ...overrides.release
  },
  serie: {
    is_part_of_serie: false,
    serie_name: null,
    ...overrides.serie
  },
  similar_games: [],
  ...overrides
});

/**
 * Create an invalid game object (missing required fields)
 * @param {Object} overrides - Fields to override
 * @returns {Object} Invalid game object
 */
const createInvalidGame = (overrides = {}) => ({
  basic_info: {
    // Missing required fields
    ...overrides.basic_info
  },
  ...overrides
});

/**
 * Create a game with specific title for search tests
 * @param {string} title - Game title
 * @param {Object} overrides - Additional overrides
 * @returns {Object} Game object
 */
const createGameWithTitle = (title, overrides = {}) =>
  createValidGame({
    basic_info: {
      title,
      url_slug: `/${title.toLowerCase().replace(/\s+/g, '-')}`,
      ...overrides.basic_info
    },
    ...overrides
  });

/**
 * Create mock API response
 * @param {Array} games - Games to include in response
 * @param {Object} overrides - Response overrides
 * @returns {Object} API response object
 */
const createApiResponse = (games = [], overrides = {}) => ({
  success: true,
  data: games,
  count: games.length,
  ...overrides
});

/**
 * Create mock submission data
 * @param {Object} overrides - Fields to override
 * @returns {Object} Submission data object
 */
const createSubmissionData = (overrides = {}) => ({
  title: 'New Game Submission',
  email: 'test@example.com',
  platforms: ['Desktop/Console'],
  notes: 'Test submission',
  ...overrides
});

module.exports = {
  createValidGame,
  createInvalidGame,
  createGameWithTitle,
  createApiResponse,
  createSubmissionData
};
