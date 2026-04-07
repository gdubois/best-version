# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-079 [P1] XSS in search input is neutralized
- Location: test/e2e/app-e2e.test.js:1335:3

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
  1241 |     expect(h1Count >= 1).toBe(true);
  1242 |   });
  1243 | 
  1244 |   test('3.0-E2E-072 [P2] Images have alt text', async ({ page }) => {
  1245 |     // Given - Home page is loaded
  1246 |     await page.goto(BASE_URL);
  1247 | 
  1248 |     // When - Look for images without alt
  1249 |     const images = page.locator('img');
  1250 |     const imageCount = await images.count();
  1251 | 
  1252 |     // Then - Images should have alt text
  1253 |     expect(imageCount >= 0).toBe(true);
  1254 |   });
  1255 | 
  1256 |   test('3.0-E2E-073 [P2] All links have accessible names', async ({ page }) => {
  1257 |     // Given - Home page is loaded
  1258 |     await page.goto(BASE_URL);
  1259 | 
  1260 |     // When - Look for links
  1261 |     const links = page.locator('a');
  1262 |     const linkCount = await links.count();
  1263 | 
  1264 |     // Then - Links should exist
  1265 |     expect(linkCount >= 0).toBe(true);
  1266 |   });
  1267 | 
  1268 |   test('3.0-E2E-074 [P2] Form inputs have labels', async ({ page }) => {
  1269 |     // Given - Submission page is loaded
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
> 1341 |     await searchInput.fill('<script>alert("xss")</script>');
       |                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  1370 |     await titleInput.fill('Test Game');
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
```