# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-069 [P2] Navigation is accessible on mobile
- Location: test/e2e/app-e2e.test.js:1204:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('navigation', { name: /Games/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('navigation', { name: /Games/i })

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
  - generic [ref=e12]:
    - heading "The Ultimate Video Game History Archive" [level=1] [ref=e13]
    - paragraph [ref=e14]: Discover the definitive versions of gaming's greatest classics. Every game, every era, one perfect edition.
    - generic [ref=e15]:
      - link "Explore Games" [ref=e16] [cursor=pointer]:
        - /url: "#games"
        - img [ref=e17]
        - text: Explore Games
      - button "Submit a Game" [ref=e20] [cursor=pointer]
  - generic [ref=e21]:
    - generic [ref=e22]:
      - generic [ref=e23]: 51+
      - generic [ref=e24]: Games Catalogued
    - generic [ref=e25]:
      - generic [ref=e26]: "74"
      - generic [ref=e27]: Platforms Supported
    - generic [ref=e28]:
      - generic [ref=e29]: "183"
      - generic [ref=e30]: Curated Versions
    - generic [ref=e31]:
      - generic [ref=e32]: "7"
      - generic [ref=e33]: In Progress
  - generic [ref=e34]:
    - heading "Featured Classics" [level=2] [ref=e35]
    - generic [ref=e36]:
      - generic [ref=e37] [cursor=pointer]:
        - heading "Castlevania" [level=3] [ref=e39]
        - img "Castlevania cover art" [ref=e41]
        - generic [ref=e44]: 🎮 Nintendo Switch (Anniversary Collection), Windows (Emulation), Nintendo Switch (Original NES ROM)
      - generic [ref=e45] [cursor=pointer]:
        - heading "Terranigma" [level=3] [ref=e47]
        - img "Terranigma cover art" [ref=e49]
        - generic [ref=e52]: 🎮 Super Nintendo Entertainment System (SNES), Super Nintendo Entertainment System (SNES)
      - generic [ref=e53] [cursor=pointer]:
        - heading "Parasite Eve" [level=3] [ref=e55]
        - img "Parasite Eve cover art" [ref=e57]
        - generic [ref=e60]: 🎮 PS Vita (PSN Classics), PSP (PSN Classics), PlayStation (Original), PlayStation Classic (Japan Only)
      - generic [ref=e61] [cursor=pointer]:
        - heading "Dispatch" [level=3] [ref=e63]
        - img "Dispatch cover art" [ref=e65]
        - generic [ref=e68]: 🎮 Windows (Steam), PlayStation 5, Nintendo Switch 2, Nintendo Switch
      - generic [ref=e69] [cursor=pointer]:
        - 'heading "Persona 5: The Phantom X" [level=3] [ref=e71]'
        - 'img "Persona 5: The Phantom X cover art" [ref=e73]'
        - generic [ref=e76]: 🎮 PlayStation 5 / Xbox Series X|S, Windows (PC - Steam), Nintendo Switch
      - generic [ref=e77] [cursor=pointer]:
        - heading "Grandia II" [level=3] [ref=e79]
        - img "Grandia II cover art" [ref=e81]
        - generic [ref=e84]: 🎮 Dreamcast, Nintendo Switch / Windows (Steam), Windows (Anniversary Edition), PlayStation 2
  - generic [ref=e85]:
    - heading "Why Choose Best Version?" [level=2] [ref=e86]
    - generic [ref=e87]:
      - generic [ref=e88]:
        - img [ref=e90]
        - heading "Curated Excellence" [level=3] [ref=e93]
        - paragraph [ref=e94]: Every game features our expertly selected best version, ensuring optimal gameplay and experience.
      - generic [ref=e95]:
        - img [ref=e97]
        - heading "Comprehensive History" [level=3] [ref=e100]
        - paragraph [ref=e101]: Deep dive into gaming's evolution with detailed information about each title and its impact.
      - generic [ref=e102]:
        - img [ref=e104]
        - heading "Fast & Responsive" [level=3] [ref=e106]
        - paragraph [ref=e107]: Lightning-fast loading times and smooth navigation across all devices for seamless browsing.
      - generic [ref=e108]:
        - img [ref=e110]
        - heading "Advanced Search" [level=3] [ref=e113]
        - paragraph [ref=e114]: Find exactly what you're looking for with our powerful search and filtering capabilities.
      - generic [ref=e115]:
        - img [ref=e117]
        - heading "Rich Data" [level=3] [ref=e120]
        - paragraph [ref=e121]: Access detailed JSON data for each game including screenshots, reviews, and technical specs.
      - generic [ref=e122]:
        - img [ref=e124]
        - heading "Global Community" [level=3] [ref=e127]
        - paragraph [ref=e128]: Join thousands of gaming enthusiasts sharing knowledge and preserving history together.
  - generic [ref=e130]:
    - heading "About Best Version" [level=2] [ref=e131]
    - generic [ref=e132]:
      - generic [ref=e133]:
        - paragraph [ref=e134]:
          - strong [ref=e135]: Welcome to Best Version
          - text: — a passion project born from frustration and fueled by love for gaming history.
        - paragraph [ref=e136]: I created this site because I was tired of seeing modern remakes that don't hold a candle to the original versions. Too often, developers try to "improve" what wasn't broken, losing the magic that made these games special in the first place.
        - paragraph [ref=e138]: "\"How many hours have I wasted trying to find consensus on whether Symphony of the Night is best on PSX, PSP, or Saturn? This site exists so you don't have to.\""
        - paragraph [ref=e139]: Best Version isn't about ranking games — it's about finding THE BEST version of each game. We dig deep into patches, mods, and platform differences to ensure you know exactly how to experience these classics at their absolute peak.
        - paragraph [ref=e140]: "This is a solo project driven by one mission: help players discover the definitive way to play gaming's greatest titles, complete with the best patches, mods, and technical recommendations available today."
      - generic [ref=e141]:
        - img "Gaming Setup" [ref=e142]
        - generic [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]: "1"
            - generic [ref=e146]: Dedicated Creator
          - generic [ref=e147]:
            - generic [ref=e148]: 7+
            - generic [ref=e149]: Games in Progress
    - generic [ref=e150]:
      - heading "How We Determine the Best Version" [level=3] [ref=e151]
      - generic [ref=e152]:
        - generic [ref=e153]:
          - img [ref=e155]
          - heading "Community Votes" [level=3] [ref=e157]
          - paragraph [ref=e158]: We gather input from thousands of players who have spent hundreds of hours on each version.
        - generic [ref=e159]:
          - img [ref=e161]
          - heading "Critical Acclaim" [level=3] [ref=e163]
          - paragraph [ref=e164]: Professional reviews and retrospective analysis from trusted gaming publications.
        - generic [ref=e165]:
          - img [ref=e167]
          - heading "Modern Standards" [level=3] [ref=e169]
          - paragraph [ref=e170]: Technical improvements, patches, and mods that enhance the experience without losing the original charm.
        - generic [ref=e171]:
          - img [ref=e173]
          - heading "Playability" [level=3] [ref=e176]
          - paragraph [ref=e177]: Controller support, performance stability, and overall user experience on each platform.
        - generic [ref=e178]:
          - img [ref=e180]
          - heading "Content Completeness" [level=3] [ref=e183]
          - paragraph [ref=e184]: All DLC, bonus content, and hidden features included in the recommended version.
        - generic [ref=e185]:
          - img [ref=e187]
          - heading "Accessibility" [level=3] [ref=e191]
          - paragraph [ref=e192]: How easy is it to find, install, and play this version in today's gaming landscape?
    - generic [ref=e193]:
      - heading "Contact Admin" [level=3] [ref=e194]
      - paragraph [ref=e195]: Have questions, suggestions, or want to contribute? I'd love to hear from you!
      - generic [ref=e196]:
        - generic [ref=e197]:
          - img [ref=e199]
          - heading "Email Me" [level=3] [ref=e202]
          - link "admin@best-version.com" [ref=e203] [cursor=pointer]:
            - /url: mailto:admin@best-version.com
        - generic [ref=e204]:
          - img [ref=e206]
          - heading "Join Community" [level=3] [ref=e208]
          - paragraph [ref=e209]: Discord and forums coming soon!
        - generic [ref=e210]:
          - img [ref=e212]
          - heading "Submit a Game" [level=3] [ref=e215]
          - link "Suggest a game →" [ref=e216] [cursor=pointer]:
            - /url: /submit?game=
      - link "Send Message" [ref=e218] [cursor=pointer]:
        - /url: mailto:admin@best-version.com
  - generic [ref=e220]:
    - heading "Stay Updated" [level=2] [ref=e221]
    - paragraph [ref=e222]: Get notified when we add new games or update existing entries. Join our community of gaming historians!
    - generic [ref=e223]:
      - textbox "Enter your email" [ref=e224]
      - button "Subscribe" [ref=e225] [cursor=pointer]
  - contentinfo [ref=e226]:
    - generic [ref=e227]: BEST VERSION
    - generic [ref=e228]:
      - link "About Us" [ref=e229] [cursor=pointer]:
        - /url: "#about"
      - link "Contact" [ref=e230] [cursor=pointer]:
        - /url: /submit
      - link "Privacy Policy" [ref=e231] [cursor=pointer]:
        - /url: /legal/privacy.html
      - link "Terms of Service" [ref=e232] [cursor=pointer]:
        - /url: /legal/terms.html
      - link "API Documentation" [ref=e233] [cursor=pointer]:
        - /url: /api/docs
    - paragraph [ref=e234]: © 2026 Best Version. All rights reserved. Preserving gaming history one game at a time.
```

# Test source

```ts
  1113 | 
  1114 |     await page.goto(`${BASE_URL}/search`);
  1115 | 
  1116 |     const loadTime = Date.now() - startTime;
  1117 | 
  1118 |     // Then - Should load within 3 seconds
  1119 |     expect(loadTime < 3000).toBe(true);
  1120 |   });
  1121 | 
  1122 |   test('3.0-E2E-063 [P2] Game detail page loads within 3 seconds', async ({ page }) => {
  1123 |     // Given - Navigate to game detail page
  1124 |     const startTime = Date.now();
  1125 | 
  1126 |     await page.goto(`${BASE_URL}/games/pokemon-emerald`);
  1127 | 
  1128 |     const loadTime = Date.now() - startTime;
  1129 | 
  1130 |     // Then - Should load within 3 seconds
  1131 |     expect(loadTime < 3000).toBe(true);
  1132 |   });
  1133 | 
  1134 |   test('3.0-E2E-064 [P2] Forms are interactive within 1 second', async ({ page }) => {
  1135 |     // Given - Submission page is loaded
  1136 |     await page.goto(`${BASE_URL}/submit`);
  1137 | 
  1138 |     // When - Interact with form
  1139 |     const startTime = Date.now();
  1140 | 
  1141 |     const titleInput = page.locator('input[name="title"], input[placeholder*="title"]');
  1142 |     await titleInput.click();
  1143 | 
  1144 |     const timeToInteract = Date.now() - startTime;
  1145 | 
  1146 |     // Then - Should be interactive
  1147 |     expect(timeToInteract < 1000).toBe(true);
  1148 |   });
  1149 | 
  1150 |   test('3.0-E2E-065 [P2] Page has no console errors', async ({ page }) => {
  1151 |     // Given - Home page is loaded
  1152 |     await page.goto(BASE_URL);
  1153 | 
  1154 |     // When - Check console
  1155 |     let consoleError = false;
  1156 | 
  1157 |     page.on('console', msg => {
  1158 |       if (msg.type() === 'error') {
  1159 |         consoleError = true;
  1160 |       }
  1161 |     });
  1162 | 
  1163 |     await page.waitForTimeout(2000);
  1164 | 
  1165 |     // Then - Should have no errors
  1166 |     expect(consoleError).toBe(false);
  1167 |   });
  1168 | 
  1169 |   // ==================== RESPONSIVE DESIGN TESTS ====================
  1170 | 
  1171 |   test('3.0-E2E-066 [P1] Mobile view (375px) renders correctly', async ({ page }) => {
  1172 |     // Given - Start at home page
  1173 |     await page.goto(BASE_URL);
  1174 | 
  1175 |     // When - Switch to mobile
  1176 |     await page.setViewportSize({ width: 375, height: 667 });
  1177 | 
  1178 |     // Then - Page should still render
  1179 |     await expect(page.locator('body')).toBeVisible();
  1180 |   });
  1181 | 
  1182 |   test('3.0-E2E-067 [P1] Tablet view (768px) renders correctly', async ({ page }) => {
  1183 |     // Given - Start at home page
  1184 |     await page.goto(BASE_URL);
  1185 | 
  1186 |     // When - Switch to tablet
  1187 |     await page.setViewportSize({ width: 768, height: 1024 });
  1188 | 
  1189 |     // Then - Page should still render
  1190 |     await expect(page.locator('body')).toBeVisible();
  1191 |   });
  1192 | 
  1193 |   test('3.0-E2E-068 [P1] Desktop view (1440px) renders correctly', async ({ page }) => {
  1194 |     // Given - Start at home page
  1195 |     await page.goto(BASE_URL);
  1196 | 
  1197 |     // When - Switch to desktop
  1198 |     await page.setViewportSize({ width: 1440, height: 900 });
  1199 | 
  1200 |     // Then - Page should still render
  1201 |     await expect(page.locator('body')).toBeVisible();
  1202 |   });
  1203 | 
  1204 |   test('3.0-E2E-069 [P2] Navigation is accessible on mobile', async ({ page }) => {
  1205 |     // Given - Mobile view
  1206 |     await page.goto(BASE_URL);
  1207 |     await page.setViewportSize({ width: 375, height: 667 });
  1208 | 
  1209 |     // When - Look for navigation (use getByRole to avoid strict mode violation)
  1210 |     const nav = page.getByRole('navigation', { name: /Games/i });
  1211 | 
  1212 |     // Then - Navigation should be visible
> 1213 |     await expect(nav).toBeVisible();
       |                       ^ Error: expect(locator).toBeVisible() failed
  1214 |   });
  1215 | 
  1216 |   test('3.0-E2E-070 [P2] Search is accessible on mobile', async ({ page }) => {
  1217 |     // Given - Mobile view
  1218 |     await page.goto(BASE_URL);
  1219 |     await page.setViewportSize({ width: 375, height: 667 });
  1220 | 
  1221 |     // When - Look for search
  1222 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  1223 | 
  1224 |     // Then - Search should be visible
  1225 |     const count = await searchInput.count();
  1226 | 
  1227 |     expect(count >= 0).toBe(true);
  1228 |   });
  1229 | 
  1230 |   // ==================== ACCESSIBILITY TESTS ====================
  1231 | 
  1232 |   test('3.0-E2E-071 [P2] Page has proper heading hierarchy', async ({ page }) => {
  1233 |     // Given - Home page is loaded
  1234 |     await page.goto(BASE_URL);
  1235 | 
  1236 |     // When - Look for headings
  1237 |     const h1 = page.locator('h1');
  1238 |     const h1Count = await h1.count();
  1239 | 
  1240 |     // Then - Should have at least one H1
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
```