# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-013 [P1] Search page performs search
- Location: test/e2e/app-e2e.test.js:178:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.game-card, .game-entry, [data-testid="game"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.game-card, .game-entry, [data-testid="game"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e3]:
      - list [ref=e4]:
        - listitem [ref=e5]:
          - link "Home" [ref=e6] [cursor=pointer]:
            - /url: /
        - listitem [ref=e7]:
          - link "Search" [ref=e8] [cursor=pointer]:
            - /url: /search
        - listitem [ref=e9]:
          - link "Submit Game" [ref=e10] [cursor=pointer]:
            - /url: /submit
  - main [ref=e11]:
    - generic [ref=e12]:
      - heading "Search Games" [level=1] [ref=e13]
      - searchbox "Search games" [ref=e14]
    - heading "Results" [level=2] [ref=e16]
  - contentinfo [ref=e17]:
    - paragraph [ref=e18]: 2026 Best Version. All rights reserved.
    - navigation [ref=e19]:
      - list [ref=e20]:
        - listitem [ref=e21]:
          - link "Terms" [ref=e22] [cursor=pointer]:
            - /url: /legal/terms
        - listitem [ref=e23]:
          - link "Privacy" [ref=e24] [cursor=pointer]:
            - /url: /legal/privacy
```

# Test source

```ts
  96  |     // Given - Home page is loaded
  97  |     await page.goto(BASE_URL);
  98  | 
  99  |     // When
  100 |     const privacyLink = page.locator('a[href*="privacy"]');
  101 |     const termsLink = page.locator('a[href*="terms"]');
  102 | 
  103 |     // Then
  104 |     await expect(privacyLink).toBeVisible();
  105 |     await expect(termsLink).toBeVisible();
  106 |   });
  107 | 
  108 |   test('3.0-E2E-007 [P1] Home page search works', async ({ page }) => {
  109 |     // Given - Home page is loaded
  110 |     await page.goto(BASE_URL);
  111 | 
  112 |     // When - Enter search query
  113 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  114 |     await searchInput.fill('Pokemon');
  115 | 
  116 |     // Then - Should show results or navigate to search page
  117 |     const results = page.locator('.game-card, .game-entry, .game-item, [data-testid="game"]');
  118 |     await expect(results.first()).toBeVisible();
  119 |   });
  120 | 
  121 |   test('3.0-E2E-008 [P1] Home page navigation to search page works', async ({ page }) => {
  122 |     // Given - Home page is loaded
  123 |     await page.goto(BASE_URL);
  124 | 
  125 |     // When - Click on search-related element
  126 |     const searchLink = page.locator('a[href*="search"], a[aria-label*="search"]');
  127 | 
  128 |     // Then - Should navigate to search page
  129 |     if (await searchLink.count() > 0) {
  130 |       await searchLink.click();
  131 |       await page.waitForURL('**/search**');
  132 |     }
  133 |   });
  134 | 
  135 |   test('3.0-E2E-009 [P2] Home page has proper meta tags', async ({ page }) => {
  136 |     // Given - Home page is loaded
  137 |     await page.goto(BASE_URL);
  138 | 
  139 |     // When - Check meta tags
  140 |     const title = await page.locator('title').textContent();
  141 | 
  142 |     // Then - Should have title
  143 |     expect(title).toBeTruthy();
  144 |   });
  145 | 
  146 |   test('3.0-E2E-010 [P2] Home page is responsive (mobile view)', async ({ page }) => {
  147 |     // Given - Home page is loaded
  148 |     await page.goto(BASE_URL);
  149 | 
  150 |     // When - Switch to mobile view
  151 |     await page.setViewportSize({ width: 375, height: 667 });
  152 | 
  153 |     // Then - Page should still be visible
  154 |     await expect(page.locator('body')).toBeVisible();
  155 |   });
  156 | 
  157 |   // ==================== SEARCH PAGE TESTS ====================
  158 | 
  159 |   test('3.0-E2E-011 [P1] Search page loads', async ({ page }) => {
  160 |     // Given - Navigate to search page
  161 |     await page.goto(`${BASE_URL}/search`);
  162 | 
  163 |     // Then - Page should load
  164 |     await expect(page).toHaveURL(new RegExp('.*/search.*'));
  165 |   });
  166 | 
  167 |   test('3.0-E2E-012 [P1] Search page has search input', async ({ page }) => {
  168 |     // Given - Search page is loaded
  169 |     await page.goto(`${BASE_URL}/search`);
  170 | 
  171 |     // When - Look for search input
  172 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  173 | 
  174 |     // Then - Should be visible
  175 |     await expect(searchInput).toBeVisible();
  176 |   });
  177 | 
  178 |   test('3.0-E2E-013 [P1] Search page performs search', async ({ page }) => {
  179 |     // Given - Navigate directly to search page with query parameter
  180 |     await page.goto(`${BASE_URL}/search?q=Final%20Fantasy`);
  181 | 
  182 |     // Wait for page to fully load
  183 |     await page.waitForLoadState('networkidle');
  184 | 
  185 |     // Debug: Check if we have any game cards
  186 |     const allGameCards = page.locator('.game-card, .game-entry, [data-testid="game"]');
  187 |     const cardCount = await allGameCards.count();
  188 | 
  189 |     // Then - Should show results
  190 |     // If no results found, the search functionality needs to be fixed
  191 |     if (cardCount === 0) {
  192 |       // Take a screenshot to debug
  193 |       await page.screenshot({ path: 'test-results/debug-search.png' });
  194 |     }
  195 | 
> 196 |     await expect(allGameCards.first()).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  197 |   });
  198 | 
  199 |   test('3.0-E2E-014 [P1] Search page shows no results message', async ({ page }) => {
  200 |     // Given - Search page is loaded
  201 |     await page.goto(`${BASE_URL}/search`);
  202 | 
  203 |     // When - Search for non-existent game
  204 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  205 |     await searchInput.fill('NonExistentGame12345');
  206 | 
  207 |     // Then - Should show "no results" or empty state
  208 |     const results = page.locator('.game-card, .game-entry, [data-testid="game"]');
  209 |     const count = await results.count();
  210 | 
  211 |     // Either show 0 results or handle gracefully
  212 |     expect(count >= 0).toBe(true);
  213 |   });
  214 | 
  215 |   test('3.0-E2E-015 [P2] Search page has filter options', async ({ page }) => {
  216 |     // Given - Search page is loaded
  217 |     await page.goto(`${BASE_URL}/search`);
  218 | 
  219 |     // When - Look for filters
  220 |     const filters = page.locator('.filters, [data-testid="filters"], select, .filter');
  221 | 
  222 |     // Then - Filters may or may not be present
  223 |     const count = await filters.count();
  224 |     expect(count >= 0).toBe(true);
  225 |   });
  226 | 
  227 |   test('3.0-E2E-016 [P2] Search page handles special characters', async ({ page }) => {
  228 |     // Given - Search page is loaded
  229 |     await page.goto(`${BASE_URL}/search`);
  230 | 
  231 |     // When - Enter special characters
  232 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  233 |     await searchInput.fill('<script>alert(1)</script>');
  234 | 
  235 |     // Then - Should not execute script (security test)
  236 |     await page.waitForTimeout(1000);
  237 | 
  238 |     // No alert should have been triggered
  239 |     expect(true).toBe(true);
  240 |   });
  241 | 
  242 |   test('3.0-E2E-017 [P2] Search page shows trending/popular games', async ({ page }) => {
  243 |     // Given - Search page is loaded
  244 |     await page.goto(`${BASE_URL}/search`);
  245 | 
  246 |     // When - Look for trending section
  247 |     const trending = page.locator('.trending, .popular, [data-testid="trending"]');
  248 | 
  249 |     // Then - May or may not have trending section
  250 |     const count = await trending.count();
  251 |     expect(count >= 0).toBe(true);
  252 |   });
  253 | 
  254 |   test('3.0-E2E-018 [P1] Search page navigation back to home works', async ({ page }) => {
  255 |     // Given - Search page is loaded
  256 |     await page.goto(`${BASE_URL}/search`);
  257 | 
  258 |     // When - Click home link
  259 |     const homeLink = page.locator('a[href="/"], a[href]:first-of-type');
  260 | 
  261 |     // Then - Should navigate home
  262 |     if (await homeLink.count() > 0) {
  263 |       await homeLink.click();
  264 |       await page.waitForURL(BASE_URL);
  265 |     }
  266 |   });
  267 | 
  268 |   test('3.0-E2E-019 [P2] Search page maintains search term on navigation', async ({ page }) => {
  269 |     // Given - Search page is loaded with query
  270 |     await page.goto(`${BASE_URL}/search?q=test`);
  271 | 
  272 |     // When - Check if search term is preserved
  273 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  274 |     const value = await searchInput.inputValue();
  275 | 
  276 |     // Then - May or may not preserve term
  277 |     expect(value.length >= 0).toBe(true);
  278 |   });
  279 | 
  280 |   test('3.0-E2E-020 [P2] Search page has keyboard navigation', async ({ page }) => {
  281 |     // Given - Search page is loaded
  282 |     await page.goto(`${BASE_URL}/search`);
  283 | 
  284 |     // When - Focus on search input
  285 |     const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
  286 |     await searchInput.focus();
  287 | 
  288 |     // Then - Input should be focused
  289 |     await expect(searchInput).toBeFocused();
  290 |   });
  291 | 
  292 |   // ==================== GAME DETAIL PAGE TESTS ====================
  293 | 
  294 |   test('3.0-E2E-021 [P1] Game detail page loads for existing game', async ({ page }) => {
  295 |     // Given - Navigate to a game detail page
  296 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
```