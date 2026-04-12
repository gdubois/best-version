# Open WebSearch MCP Integration

This document explains how the open-webSearch MCP service from [Aas-ee/open-webSearch](https://github.com/Aas-ee/open-webSearch) is integrated into the game-creator service.

## Overview

The open-webSearch MCP package provides multi-engine web search capabilities without requiring API keys. It supports the following search engines:

- Bing
- DuckDuckGo
- Exa
- Brave
- Baidu
- CSDN
- Juejin
- Startpage

## Installation

```bash
npm install open-websearch
```

## Configuration

The open-webSearch MCP service can be configured using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPEN_WEBSEARCH_MCP_ENABLED` | `true` | Enable/disable the open-webSearch MCP tool |
| `OPEN_WEBSEARCH_MCP_ENGINE` | `duckduckgo` | Default search engine to use |
| `OPEN_WEBSEARCH_MCP_HOST` | `http://localhost:3000` | Host URL for the open-webSearch HTTP API |
| `OPEN_WEBSEARCH_MCP_ENDPOINT` | `/search` | Endpoint path for search requests |
| `MODE` | `both` | Server mode: `both`, `http`, or `stdio` |
| `USE_PROXY` | `false` | Enable HTTP proxy for restricted regions |
| `PROXY_URL` | `http://127.0.0.1:7890` | Proxy server URL |

## Usage in Game Creator

The open-webSearch MCP tool is automatically called by the game-creator agent when researching games. It performs additional searches with diverse engine results to complement the existing DuckDuckGo, Brave, and Open WebSearch services.

### Search Workflow

1. The agent performs initial searches using DuckDuckGo (3 queries)
2. Then uses Brave search (2 queries)
3. Then uses Open WebSearch API (3 queries)
4. **Finally uses open-webSearch MCP** (1 combined query with multiple engines)

This multi-source approach ensures comprehensive game metadata discovery, especially for:
- Retro games with patches
- Uncensored versions
- Multiple platform releases
- Remasters and remakes

## Running the Open WebSearch Server

The open-webSearch MCP package requires a local HTTP server to be running. You can start it in several ways:

### Option 1: Using npm (recommended)

```bash
# Install globally
npm install -g open-websearch

# Start the server
open-websearch serve

# Or using npx (no global install)
npx open-websearch@latest
```

### Option 2: Using environment variables

```bash
# Linux/macOS
MODE=http PORT=3000 DEFAULT_SEARCH_ENGINE=duckduckgo npx open-websearch@latest

# Windows PowerShell
$env:MODE="http"; $env:PORT="3000"; $env:DEFAULT_SEARCH_ENGINE="duckduckgo"; npx open-websearch@latest
```

### Option 3: Docker

```bash
docker run -d --name open-websearch -p 3000:3000 -e ENABLE_CORS=true ghcr.io/aas-ee/open-web-search:latest
```

## Testing

### Test the MCP Tool

```bash
# Start the open-webSearch server first
npx open-websearch@latest

# Then test from the game-creator
node -e "
const agent = require('./src/services/game-creator/agent');
agent.performSearches('Super Mario Bros').then(console.log).catch(console.error);
"
```

### Test the HTTP API Directly

```bash
# Start server first, then test
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Super Mario Bros video game","limit":10}'
```

## Production Deployment

For production deployment, ensure the following:

1. **Install the package**:
   ```bash
   npm install open-websearch
   ```

2. **Configure environment variables** in your `.env` or deployment config:
   ```env
   OPEN_WEBSEARCH_MCP_ENABLED=true
   OPEN_WEBSEARCH_MCP_ENGINE=duckduckgo
   OPEN_WEBSEARCH_MCP_HOST=http://localhost:3000
   ```

3. **Start the open-webSearch service** as part of your deployment:
   ```bash
   # Add to your startup scripts
   npm run serve:open-websearch &
   npm start
   ```

4. **Add to package.json scripts** (optional):
   ```json
   {
     "scripts": {
       "serve:open-websearch": "MODE=http PORT=3000 DEFAULT_SEARCH_ENGINE=duckduckgo npx open-websearch@latest",
       "start:all": "npm run serve:open-websearch & npm start"
     }
   }
   ```

## Troubleshooting

### "open-webSearch MCP unavailable"

This error means the open-webSearch HTTP server is not running or not accessible.

**Solution**: Start the server:
```bash
npx open-websearch@latest
```

### "Timeout waiting for MCP server to start"

The MCP server took too long to initialize.

**Solution**: Increase the timeout:
```env
MCP_TIMEOUT=120000
```

### Search returns empty results

The default search engine might be blocked in your region.

**Solution**: Try a different engine:
```env
OPEN_WEBSEARCH_MCP_ENGINE=brave
```

Or enable proxy:
```env
USE_PROXY=true
PROXY_URL=http://127.0.0.1:7890
```

### Proxy Configuration (for restricted regions)

If you're in a region where some search engines are blocked:

```bash
# For installation
npm --proxy http://127.0.0.1:7890 --https-proxy http://127.0.0.1:7890 install open-websearch

# For runtime
USE_PROXY=true PROXY_URL=http://127.0.0.1:7890 npx open-websearch@latest
```

## MCP Tools Available

The open-webSearch MCP package provides these tools:

| Tool | Description |
|------|-------------|
| `search` | Multi-engine web search |
| `fetchWebContent` | Fetch content from HTTP(S) URLs |
| `fetchGithubReadme` | Fetch GitHub README files |
| `fetchCsdnArticle` | Fetch CSDN blog articles |
| `fetchJuejinArticle` | Fetch Juejin articles |
| `fetchLinuxDoArticle` | Fetch Linux.do forum posts |

## Rate Limiting

Since this tool uses scraping, be aware of rate limits:

- Maintain reasonable search frequency
- Use the `limit` parameter judiciously
- Add delays between searches when necessary

## License

This integration uses the open-webSearch package which is available at [https://github.com/Aas-ee/open-webSearch](https://github.com/Aas-ee/open-webSearch).

Please comply with the terms of service of the underlying search engines.
