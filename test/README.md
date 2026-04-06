# Test Suite Documentation

## Overview

This project has comprehensive test coverage including:

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test full user workflows in the browser

## Test Frameworks

### Unit Tests - Jest

- **Location**: `test/`
- **Framework**: Jest
- **Command**: `npm test`

### Integration Tests - Supertest

- **Location**: `test/integration/`
- **Framework**: Jest + Supertest
- **Command**: `npm run test:integration`

### E2E Tests - Playwright

- **Location**: `test/e2e/`
- **Framework**: Playwright
- **Command**: `npm run test:e2e`

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- test/routes/games.test.js

# Run unit tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run E2E tests for specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run all tests
npm run test:all
```

## Test Structure

```
test/
├── config/                    # Config tests
│   └── index.test.js
├── games/                     # Game fixture data
├── middleware/                # Middleware tests
│   ├── adminAuth.test.js
│   ├── cacheControl.test.js
│   ├── concurrency.test.js
│   ├── hCaptcha.test.js
│   ├── httpsEnforcer.test.js
│   ├── performance.test.js
│   ├── rateLimiter.test.js
│   ├── sanitize.test.js
│   ├── security.test.js
│   └── userAgentBlocker.test.js
├── routes/                    # Route tests
│   └── games.test.js
├── services/                  # Service tests
│   ├── adminDashboardService.test.js
│   ├── backupService.test.js
│   ├── cacheService.test.js
│   ├── dataCaching.test.js
│   ├── deletionRequestService.test.js
│   ├── dmcaService.test.js
│   ├── emailService.test.js
│   ├── gameAPI.test.js
│   ├── gameLoader.test.js
│   ├── inappropriateLanguageFilter.test.js
│   ├── newsletterService.test.js
│   ├── storageService.test.js
│   └── submissionService.test.js
├── utils/                     # Utility tests
│   ├── romanNumeral.test.js
│   └── validators.test.js
├── integration/               # API integration tests
│   └── api.test.js
├── e2e/                       # E2E tests
│   └── app-e2e.test.js
├── utils/                     # Test utilities
│   └── factories.js
└── README.md

```

## Test IDs

Each test has an ID for tracking:

- **1.0-UTIL-XXX**: Unit tests for utilities
- **1.0-RTE-XXX**: Route tests
- **1.0-MW-XXX**: Middleware tests
- **1.0-SRV-XXX**: Service tests
- **1.0-CONF-XXX**: Config tests
- **2.0-INT-XXX**: Integration tests
- **3.0-E2E-XXX**: E2E tests

Priority levels:
- **P0**: Critical (must always pass)
- **P1**: High priority (core functionality)
- **P2**: Important (nice to have)

## Test Helpers

### Factories

Located in `test/utils/factories.js`:

- `createMockGameAPI()` - Mock GameAPI instance
- `createMockSubmissionService()` - Mock submission service
- `createMockNewsletterService()` - Mock newsletter service
- `createMockDeletionRequestService()` - Mock deletion request service
- `createMockDmcaService()` - Mock DMCA service
- `createMockReq()` - Mock request object
- `createMockRes()` - Mock response object
- `createTempDirs()` - Create temporary directories for tests

## API Integration Tests

Located in `test/integration/api.test.js`:

- Tests 2.0-INT-001 to 2.0-INT-100
- Covers all API endpoints
- Tests status codes, response formats, error handling
- Tests rate limiting and security

## E2E Tests

Located in `test/e2e/app-e2e.test.js`:

- Tests 3.0-E2E-001 to 3.0-E2E-100
- Covers home page, search, game details, submission
- Tests responsiveness, accessibility, security
- Tests across multiple browsers (Chrome, Firefox, WebKit)

## Environment Variables

- `BASE_URL`: Base URL for E2E tests (default: http://localhost:3000)
- `COOKIE_SECRET`: Required for admin authentication tests

## Adding New Tests

### Unit Test Example

```javascript
test('1.0-XXX-XXX [P1] Description', () => {
  // Given
  const input = 'test value';

  // When
  const result = someFunction(input);

  // Then
  expect(result).toBe(expected);
});
```

### Integration Test Example

```javascript
test('2.0-INT-XXX [P1] API endpoint test', async () => {
  // Given
  const mockData = { key: 'value' };

  // When
  const response = await request(app)
    .get('/api/endpoint')
    .expect('Content-Type', /json/);

  // Then
  expect(response.status).toBe(200);
  expect(response.body.data).toEqual(mockData);
});
```

### E2E Test Example

```javascript
test('3.0-E2E-XXX [P1] User workflow test', async ({ page }) => {
  // Given
  await page.goto('/page');

  // When
  await page.click('button');

  // Then
  await expect(page.locator('.result')).toBeVisible();
});
```

## CI/CD Integration

For CI/CD, run:

```bash
# In CI environment
npm run test:all -- --ci
```

For Playwright in CI:
```bash
npx playwright install --with-deps
npm run test:e2e
```

## Troubleshooting

### Tests failing due to server not running

Ensure the server is running:
```bash
npm start
```

### Playwright browsers not installed

Install Playwright browsers:
```bash
npx playwright install
```

### Supertest not found

Install supertest:
```bash
npm install --save-dev supertest
```

### Module not found errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user workflows covered

## Performance

- Unit tests should complete in < 30 seconds
- Integration tests should complete in < 60 seconds
- E2E tests should complete in < 5 minutes
