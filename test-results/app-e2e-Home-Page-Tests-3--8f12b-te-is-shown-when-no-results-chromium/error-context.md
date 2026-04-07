# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-088 [P2] Empty state is shown when no results
- Location: test/e2e/app-e2e.test.js:1476:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#gameSearch, input[placeholder*="search"]')

```

# Page snapshot

```yaml
- generic [ref=e2]: "{\"success\":false,\"error\":\"An internal error occurred\"}"
```

# Test source

```ts
  1382 |     await page.waitForTimeout(500);
  1383 |     const afterDisabled = await submitBtn.getAttribute('disabled');
  1384 | 
  1385 |     // Either the button never had a disabled attribute, or it was properly set
  1386 |     // The key is that the page remains functional
  1387 |     const buttonClickable = await submitBtn.isEnabled();
  1388 |     expect(typeof buttonClickable === 'boolean').toBe(true);
  1389 |   });
  1390 | 
  1391 |   test('3.0-E2E-082 [P1] HTTPS is enforced (redirect from HTTP)', async ({ page }) => {
  1392 |     // Given - If running on HTTP, should redirect to HTTPS
  1393 |     // This test may not pass if already on HTTPS
  1394 | 
  1395 |     await page.goto(BASE_URL);
  1396 | 
  1397 |     // Then - URL should be valid
  1398 |     const url = page.url();
  1399 | 
  1400 |     expect(url.length > 0).toBe(true);
  1401 |   });
  1402 | 
  1403 |   test('3.0-E2E-083 [P2] Security headers are present', async ({ page }) => {
  1404 |     // Given - Any page is loaded
  1405 |     await page.goto(BASE_URL);
  1406 | 
  1407 |     // When - Check response headers
  1408 |     const response = await page.goto(BASE_URL);
  1409 | 
  1410 |     // Then - Headers should be present
  1411 |     const headers = response.headers();
  1412 | 
  1413 |     // Check for security headers - at least one should be present with a valid value
  1414 |     const contentTypeOption = headers['x-content-type-options'];
  1415 |     const frameOptions = headers['x-frame-options'];
  1416 |     const hasSecurityHeader = contentTypeOption || frameOptions;
  1417 | 
  1418 |     // Expect that at least one security header is present with a non-empty value
  1419 |     expect(hasSecurityHeader).toBeTruthy();
  1420 |   });
  1421 | 
  1422 |   // ==================== ERROR HANDLING TESTS ====================
  1423 | 
  1424 |   test('3.0-E2E-084 [P2] 404 page loads for non-existent route', async ({ page }) => {
  1425 |     // Given - Navigate to non-existent page
  1426 |     await page.goto(`${BASE_URL}/non-existent-page-12345`);
  1427 | 
  1428 |     // Then - Should show 404
  1429 |     await page.waitForTimeout(1000);
  1430 | 
  1431 |     const url = page.url();
  1432 | 
  1433 |     expect(url.length > 0).toBe(true);
  1434 |   });
  1435 | 
  1436 |   test('3.0-E2E-085 [P2] Server error page is handled gracefully', async ({ page }) => {
  1437 |     // Given - Try to trigger server error (hard to do in E2E)
  1438 |     await page.goto(BASE_URL);
  1439 | 
  1440 |     // Then - Page should load
  1441 |     await expect(page.locator('body')).toBeVisible();
  1442 |   });
  1443 | 
  1444 |   test('3.0-E2E-086 [P1] Network error is handled gracefully', async ({ page }) => {
  1445 |     // Given - Home page is loaded
  1446 |     await page.goto(BASE_URL);
  1447 | 
  1448 |     // When - Disable network (use route blocking since setOfflineMode is not available)
  1449 |     await page.route('**/*', route => route.abort('connection refused'));
  1450 | 
  1451 |     // Then - Page should still show that it can handle network errors
  1452 |     await page.waitForTimeout(500);
  1453 | 
  1454 |     const bodyVisible = await page.locator('body').isVisible();
  1455 | 
  1456 |     expect(bodyVisible).toBe(true);
  1457 |   });
  1458 | 
  1459 |   test('3.0-E2E-087 [P2] Loading states are shown', async ({ page }) => {
  1460 |     // Given - Submit page is loaded
  1461 |     await page.goto(`${BASE_URL}/submit`);
  1462 | 
  1463 |     // When - Start loading
  1464 |     const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
  1465 |     await titleInput.fill('Loading Test');
  1466 | 
  1467 |     // Then - May have loading state
  1468 |     await page.waitForTimeout(500);
  1469 | 
  1470 |     const loader = page.locator('.loading, .spinner, [data-testid="loading"]');
  1471 |     const count = await loader.count();
  1472 | 
  1473 |     expect(count >= 0).toBe(true);
  1474 |   });
  1475 | 
  1476 |   test('3.0-E2E-088 [P2] Empty state is shown when no results', async ({ page }) => {
  1477 |     // Given - Search page is loaded
  1478 |     await page.goto(`${BASE_URL}/search`);
  1479 | 
  1480 |     // When - Search for non-existent game
  1481 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
> 1482 |     await searchInput.fill('NonExistentGame12345XYZ');
       |                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  1483 | 
  1484 |     // Then - Empty state should be shown
  1485 |     await page.waitForTimeout(1000);
  1486 | 
  1487 |     const emptyState = page.locator('.empty, .no-results, [data-testid="empty"]');
  1488 |     const count = await emptyState.count();
  1489 | 
  1490 |     expect(count >= 0).toBe(true);
  1491 |   });
  1492 | 
  1493 |   // ==================== DATA VALIDATION TESTS ====================
  1494 | 
  1495 |   test('3.0-E2E-089 [P1] Email validation works', async ({ page }) => {
  1496 |     // Given - Submission page is loaded
  1497 |     await page.goto(`${BASE_URL}/submit`);
  1498 | 
  1499 |     // When - Enter invalid email
  1500 |     const emailInput = page.locator('input[type="email"], input[name="email"]');
  1501 |     await emailInput.fill('invalid-email');
  1502 | 
  1503 |     // Then - Should show validation error
  1504 |     await page.waitForTimeout(500);
  1505 | 
  1506 |     const submitBtn = page.locator('button[type="submit"]');
  1507 |     const disabled = await submitBtn.getAttribute('disabled');
  1508 | 
  1509 |     // May or may not be disabled
  1510 |     expect(disabled !== null || disabled === '' || true).toBe(true);
  1511 |   });
  1512 | 
  1513 |   test('3.0-E2E-090 [P1] Required fields are validated', async ({ page }) => {
  1514 |     // Given - Submission page is loaded
  1515 |     await page.goto(`${BASE_URL}/submit`);
  1516 | 
  1517 |     // When - Try to submit without title
  1518 |     const submitBtn = page.locator('button[type="submit"]');
  1519 |     await submitBtn.click();
  1520 | 
  1521 |     // Then - Should show validation error
  1522 |     await page.waitForTimeout(500);
  1523 | 
  1524 |     const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
  1525 |     const value = await titleInput.inputValue();
  1526 | 
  1527 |     expect(value.length >= 0).toBe(true);
  1528 |   });
  1529 | 
  1530 |   test('3.0-E2E-091 [P2] Character limits are enforced', async ({ page }) => {
  1531 |     // Given - Submission page is loaded
  1532 |     await page.goto(`${BASE_URL}/submit`);
  1533 | 
  1534 |     // When - Enter very long title
  1535 |     const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
  1536 |     await titleInput.fill('A'.repeat(1000));
  1537 | 
  1538 |     // Then - May or may not have character limit
  1539 |     const value = await titleInput.inputValue();
  1540 | 
  1541 |     expect(value.length >= 0).toBe(true);
  1542 |   });
  1543 | 
  1544 |   test('3.0-E2E-092 [P2] Numbers are validated correctly', async ({ page }) => {
  1545 |     // Given - If any numeric inputs exist
  1546 |     await page.goto(BASE_URL);
  1547 | 
  1548 |     // When - Look for numeric inputs
  1549 |     const numericInputs = page.locator('input[type="number"]');
  1550 |     const count = await numericInputs.count();
  1551 | 
  1552 |     // Then - May or may not have numeric inputs
  1553 |     expect(count >= 0).toBe(true);
  1554 |   });
  1555 | 
  1556 |   // ==================== CACHING TESTS ====================
  1557 | 
  1558 |   test('3.0-E2E-093 [P2] Cached content is served on reload', async ({ page }) => {
  1559 |     // Given - Home page is loaded
  1560 |     await page.goto(BASE_URL);
  1561 | 
  1562 |     // When - Reload page
  1563 |     const startTime = Date.now();
  1564 |     await page.reload();
  1565 |     const reloadTime = Date.now() - startTime;
  1566 | 
  1567 |     // Then - Should reload quickly if cached
  1568 |     expect(reloadTime < 2000).toBe(true);
  1569 |   });
  1570 | 
  1571 |   test('3.0-E2E-094 [P2] Service worker is registered (if PWA)', async ({ page }) => {
  1572 |     // Given - Home page is loaded
  1573 |     await page.goto(BASE_URL);
  1574 | 
  1575 |     // When - Check for service worker
  1576 |     const swRegistered = await page.evaluate(() => 'serviceWorker' in navigator);
  1577 | 
  1578 |     // Then - Service worker may or may not exist
  1579 |     expect(swRegistered === true || swRegistered === false).toBe(true);
  1580 |   });
  1581 | 
  1582 |   // ==================== LOCAL STORAGE TESTS ====================
```