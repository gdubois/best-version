# Game Creator Implementation - Epics and Stories

This document contains the implementation epics and stories for the Game Creator service, based on the MCP (Model Context Protocol) architecture.

## Architecture Overview

The Game Creator uses a hybrid architecture:
- **MCP Server Process**: Child process exposing DuckDuckGo and Brave search tools via stdio transport
- **LangChain Agent**: Orchestrates research using MCP tools with structured JSON output
- **LLM Client**: Wrapper for remote llama.cpp server (OpenAI-compatible API)
- **Procedural Pipeline**: Cron-triggered processing with queue, validation, storage

## Epic GC-1: MCP Server Infrastructure

**Description**: Set up MCP server process that exposes search tools to the LangChain agent.

**Business Value**: Provides standardized tool interface for the agentic research workflow.

### Story GC-1.1: DuckDuckGo Search Tool

**As a** Game Creator agent
**I want** to search DuckDuckGo for game information
**So that** I can find game details from web sources

**Acceptance Criteria**:
- [ ] Service file created: `src/services/game-creator/duckduckgo.js`
- [ ] Implements search via DuckDuckGo HTML scraping (no API key)
- [ ] Returns structured results: `{ query, results: [{ title, url, snippet }] }`
- [ ] Handles rate limiting (max 1 request/minute)
- [ ] Graceful fallback when DuckDuckGo is unavailable
- [ ] Unit tests for service methods
- [ ] Error handling with proper logging

**Technical Notes**:
- Use HTML scraping approach (no API key available)
- Parse search results from DuckDuckGo HTML response
- Implement request delay for rate limiting
- Timeout: 15 seconds

### Story GC-1.2: Brave Search Tool

**As a** Game Creator agent
**I want** to search Brave using DuckDuckGo backend
**So that** I have a fallback search option

**Acceptance Criteria**:
- [ ] Service file created: `src/services/game-creator/brave.js`
- [ ] Implements search using DuckDuckGo backend API
- [ ] Returns structured results: `{ query, results: [{ title, url, snippet }] }`
- [ ] Handles errors gracefully
- [ ] Unit tests for service methods
- [ ] Configurable via environment variable

**Technical Notes**:
- Uses DuckDuckGo backend: https://api.duckduckgo.com/
- Format: `https://api.duckduckgo.com/?q={query}&format=json`
- Timeout: 15 seconds

### Story GC-1.3: MCP Server Process

**As a** Game Creator service
**I want** to run an MCP server as a child process
**So that** LangChain agent can invoke search tools

**Acceptance Criteria**:
- [ ] MCP server file created: `src/services/game-creator/mcp-server.js`
- [ ] Exposes `duckduckgo_search` tool with proper schema
- [ ] Exposes `brave_search` tool with proper schema
- [ ] Uses stdio transport for communication
- [ ] Can be spawned as child process
- [ ] Proper error handling and logging
- [ ] Can be started/stopped programmatically

**Technical Notes**:
- Use `@modelcontextprotocol/sdk` for server
- Tools registered with descriptions and JSON schemas
- Communication via stdio pipes

### Story GC-1.4: MCP Server Configuration

**As a** Game Creator service
**I want** to configure which search tools are enabled
**So that** I can control available resources

**Acceptance Criteria**:
- [ ] Environment variables: `DUCKDUCKGO_ENABLED`, `BRAVE_SEARCH_ENABLED`
- [ ] MCP server only registers enabled tools
- [ ] Graceful degradation when tools are disabled
- [ ] Configuration validation on startup
- [ ] Documented in `.env.example`

## Epic GC-2: LangChain Agent Integration

**Description**: Integrate LangChain agent with MCP tools for agentic research.

**Business Value**: Enables autonomous decision-making for game research.

### Story GC-2.1: MCP Client Implementation

**As a** Game Creator agent
**I want** to connect to the MCP server via stdio
**So that** I can invoke search tools dynamically

**Acceptance Criteria**:
- [ ] MCP client file created: `src/services/game-creator/mcp-client.js`
- [ ] Spawns MCP server as child process
- [ ] Establishes stdio connection
- [ ] Lists available tools
- [ ] Provides tool invocation interface
- [ ] Graceful process management (start/stop)
- [ ] Unit tests for client operations

**Technical Notes**:
- Use `child_process.spawn` for MCP server
- Manage stdio pipes for communication
- Handle process lifecycle

### Story GC-2.2: LangChain Tool Wrapping

**As a** LangChain agent
**I want** MCP tools converted to LangChain tool format
**So that** I can use them in agent execution

