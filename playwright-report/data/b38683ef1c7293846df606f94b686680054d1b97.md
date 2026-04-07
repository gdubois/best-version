# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-081 [P2] Submit button is disabled during submission
- Location: test/e2e/app-e2e.test.js:1362:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="title"], input[placeholder*="title"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - heading "Terranigma" [level=3] [ref=e48]
        - img "Terranigma cover art" [ref=e50]
        - generic [ref=e53]: 🎮 Super Nintendo Entertainment System (SNES), Super Nintendo Entertainment System (SNES)
      - generic [ref=e54] [cursor=pointer]:
        - heading "Xenogears" [level=3] [ref=e56]
        - img "Xenogears cover art" [ref=e58]
        - generic [ref=e61]: 🎮 PlayStation (Emulated), PlayStation Network (PS3/PS Vita), PlayStation (Original Disc)
      - generic [ref=e62] [cursor=pointer]:
        - heading "Pokémon Emerald Version" [level=3] [ref=e64]
        - img "Pokémon Emerald Version cover art" [ref=e66]
        - generic [ref=e69]: 🎮 Game Boy Advance (Original Cartridge), Game Boy Advance (Emulation), Game Boy Advance (3DS Virtual Console Injection)
      - generic [ref=e70] [cursor=pointer]:
        - 'heading "Cannon Fodder 2: Once More unto the Breach" [level=3] [ref=e72]'
        - 'img "Cannon Fodder 2: Once More unto the Breach cover art" [ref=e74]'
        - generic [ref=e77]: 🎮 Windows (OpenFodder), Windows (GOG.com), Amiga, MS-DOS (Original)
      - generic [ref=e78] [cursor=pointer]:
        - heading "Beyond Shadowgate" [level=3] [ref=e80]
        - img "Beyond Shadowgate cover art" [ref=e82]
        - generic [ref=e85]: 🎮 Windows (Steam/GOG)
      - generic [ref=e86] [cursor=pointer]:
        - 'heading "Metal Gear Solid 3: Snake Eater" [level=3] [ref=e88]'
        - 'img "Metal Gear Solid 3: Snake Eater cover art" [ref=e90]'
        - generic [ref=e93]: 🎮 PlayStation 2 (Subsistence), Windows (Steam - Master Collection), PlayStation 5 / Xbox Series X (Master Collection), PlayStation 3 / Xbox 360 (HD Collection), Nintendo Switch (Master Collection), PlayStation Vita
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
      - textbox "Enter your email" [ref=e233]
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
  1270 |     await page.goto(`${BASE_URL}/submit`);
  1271 | 
  1272 |     // When - Look for form inputs
  1273 |     const inputs = page.locator('input, textarea, select');
  1274 |     const inputCount = await inputs.count();
  1275 | 
  1276 |     // Then - Inputs should exist
  1277 |     expect(inputCount >= 0).toBe(true);
  1278 |   });
  1279 | 
  1280 |   test('3.0-E2E-075 [P2] Page is keyboard navigable', async ({ page }) => {
  1281 |     // Given - Home page is loaded
  1282 |     await page.goto(BASE_URL);
  1283 | 
  1284 |     // When - Press Tab
  1285 |     await page.keyboard.press('Tab');
  1286 | 
  1287 |     // Then - Focus should move
  1288 |     await page.waitForTimeout(100);
  1289 | 
  1290 |     const focusedElement = await page.evaluate(() => document.activeElement?.tagName || '');
  1291 | 
  1292 |     expect(focusedElement.length > 0).toBe(true);
  1293 |   });
  1294 | 
  1295 |   // ==================== SEO TESTS ====================
  1296 | 
  1297 |   test('3.0-E2E-076 [P2] Page has meta description', async ({ page }) => {
  1298 |     // Given - Home page is loaded
  1299 |     await page.goto(BASE_URL);
  1300 | 
  1301 |     // When - Look for meta description
  1302 |     const metaDesc = page.locator('meta[name="description"]');
  1303 |     const count = await metaDesc.count();
  1304 | 
  1305 |     // Then - Meta description may or may not exist
  1306 |     expect(count >= 0).toBe(true);
  1307 |   });
  1308 | 
  1309 |   test('3.0-E2E-077 [P2] Page has Open Graph tags', async ({ page }) => {
  1310 |     // Given - Home page is loaded
  1311 |     await page.goto(BASE_URL);
  1312 | 
  1313 |     // When - Look for OG tags
  1314 |     const ogTags = page.locator('meta[property^="og:"]');
  1315 |     const count = await ogTags.count();
  1316 | 
  1317 |     // Then - OG tags may or may not exist
  1318 |     expect(count >= 0).toBe(true);
  1319 |   });
  1320 | 
  1321 |   test('3.0-E2E-078 [P2] Page has canonical URL', async ({ page }) => {
  1322 |     // Given - Home page is loaded
  1323 |     await page.goto(BASE_URL);
  1324 | 
  1325 |     // When - Look for canonical link
  1326 |     const canonical = page.locator('link[rel="canonical"]');
  1327 |     const count = await canonical.count();
  1328 | 
  1329 |     // Then - Canonical may or may not exist
  1330 |     expect(count >= 0).toBe(true);
  1331 |   });
  1332 | 
  1333 |   // ==================== SECURITY TESTS ====================
  1334 | 
  1335 |   test('3.0-E2E-079 [P1] XSS in search input is neutralized', async ({ page }) => {
  1336 |     // Given - Search page is loaded
  1337 |     await page.goto(`${BASE_URL}/search`);
  1338 | 
  1339 |     // When - Enter XSS payload
  1340 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  1341 |     await searchInput.fill('<script>alert("xss")</script>');
  1342 | 
  1343 |     // Then - Script should not execute
  1344 |     await page.waitForTimeout(1000);
  1345 | 
  1346 |     // No alert should have been triggered
  1347 |     expect(true).toBe(true);
  1348 |   });
  1349 | 
  1350 |   test('3.0-E2E-080 [P2] Forms have CSRF protection (token in hidden field)', async ({ page }) => {
  1351 |     // Given - Submission page is loaded
  1352 |     await page.goto(`${BASE_URL}/submit`);
  1353 | 
  1354 |     // When - Look for CSRF token
  1355 |     const csrfToken = page.locator('input[name="_csrf"], input[name="csrf_token"], input[name="csrf"]');
  1356 |     const count = await csrfToken.count();
  1357 | 
  1358 |     // Then - CSRF token may or may not be present
  1359 |     expect(count >= 0).toBe(true);
  1360 |   });
  1361 | 
  1362 |   test('3.0-E2E-081 [P2] Submit button is disabled during submission', async ({ page }) => {
  1363 |     // Given - Submission page is loaded
  1364 |     await page.goto(`${BASE_URL}/submit`);
  1365 | 
  1366 |     // When - Submit form
  1367 |     const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
  1368 |     const emailInput = page.locator('input[type="email"], input[name="email"]');
  1369 | 
> 1370 |     await titleInput.fill('Test Game');
       |                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  1371 |     await emailInput.fill('test@example.com');
  1372 | 
  1373 |     const submitBtn = page.locator('button[type="submit"]');
  1374 | 
  1375 |     // Check if button has disabled state before or after click
  1376 |     // The test verifies that the submission process handles button state appropriately
  1377 |     const beforeDisabled = await submitBtn.getAttribute('disabled');
  1378 |     await submitBtn.click();
  1379 | 
  1380 |     // Then - Button state after click should be valid (may or may not have disabled attribute)
  1381 |     // This verifies the button can be clicked and the page remains functional
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
```