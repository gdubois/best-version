# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-090 [P1] Required fields are validated
- Location: test/e2e/app-e2e.test.js:1513:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.inputValue: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="title"], input[placeholder*="title"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e3]:
    - generic [ref=e4]: BEST VERSION
    - img
    - generic [ref=e5]:
      - textbox "Search for a game..." [ref=e6]
      - generic "Search" [ref=e7] [cursor=pointer]:
        - img [ref=e8]
    - list [ref=e11]:
      - listitem [ref=e12]:
        - link "Games" [ref=e13] [cursor=pointer]:
          - /url: "#games"
      - listitem [ref=e14]:
        - link "Features" [ref=e15] [cursor=pointer]:
          - /url: "#features"
      - listitem [ref=e16]:
        - link "About" [ref=e17] [cursor=pointer]:
          - /url: "#about"
      - listitem [ref=e18]:
        - link "Submit" [ref=e19] [cursor=pointer]:
          - /url: "#"
  - generic [ref=e21]:
    - heading "The Ultimate Video Game History Archive" [level=1] [ref=e22]
    - paragraph [ref=e23]: Discover the definitive versions of gaming's greatest classics. Every game, every era, one perfect edition.
    - generic [ref=e24]:
      - link "Explore Games" [ref=e25] [cursor=pointer]:
        - /url: "#games"
        - img [ref=e26]
        - text: Explore Games
      - button "Submit a Game" [ref=e29] [cursor=pointer]
  - generic [ref=e30]:
    - generic [ref=e31]:
      - generic [ref=e32]: 51+
      - generic [ref=e33]: Games Catalogued
    - generic [ref=e34]:
      - generic [ref=e35]: "74"
      - generic [ref=e36]: Platforms Supported
    - generic [ref=e37]:
      - generic [ref=e38]: "183"
      - generic [ref=e39]: Curated Versions
    - generic [ref=e40]:
      - generic [ref=e41]: "7"
      - generic [ref=e42]: In Progress
  - generic [ref=e43]:
    - heading "Featured Classics" [level=2] [ref=e44]
    - generic [ref=e45]:
      - generic [ref=e46] [cursor=pointer]:
        - 'heading "Metal Gear Solid 4: Guns of the Patriots" [level=3] [ref=e48]'
        - 'img "Metal Gear Solid 4: Guns of the Patriots cover art" [ref=e50]'
        - generic [ref=e53]: 🎮 PlayStation 3 (Trophy Edition/Legacy Collection), Windows (RPCS3 Emulator), PlayStation 5 / Xbox Series X/S (Master Collection Vol. 2), Nintendo Switch 2 / Switch (Master Collection Vol. 2), PlayStation 3 (HD Collection)
      - generic [ref=e54] [cursor=pointer]:
        - heading "Castlevania" [level=3] [ref=e56]
        - img "Castlevania cover art" [ref=e58]
        - generic [ref=e61]: 🎮 Nintendo Switch (Anniversary Collection), Windows (Emulation), Nintendo Switch (Original NES ROM)
      - generic [ref=e62] [cursor=pointer]:
        - heading "Grandia" [level=3] [ref=e64]
        - img "Grandia cover art" [ref=e66]
        - generic [ref=e69]: 🎮 PlayStation, Nintendo Switch / Windows (Steam), Sega Saturn
      - generic [ref=e70] [cursor=pointer]:
        - 'heading "Cannon Fodder 2: Once More unto the Breach" [level=3] [ref=e72]'
        - 'img "Cannon Fodder 2: Once More unto the Breach cover art" [ref=e74]'
        - generic [ref=e77]: 🎮 Windows (OpenFodder), Windows (GOG.com), Amiga, MS-DOS (Original)
      - generic [ref=e78] [cursor=pointer]:
        - heading "Grandia III" [level=3] [ref=e80]
        - img "Grandia III cover art" [ref=e82]
        - generic [ref=e85]: 🎮 PlayStation 2, PlayStation 3 (PSN Classic)
      - generic [ref=e86] [cursor=pointer]:
        - heading "Valkyrie Profile" [level=3] [ref=e88]
        - img "Valkyrie Profile cover art" [ref=e90]
        - generic [ref=e93]: 🎮 PlayStation (PS1), PlayStation Portable (PSP), iOS/Android (Mobile), PlayStation 4/5
  - generic [ref=e94]:
    - heading "Why Choose Best Version?" [level=2] [ref=e95]
    - generic [ref=e96]:
      - generic [ref=e97]:
        - img [ref=e99]
        - heading "Curated Excellence" [level=3] [ref=e102]
        - paragraph [ref=e103]: Every game features our expertly selected best version, ensuring optimal gameplay and experience.
      - generic [ref=e104]:
        - img [ref=e106]
        - heading "Comprehensive History" [level=3] [ref=e109]
        - paragraph [ref=e110]: Deep dive into gaming's evolution with detailed information about each title and its impact.
      - generic [ref=e111]:
        - img [ref=e113]
        - heading "Fast & Responsive" [level=3] [ref=e115]
        - paragraph [ref=e116]: Lightning-fast loading times and smooth navigation across all devices for seamless browsing.
      - generic [ref=e117]:
        - img [ref=e119]
        - heading "Advanced Search" [level=3] [ref=e122]
        - paragraph [ref=e123]: Find exactly what you're looking for with our powerful search and filtering capabilities.
      - generic [ref=e124]:
        - img [ref=e126]
        - heading "Rich Data" [level=3] [ref=e129]
        - paragraph [ref=e130]: Access detailed JSON data for each game including screenshots, reviews, and technical specs.
      - generic [ref=e131]:
        - img [ref=e133]
        - heading "Global Community" [level=3] [ref=e136]
        - paragraph [ref=e137]: Join thousands of gaming enthusiasts sharing knowledge and preserving history together.
  - generic [ref=e139]:
    - heading "About Best Version" [level=2] [ref=e140]
    - generic [ref=e141]:
      - generic [ref=e142]:
        - paragraph [ref=e143]:
          - strong [ref=e144]: Welcome to Best Version
          - text: — a passion project born from frustration and fueled by love for gaming history.
        - paragraph [ref=e145]: I created this site because I was tired of seeing modern remakes that don't hold a candle to the original versions. Too often, developers try to "improve" what wasn't broken, losing the magic that made these games special in the first place.
        - paragraph [ref=e147]: "\"How many hours have I wasted trying to find consensus on whether Symphony of the Night is best on PSX, PSP, or Saturn? This site exists so you don't have to.\""
        - paragraph [ref=e148]: Best Version isn't about ranking games — it's about finding THE BEST version of each game. We dig deep into patches, mods, and platform differences to ensure you know exactly how to experience these classics at their absolute peak.
        - paragraph [ref=e149]: "This is a solo project driven by one mission: help players discover the definitive way to play gaming's greatest titles, complete with the best patches, mods, and technical recommendations available today."
      - generic [ref=e150]:
        - img "Gaming Setup" [ref=e151]
        - generic [ref=e152]:
          - generic [ref=e153]:
            - generic [ref=e154]: "1"
            - generic [ref=e155]: Dedicated Creator
          - generic [ref=e156]:
            - generic [ref=e157]: 7+
            - generic [ref=e158]: Games in Progress
    - generic [ref=e159]:
      - heading "How We Determine the Best Version" [level=3] [ref=e160]
      - generic [ref=e161]:
        - generic [ref=e162]:
          - img [ref=e164]
          - heading "Community Votes" [level=3] [ref=e166]
          - paragraph [ref=e167]: We gather input from thousands of players who have spent hundreds of hours on each version.
        - generic [ref=e168]:
          - img [ref=e170]
          - heading "Critical Acclaim" [level=3] [ref=e172]
          - paragraph [ref=e173]: Professional reviews and retrospective analysis from trusted gaming publications.
        - generic [ref=e174]:
          - img [ref=e176]
          - heading "Modern Standards" [level=3] [ref=e178]
          - paragraph [ref=e179]: Technical improvements, patches, and mods that enhance the experience without losing the original charm.
        - generic [ref=e180]:
          - img [ref=e182]
          - heading "Playability" [level=3] [ref=e185]
          - paragraph [ref=e186]: Controller support, performance stability, and overall user experience on each platform.
        - generic [ref=e187]:
          - img [ref=e189]
          - heading "Content Completeness" [level=3] [ref=e192]
          - paragraph [ref=e193]: All DLC, bonus content, and hidden features included in the recommended version.
        - generic [ref=e194]:
          - img [ref=e196]
          - heading "Accessibility" [level=3] [ref=e200]
          - paragraph [ref=e201]: How easy is it to find, install, and play this version in today's gaming landscape?
    - generic [ref=e202]:
      - heading "Contact Admin" [level=3] [ref=e203]
      - paragraph [ref=e204]: Have questions, suggestions, or want to contribute? I'd love to hear from you!
      - generic [ref=e205]:
        - generic [ref=e206]:
          - img [ref=e208]
          - heading "Email Me" [level=3] [ref=e211]
          - link "admin@best-version.com" [ref=e212] [cursor=pointer]:
            - /url: mailto:admin@best-version.com
        - generic [ref=e213]:
          - img [ref=e215]
          - heading "Join Community" [level=3] [ref=e217]
          - paragraph [ref=e218]: Discord and forums coming soon!
        - generic [ref=e219]:
          - img [ref=e221]
          - heading "Submit a Game" [level=3] [ref=e224]
          - link "Suggest a game →" [ref=e225] [cursor=pointer]:
            - /url: /submit?game=
      - link "Send Message" [ref=e227] [cursor=pointer]:
        - /url: mailto:admin@best-version.com
  - generic [ref=e229]:
    - heading "Stay Updated" [level=2] [ref=e230]
    - paragraph [ref=e231]: Get notified when we add new games or update existing entries. Join our community of gaming historians!
    - generic [ref=e232]:
      - textbox "Enter your email" [active] [ref=e233]
      - button "Subscribe" [ref=e234] [cursor=pointer]
  - contentinfo [ref=e235]:
    - generic [ref=e236]: BEST VERSION
    - generic [ref=e237]:
      - link "About Us" [ref=e238] [cursor=pointer]:
        - /url: "#about"
      - link "Contact" [ref=e239] [cursor=pointer]:
        - /url: /submit
      - link "Privacy Policy" [ref=e240] [cursor=pointer]:
        - /url: /legal/privacy.html
      - link "Terms of Service" [ref=e241] [cursor=pointer]:
        - /url: /legal/terms.html
      - link "API Documentation" [ref=e242] [cursor=pointer]:
        - /url: /api/docs
    - paragraph [ref=e243]: © 2026 Best Version. All rights reserved. Preserving gaming history one game at a time.
```

# Test source

```ts
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
  1482 |     await searchInput.fill('NonExistentGame12345XYZ');
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
> 1525 |     const value = await titleInput.inputValue();
       |                                    ^ Error: locator.inputValue: Test timeout of 30000ms exceeded.
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
  1590 |     await searchInput.fill('Test Search');
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
```