**Acceptance Criteria**:
- [ ] MCP tools converted to LangChain `Tool` objects
- [ ] Tool schema includes name, description, input schema
- [ ] Tool execution returns formatted results
- [ ] Error handling for tool failures
- [ ] Unit tests for tool wrapping

**Technical Notes**:
- LangChain tools: `{ name, description, schema, func }`
- Tool func returns JSON string for agent consumption

### Story GC-2.3: Game Research Agent

**As a** Game Creator service
**I want** a LangChain agent configured for game research
**So that** it can autonomously research game metadata

**Acceptance Criteria**:
- [ ] Agent file created: `src/services/game-creator/agent.js`
- [ ] Agent initialized with search tools
- [ ] System prompt for game research with JSON output requirement
- [ ] Agent executes with user prompt (game title)
- [ ] Returns structured response with research results
- [ ] Unit tests for agent creation and execution

**Technical Notes**:
- Use LangChain.js `AgentExecutor` or `createReactAgent`
- System prompt: "Research this game and output JSON with metadata"
- Tools: duckduckgo_search, brave_search

### Story GC-2.4: JSON Response Parsing

**As a** Game Creator service
**I want** to parse agent output into structured JSON
**So that** I can validate and store game metadata

**Acceptance Criteria**:
- [ ] JSON parsing function in agent module
- [ ] Handles markdown code blocks (```json ... ```)
- [ ] Extracts JSON from text responses
- [ ] Validates against expected schema
- [ ] Returns structured data: `{ success, data, error }`
- [ ] Unit tests for parsing logic

**Technical Notes**:
- Regex to extract JSON from text
- Fallback parsing strategies
- Schema validation

### Story GC-2.5: Agent Research Function

**As a** Game Creator service
**I want** a high-level `researchGameWithAgent()` function
**So that** processor can call it for game research

**Acceptance Criteria**:
- [ ] Function in `agent.js` with signature: `researchGameWithAgent(title)`
- [ ] Starts MCP server if not running
- [ ] Initializes agent with tools
- [ ] Executes agent with game title
- [ ] Parses and validates JSON output
- [ ] Returns research result: `{ metadata, confidence, sourceUrls, error }`
- [ ] Unit and integration tests

**Technical Notes**:
- Orchestrate MCP client, agent, and parsing
- Calculate confidence based on metadata completeness
- Collect source URLs from search results

## Epic GC-3: LLM Client Enhancement

**Description**: Enhance existing LLM client to work with LangChain.

**Business Value**: Enables LangChain to use remote llama.cpp server.

### Story GC-3.1: LangChain LLM Wrapper

**As a** LangChain agent
**I want** to use existing LLM endpoint configuration
**So that** I can connect to remote llama.cpp server

**Acceptance Criteria**:
- [ ] Update `llmClient.js` with LangChain compatibility
- [ ] Expose LangChain `ChatLlamaCpp` or `ChatOpenAI` wrapper
- [ ] Use existing config: `LLM_ENDPOINT`, `LLM_MODEL`, `LLM_TIMEOUT`
- [ ] Supports OpenAI-compatible API format
- [ ] Unit tests for LangChain integration

**Technical Notes**:
- Use `ChatOpenAI` from LangChain for OpenAI-compatible endpoints
- Map existing config to LangChain parameters
- Temperature: 0.2 for structured output

### Story GC-3.2: LLM Configuration Validation

**As a** Game Creator service
**I want** to validate LLM endpoint on startup
**So that** I fail fast if LLM is unavailable

**Acceptance Criteria**:
- [ ] Connection test in `llmClient.js`
- [ ] Test LLM endpoint availability
- [ ] Test basic prompt/response
- [ ] Report configuration status
- [ ] Graceful error messages
- [ ] Unit tests

**Technical Notes**:
- Use existing `testConnection()` function
- Call simple test prompt
- Log configuration details

## Epic GC-4: Processing Pipeline Integration

**Description**: Integrate agent into existing processing pipeline.

**Business Value**: Enables automatic game research with agentic workflow.

### Story GC-4.1: Research Service Update

**As a** processor
**I want** research service to use LangChain agent
**So that** game research is autonomous

**Acceptance Criteria**:
- [ ] Update `research.js` to call `agent.researchGameWithAgent()`
- [ ] Add `researchGameWithAgent(title)` function
- [ ] Map agent output to research result format
- [ ] Handle agent errors gracefully
- [ ] Log agent execution details
- [ ] Unit tests for research service

**Technical Notes**:
- Maintain existing research result format
- Integrate with existing logging

### Story GC-4.2: Processor Agent Integration

**As a** processor
**I want** to call agent research in processing step
**So that** games are researched automatically

