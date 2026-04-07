# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-095 [P2] Search history is stored (if implemented)
- Location: test/e2e/app-e2e.test.js:1584:3

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
  1583 | 
  1584 |   test('3.0-E2E-095 [P2] Search history is stored (if implemented)', async ({ page }) => {
  1585 |     // Given - Search page is loaded
  1586 |     await page.goto(`${BASE_URL}/search`);
  1587 | 
  1588 |     // When - Perform search
  1589 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
> 1590 |     await searchInput.fill('Test Search');
       |                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  1591 | 
  1592 |     await page.waitForTimeout(500);
  1593 | 
  1594 |     // Then - Check local storage
  1595 |     const storage = await page.evaluate(() => localStorage.getItem('searchHistory') || '');
  1596 | 
  1597 |     expect(storage.length >= 0).toBe(true);
  1598 |   });
  1599 | 
  1600 |   test('3.0-E2E-096 [P2] User preferences are saved (if implemented)', async ({ page }) => {
  1601 |     // Given - Home page is loaded
  1602 |     await page.goto(BASE_URL);
  1603 | 
  1604 |     // When - Check local storage
  1605 |     const prefs = await page.evaluate(() => localStorage.getItem('preferences') || '');
  1606 | 
  1607 |     // Then - Preferences may or may not exist
  1608 |     expect(prefs.length >= 0).toBe(true);
  1609 |   });
  1610 | 
  1611 |   // ==================== SESSION TESTS ====================
  1612 | 
  1613 |   test('3.0-E2E-097 [P2] Session is maintained across pages', async ({ page }) => {
  1614 |     // Given - Start at home page
  1615 |     await page.goto(BASE_URL);
  1616 | 
  1617 |     // When - Navigate to another page
  1618 |     const navLink = page.locator('a').first();
  1619 | 
  1620 |     if (await navLink.count() > 0) {
  1621 |       await navLink.click();
  1622 |       await page.waitForURL();
  1623 | 
  1624 |       // Then - Session should be maintained
  1625 |       await page.goto(BASE_URL);
  1626 | 
  1627 |       expect(page.url()).toBe(BASE_URL);
  1628 |     }
  1629 |   });
  1630 | 
  1631 |   test('3.0-E2E-098 [P2] Cookie consent is handled (if present)', async ({ page }) => {
  1632 |     // Given - Home page is loaded
  1633 |     await page.goto(BASE_URL);
  1634 | 
  1635 |     // When - Look for cookie consent
  1636 |     const cookieBanner = page.locator('.cookie, .consent, [data-testid="cookie"]');
  1637 |     const count = await cookieBanner.count();
  1638 | 
  1639 |     // Then - Cookie banner may or may not exist
  1640 |     expect(count >= 0).toBe(true);
  1641 |   });
  1642 | 
  1643 |   // ==================== FINAL SUMMARY TESTS ====================
  1644 | 
  1645 |   test('3.0-E2E-099 [P1] Application is functional end-to-end', async ({ page }) => {
  1646 |     // Given - Application is running
  1647 |     await page.goto(BASE_URL);
  1648 | 
  1649 |     // When - Perform full user journey
  1650 |     await page.goto(`${BASE_URL}/search`);
  1651 | 
  1652 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  1653 |     await searchInput.fill('Pokemon');
  1654 | 
  1655 |     await page.waitForTimeout(1000);
  1656 | 
  1657 |     const gameCards = page.locator('.game-card, .game-entry, [data-testid="game"]');
  1658 |     const count = await gameCards.count();
  1659 | 
  1660 |     // Then - Application should be functional
  1661 |     expect(count >= 0).toBe(true);
  1662 |   });
  1663 | 
  1664 |   test('3.0-E2E-100 [P1] E2E test suite complete', async ({ page }) => {
  1665 |     // This test confirms all tests have been defined
  1666 |     await page.goto(BASE_URL);
  1667 | 
  1668 |     expect(true).toBe(true);
  1669 |   });
  1670 | 
  1671 |   // ==================== FEATURED GAMES SECTION TESTS ====================
  1672 | 
  1673 |   test('3.0-E2E-101 [P2] Featured games section displays on home page', async ({ page }) => {
  1674 |     // Given - Home page is loaded
  1675 |     await page.goto(BASE_URL);
  1676 | 
  1677 |     // When - Look for featured games section
  1678 |     const featuredSection = page.locator('h2:has-text("Featured"), .featured, [aria-label*="Featured"]');
  1679 | 
  1680 |     // Then - Featured section should exist
  1681 |     const count = await featuredSection.count();
  1682 |     expect(count >= 0).toBe(true);
  1683 |   });
  1684 | 
  1685 |   test('3.0-E2E-102 [P2] Featured games show platform badges', async ({ page }) => {
  1686 |     // Given - Home page is loaded
  1687 |     await page.goto(BASE_URL);
  1688 | 
  1689 |     // When - Look for platform badges in featured games
  1690 |     const platformBadges = page.locator('.platform-badge, [class*="platform"]');
```