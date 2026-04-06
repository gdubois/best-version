// Configuration settings for the game metadata application

const path = require('path');

const config = {
  // Server settings
  port: process.env.PORT || 3000,

  // Directory paths
  gamesDir: path.join(__dirname, '../../games'),
  schemaPath: path.join(__dirname, '../../game_metadata_schema.json'),

  // Application settings
  env: process.env.NODE_ENV || 'development',

  // Data caching
  cacheEnabled: true,

  // Validation settings
  strictValidation: process.env.STRICT_VALIDATION === 'true'
};

module.exports = config;