**Acceptance Criteria**:
- [ ] Update `processor.js` to use agent research
- [ ] Step 1 calls `researchGameWithAgent()` instead of web search
- [ ] Handle agent research errors
- [ ] Log agent confidence and results
- [ ] Integration tests for processor flow

**Technical Notes**:
- Replace `researchGameWithLLM()` with `researchGameWithAgent()`
- Maintain existing validation and storage flow

### Story GC-4.3: Game Creator Startup

**As a** Game Creator service
**I want** proper startup sequence with agent support
**So that** all components are ready

**Acceptance Criteria**:
- [ ] Update `index.js` startup sequence
- [ ] Initialize LLM client
- [ ] Initialize MCP client (optional, lazy start)
- [ ] Validate configurations
- [ ] Log startup status
- [ ] Graceful shutdown handling
- [ ] Unit tests for startup

**Technical Notes**:
- Start cron scheduler
- MCP server can be lazy-started per request
- Validate LLM endpoint

## Epic GC-5: Image Service (Wikipedia)

**Description**: Implement Wikipedia cover image search and storage.

**Business Value**: Provides game cover images from Wikipedia.

### Story GC-5.1: Wikipedia Cover Image Search

**As a** Game Creator service
**I want** to search Wikipedia for game cover images
**So that** I can find appropriate cover art

**Acceptance Criteria**:
- [ ] Update `wikipedia.js` with `findGameCover()` function
- [ ] Search Wikipedia page for game title
- [ ] Extract infobox image or page images
- [ ] Return image URL with metadata: `{ found, imageUrl, width, height, source }`
- [ ] Handle cases where no image found
- [ ] Unit tests for Wikipedia integration

**Technical Notes**:
- Use Wikipedia API: `https://en.wikipedia.org/w/api.php`
- Action: query, format: json, prop: pageimages|extracts
- Extract images from page infobox or content

### Story GC-5.2: Image Download and Storage

**As a** Game Creator service
**I want** to download and store cover images locally
**So that** images are available for the curator app

**Acceptance Criteria**:
- [ ] Implement `storeGameImage(slug, imageUrl)` in `images.js`
- [ ] Download image from URL
- [ ] Process image (resize to 600px max width using sharp)
- [ ] Store as `images/{slug}.jpg`
- [ ] Handle download errors gracefully
- [ ] Skip if image already exists
- [ ] Unit tests for image storage

**Technical Notes**:
- Use axios for download
- Use sharp for image processing (optional fallback)
- Store in `images/` directory

### Story GC-5.3: Image Fetching Integration

**As a** processor
**I want** to fetch cover image after game approval
**So that** approved games have cover art

**Acceptance Criteria**:
- [ ] Update `processor.js` to call `fetchAndStoreCover()` after auto-approval
- [ ] Pass game title and slug to image service
- [ ] Log image fetch results
- [ ] Handle image fetch failures gracefully (non-blocking)
- [ ] Integration tests

## Epic GC-6: Deployment Configuration

**Description**: Configure deployment for Raspberry Pi.

**Business Value**: Enables production deployment of Game Creator.

### Story GC-6.1: Package Dependencies

**As a** developer
**I want** all MCP and LangChain dependencies in package.json
**So that** deployment includes required packages

**Acceptance Criteria**:
- [ ] Add `@modelcontextprotocol/sdk` to package.json
- [ ] Add `langchain` to package.json
- [ ] Add `@langchain/community` to package.json
- [ ] Add `axios` if not present
- [ ] Add `sharp` for image processing (optional)
- [ ] All dependencies have semver versions
- [ ] `npm install` completes successfully

**Technical Notes**:
- MCP SDK: `@modelcontextprotocol/sdk`
- LangChain: `langchain`, `@langchain/community`
- Sharp: optional peer dependency

### Story GC-6.2: Environment Configuration

**As a** Game Creator service
**I want** environment variables documented and validated
**So that** deployment is configurable

**Acceptance Criteria**:
- [ ] Update `.env.example` with Game Creator variables:
  - `LLM_ENDPOINT`
  - `LLM_MODEL`
  - `LLM_TIMEOUT`
  - `LLM_MAX_RETRIES`
  - `LLM_TEMPERATURE`
  - `LLM_MAX_TOKENS`
  - `DUCKDUCKGO_ENABLED`
  - `BRAVE_SEARCH_ENABLED`
  - `GAME_CREATOR_ENABLED`
- [ ] Document each variable with description
- [ ] Validation in startup sequence
- [ ] Default values for non-critical variables

### Story GC-6.3: Deployment Script

**As a** Raspberry Pi user
**I want** Game Creator to be part of deployment script
**So that** it runs automatically

