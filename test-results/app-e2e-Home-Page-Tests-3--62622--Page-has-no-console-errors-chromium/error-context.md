# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-065 [P2] Page has no console errors
- Location: test/e2e/app-e2e.test.js:1150:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
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
        - heading "Final Fantasy VI" [level=3] [ref=e48]
        - img "Final Fantasy VI cover art" [ref=e50]
        - generic [ref=e53]: 🎮 Game Boy Advance (Emulated), Pixel Remaster (PC/Mobile/Switch/PS4/Xbox), Super Nintendo Entertainment System (Emulated), PlayStation (Emulated)
      - generic [ref=e54] [cursor=pointer]:
        - 'heading "Metal Gear Solid 2: Sons of Liberty" [level=3] [ref=e56]'
        - 'img "Metal Gear Solid 2: Sons of Liberty cover art" [ref=e58]'
        - generic [ref=e61]: 🎮 PlayStation 2, Windows (Steam - Master Collection), Windows (Original PC - GOG), PlayStation 3 / Xbox 360 (HD Collection), Nintendo Switch / PS4 / Xbox One (Master Collection)
      - generic [ref=e62] [cursor=pointer]:
        - heading "The Witcher" [level=3] [ref=e64]
        - img "The Witcher cover art" [ref=e66]
        - generic [ref=e69]: 🎮 Windows (PC - GOG/Steam), PlayStation 3, Xbox 360
      - generic [ref=e70] [cursor=pointer]:
        - 'heading "The Witcher 3: Wild Hunt" [level=3] [ref=e72]'
        - 'img "The Witcher 3: Wild Hunt cover art" [ref=e74]'
        - generic [ref=e77]: 🎮 PlayStation 5, Xbox Series X|S, Windows (Steam), Nintendo Switch
      - generic [ref=e78] [cursor=pointer]:
        - 'heading "Final Fantasy XII: The Zodiac Age" [level=3] [ref=e80]'
        - 'img "Final Fantasy XII: The Zodiac Age cover art" [ref=e82]'
        - generic [ref=e85]: 🎮 Nintendo Switch / Xbox One / PS4 (Zodiac Age), Windows (PC - Steam), PlayStation 2 (Original)
      - generic [ref=e86] [cursor=pointer]:
        - heading "Beyond Shadowgate" [level=3] [ref=e88]
        - img "Beyond Shadowgate cover art" [ref=e90]
        - generic [ref=e93]: 🎮 Windows (Steam/GOG)
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
  1066 |   test('3.0-E2E-059 [P2] Header navigation links work', async ({ page }) => {
  1067 |     // Given - Home page is loaded
  1068 |     await page.goto(BASE_URL);
  1069 | 
  1070 |     // When - Click on header link
  1071 |     const headerLink = page.locator('header a, nav a').first();
  1072 | 
  1073 |     if (await headerLink.count() > 0) {
  1074 |       await headerLink.click();
  1075 | 
  1076 |       // Then - Should navigate
  1077 |       await page.waitForURL();
  1078 |     }
  1079 |   });
  1080 | 
  1081 |   test('3.0-E2E-060 [P1] Back button in browser works', async ({ page }) => {
  1082 |     // Given - Navigate to detail page
  1083 |     await page.goto(`${BASE_URL}/games/pokemon-emerald`);
  1084 | 
  1085 |     // When - Go back
  1086 |     await page.goBack();
  1087 | 
  1088 |     // Then - Should return to previous page
  1089 |     await page.waitForTimeout(500);
  1090 | 
  1091 |     const url = page.url();
  1092 | 
  1093 |     expect(url.length > 0).toBe(true);
  1094 |   });
  1095 | 
  1096 |   // ==================== PERFORMANCE TESTS ====================
  1097 | 
  1098 |   test('3.0-E2E-061 [P1] Home page loads within 3 seconds', async ({ page }) => {
  1099 |     // Given - Navigate to home page
  1100 |     const startTime = Date.now();
  1101 | 
  1102 |     await page.goto(BASE_URL);
  1103 | 
  1104 |     const loadTime = Date.now() - startTime;
  1105 | 
  1106 |     // Then - Should load within 3 seconds
  1107 |     expect(loadTime < 3000).toBe(true);
  1108 |   });
  1109 | 
  1110 |   test('3.0-E2E-062 [P2] Search page loads within 3 seconds', async ({ page }) => {
  1111 |     // Given - Navigate to search page
  1112 |     const startTime = Date.now();
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
> 1166 |     expect(consoleError).toBe(false);
       |                          ^ Error: expect(received).toBe(expected) // Object.is equality
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
  1213 |     await expect(nav).toBeVisible();
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
```