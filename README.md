# Game Metadata Application

A Node.js API application for querying and searching game metadata.

## Features

- **Game Data Loading**: Load and parse game metadata from JSON files
- **Schema Validation**: Validate game data against JSON schema
- **Search Functionality**: Search games by title, genre, and theme
- **Filtering**: Filter games by platform, difficulty, and reception score
- **Recommendations**: Get similar games based on genres and themes
- **RESTful API**: Complete API endpoints for all operations

## Project Structure

```
.
├── src/
│   ├── index.js              # Application entry point
│   ├── config/
│   │   └── index.js          # Configuration settings
│   ├── services/
│   │   ├── gameLoader.js     # Game data loading
│   │   └── gameAPI.js        # Game data API
│   ├── utils/
│   │   └── validators.js     # Schema validators
│   └── routes/
│       └── games.js          # API routes
├── games/                    # Game JSON data files
├── test/
│   └── index.js              # Test suite
├── game_metadata_schema.json # JSON schema for validation
└── package.json
```

## Installation

```bash
npm install
```

## Running the Application

```bash
# Start the server
npm start

# Server runs on http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/games` | GET | Get all games |
| `/api/games/:slug` | GET | Get game by URL slug |
| `/api/games/search?q=` | GET | Search games by title |
| `/api/games/genre/:genre` | GET | Get games by genre |
| `/api/games/theme/:theme` | GET | Get games by theme |
| `/api/games/platform/:platform` | GET | Get games by platform |
| `/api/games/:slug/similar` | GET | Get similar games |
| `/api/games/difficulty` | GET | Filter by difficulty rating |
| `/api/games/reception` | GET | Filter by reception score |
| `/api/games/filters` | GET | Get available filters |

## Testing

```bash
npm test
```

All 11 tests should pass.

## Data Format

Game data is stored as JSON files in the `games/` directory. Each file follows the schema defined in `game_metadata_schema.json`.

Example:
```json
{
  "basic_info": {
    "url_slug": "/games/pokemon-emerald",
    "title": "Pokemon Emerald",
    "genres": ["JRPG", "Adventure"],
    "themes": ["hero's journey", "mythology"],
    "difficulty_rating": 3,
    "reception_score": 9.2
  },
  "release": {
    "platforms": [
      {
        "name": "Nintendo Switch",
        "region": "World",
        "release_date": "2019-11-15"
      }
    ]
  },
  "description": {
    "synopsis": "The enhanced version of Pokemon Ruby and Sapphire.",
    "key_features": ["New storyline", "Battle Frontier"],
    "long_description": "..."
  }
}
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)
- `STRICT_VALIDATION` - Enable strict validation (default: false)

## License

ISC
# best-version
# best-version