**Acceptance Criteria**:
- [ ] Update `deploy.sh` or equivalent deployment script
- [ ] Install dependencies: `npm install`
- [ ] Enable Game Creator in service config
- [ ] Set environment variables
- [ ] Start Game Creator service (PM2 or systemd)
- [ ] Verify LLM endpoint connectivity
- [ ] Test with sample game submission

## Epic GC-7: Testing and Validation

**Description**: Implement comprehensive testing for MCP and agent components.

**Business Value**: Ensures reliability of agentic workflow.

### Story GC-7.1: Unit Tests

**As a** developer
**I want** unit tests for all new components
**So that** code quality is maintained

**Acceptance Criteria**:
- [ ] Unit tests for `duckduckgo.js`
- [ ] Unit tests for `brave.js`
- [ ] Unit tests for `mcp-client.js`
- [ ] Unit tests for `agent.js`
- [ ] Unit tests for `wikipedia.js` cover search
- [ ] Unit tests for `images.js`
- [ ] Test coverage > 80%

**Technical Notes**:
- Use Jest or existing test framework
- Mock external dependencies (MCP server, LLM, APIs)

### Story GC-7.2: Integration Tests

**As a** developer
**I want** integration tests for agent workflow
**So that** end-to-end functionality is validated

**Acceptance Criteria**:
- [ ] Integration test: full research flow with agent
- [ ] Integration test: processor pipeline with agent
- [ ] Integration test: image fetch and storage
- [ ] Mock LLM endpoint for testing (optional)
- [ ] Document test setup requirements

**Technical Notes**:
- Use test LLM endpoint or mock
- Test with sample game titles
- Validate JSON output structure

### Story GC-7.3: Manual Testing Guide

**As a** QA engineer
**I want** manual testing procedures documented
**So that** I can validate before production

**Acceptance Criteria**:
- [ ] Document test cases for manual testing
- [ ] List of test game titles with known results
- [ ] Expected behavior for each test case
- [ ] Troubleshooting guide for common issues
- [ ] Validation checklist for deployment

## Epic GC-8: Monitoring and Observability (Future)

**Description**: Add monitoring for agent execution and MCP tools.

**Business Value**: Enables troubleshooting and optimization.

### Story GC-8.1: Agent Execution Logging

**As a** developer
**I want** detailed logs of agent execution
**So that** I can debug agent decisions

**Acceptance Criteria**:
- [ ] Log agent prompts and responses
- [ ] Log tool calls and results
- [ ] Log execution time and token usage
- [ ] Structured logging format
- [ ] Redaction of sensitive data

### Story GC-8.2: MCP Server Health Monitoring

**As a** operations engineer
**I want** health checks for MCP server
**So that** I know if it's functioning

**Acceptance Criteria**:
- [ ] Health check endpoint for MCP server
- [ ] Process health monitoring
- [ ] Auto-restart on crash
- [ ] Alert on repeated failures

## Implementation Order

1. **Phase 1: Foundation** (GC-6.1, GC-6.2) - Dependencies and configuration
2. **Phase 2: MCP Server** (GC-1.1, GC-1.2, GC-1.3, GC-1.4) - Search tools and server
3. **Phase 3: Agent Integration** (GC-2.1, GC-2.2, GC-2.3, GC-2.4, GC-2.5) - LangChain agent
4. **Phase 4: LLM Enhancement** (GC-3.1, GC-3.2) - LangChain LLM wrapper
5. **Phase 5: Pipeline Integration** (GC-4.1, GC-4.2, GC-4.3) - Processor updates
6. **Phase 6: Image Service** (GC-5.1, GC-5.2, GC-5.3) - Wikipedia images
7. **Phase 7: Testing** (GC-7.1, GC-7.2, GC-7.3) - Comprehensive testing
8. **Phase 8: Deployment** (GC-6.3) - Production deployment
9. **Phase 9: Monitoring** (GC-8.1, GC-8.2) - Future enhancement

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| DuckDuckGo HTML scraping breaks | Implement multiple parsing strategies, fallback to Brave |
| MCP server process crashes | Auto-restart mechanism, process health monitoring |
| LangChain agent fails to produce JSON | Multiple parsing strategies, fallback to procedural research |
| LLM endpoint unavailable | Connection test on startup, graceful error messages |
| Wikipedia image search fails | Non-blocking image fetch, continue without image |

## Success Criteria

- [ ] Agent successfully researches game with complete metadata (>80% fields)
- [ ] MCP tools invoked correctly by agent
- [ ] JSON output parsed and validated successfully
- [ ] Cover images fetched and stored for known games
- [ ] End-to-end processing works for sample games
- [ ] Deployment on Raspberry Pi successful
- [ ] All unit tests passing
- [ ] Integration tests passing
