# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-031 [P1] Click featured game card navigates to detail page
- Location: test/e2e/app-e2e.test.js:411:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/games\/.*/
Received string:  "http://localhost:3000/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/"

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
        - heading "Valkyrie Profile" [level=3] [ref=e48]
        - img "Valkyrie Profile cover art" [ref=e50]
        - generic [ref=e53]: 🎮 PlayStation (PS1), PlayStation Portable (PSP), iOS/Android (Mobile), PlayStation 4/5
      - generic [ref=e54] [cursor=pointer]:
        - heading "Final Fantasy VII" [level=3] [ref=e56]
        - img "Final Fantasy VII cover art" [ref=e58]
        - generic [ref=e61]: 🎮 Windows (Steam), PlayStation 4, iOS / Android, PlayStation 1 (Emulated)
      - generic [ref=e62] [cursor=pointer]:
        - 'heading "Castlevania: Symphony of the Night" [level=3] [ref=e64]'
        - 'img "Castlevania: Symphony of the Night cover art" [ref=e66]'
        - generic [ref=e69]: 🎮 PlayStation 4 (via Castlevania Requiem), Windows (Emulation), iOS/Android (Mobile)
      - generic [ref=e70] [cursor=pointer]:
        - 'heading "Final Fantasy XII: The Zodiac Age" [level=3] [ref=e72]'
        - 'img "Final Fantasy XII: The Zodiac Age cover art" [ref=e74]'
        - generic [ref=e77]: 🎮 Nintendo Switch / Xbox One / PS4 (Zodiac Age), Windows (PC - Steam), PlayStation 2 (Original)
      - generic [ref=e78] [cursor=pointer]:
        - heading "Grandia II" [level=3] [ref=e80]
        - img "Grandia II cover art" [ref=e82]
        - generic [ref=e85]: 🎮 Dreamcast, Nintendo Switch / Windows (Steam), Windows (Anniversary Edition), PlayStation 2
      - generic [ref=e86] [cursor=pointer]:
        - heading "Parasite Eve" [level=3] [ref=e88]
        - img "Parasite Eve cover art" [ref=e90]
        - generic [ref=e93]: 🎮 PS Vita (PSN Classics), PSP (PSN Classics), PlayStation (Original), PlayStation Classic (Japan Only)
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
  - generic [ref=e245]:
    - button "×" [ref=e246] [cursor=pointer]
    - generic [ref=e247]:
      - heading "Valkyrie Profile" [level=2] [ref=e248]
      - img "Valkyrie Profile cover" [ref=e250]
      - generic [ref=e251]:
        - heading "🎮 Recommended Versions & Patches" [level=3] [ref=e252]
        - generic [ref=e253]:
          - heading "🎮 PlayStation (PS1)" [level=4] [ref=e254]
          - paragraph [ref=e255]: The original English version with quality of life improvements including sortable inventory, better menu functionality, and more straightforward true ending requirements. Features the best sprite work and sound design that aged well.
          - generic [ref=e256]:
            - heading "Recommended Patches & Mods:" [level=5] [ref=e257]
            - generic [ref=e258]:
              - generic [ref=e260]: 📦 Chinese Seraphic Gate Patch
              - paragraph [ref=e261]: Fan translation patch that adds new content to the Seraphic Gate including powerful weapons and items not available in the original English release
        - generic [ref=e262]:
          - heading "🎮 PlayStation Portable (PSP)" [level=4] [ref=e263]
          - paragraph [ref=e264]: Enhanced port with CGI cutscenes replacing anime scenes, additional dungeons and characters for extra replayability. Based on Japanese version but includes improved translation.
          - generic [ref=e265]:
            - heading "Recommended Patches & Mods:" [level=5] [ref=e266]
            - generic [ref=e267]:
              - generic [ref=e269]: 📦 Undub Patch by Mugi
              - paragraph [ref=e270]: "Restores Japanese voice acting in cutscenes (note: not a complete undub as some English voices remain)"
        - generic [ref=e271]:
          - heading "🎮 iOS/Android (Mobile)" [level=4] [ref=e272]
          - paragraph [ref=e273]: Modern port with high-resolution graphics, revamped UI, character portraits, and quality of life features like auto-battle and cutscene skipping. Touchscreen controls can be challenging for platforming sections.
        - generic [ref=e274]:
          - heading "🎮 PlayStation 4/5" [level=4] [ref=e275]
          - paragraph [ref=e276]: PSP port with software emulation, includes save states and rewind features. Visuals are mixed in reception compared to original PS1 version.
      - generic [ref=e277]:
        - paragraph [ref=e278]: "Released on:"
        - list [ref=e279]:
          - listitem [ref=e280]: PlayStation (Japan) - 1999-12-22
          - listitem [ref=e281]: PlayStation (North America) - 2000-08-29
          - listitem [ref=e282]: PlayStation Portable (PSP) (Japan) - 2006-03-02
          - listitem [ref=e283]: PlayStation Portable (PSP) (North America) - 2006-07-18
          - listitem [ref=e284]: PlayStation Portable (PSP) (Europe) - 2007-04-27
          - listitem [ref=e285]: iOS (Worldwide) - 2018-03-22
          - listitem [ref=e286]: Android (Worldwide) - 2018-05-28
          - listitem [ref=e287]: PlayStation 4 (Worldwide) - 2022-12-22
          - listitem [ref=e288]: PlayStation 5 (Worldwide) - 2022-12-22
          - paragraph
      - generic [ref=e289]:
        - heading "Synopsis" [level=3] [ref=e290]
        - paragraph [ref=e291]: Lenneth Valkyrie is tasked by the gods Odin and Freya to recruit fallen warriors (einherjar) to fight in Ragnarok against the Vanir. As she journeys through Midgard, she discovers tragic stories of heroes while learning about her own forgotten past as a human named Platina.
      - generic [ref=e292]:
        - heading "Key Features" [level=3] [ref=e293]
        - list [ref=e294]:
          - listitem [ref=e295]: ✓ Unique turn-based battle system with simultaneous party attacks
          - listitem [ref=e296]: ✓ Three different endings based on player choices and actions
          - listitem [ref=e297]: ✓ Complex 'Seal Value' mechanic affecting story progression
          - listitem [ref=e298]: ✓ Seraphic Gate optional dungeon with powerful rewards
          - listitem [ref=e299]: ✓ Character designs by tri-Ace's signature art style
      - generic [ref=e300]:
        - heading "Long Description" [level=3] [ref=e301]
        - paragraph [ref=e302]: Valkyrie Profile, developed by tri-Ace and published by Enix in 1999, is a groundbreaking JRPG that blends Norse mythology with an emotionally complex narrative about fate, sacrifice, and the consequences of divine intervention. Players control Lenneth Valkyrie, a valkyrie tasked with recruiting fallen warriors to fight in Ragnarok—the final battle between the Æsir (gods) and Vanir (giants). The game features a unique turn-based combat system where the entire party acts simultaneously during each turn, combined with strategic resource management through the 'Seal Value' mechanic that determines which ending players achieve. With three distinct endings (C, B, and A), multiple difficulty levels affecting available content, and an optional Seraphic Gate dungeon accessible after completing all story paths, Valkyrie Profile offers exceptional replayability. The English PS1 version is particularly praised for quality of life improvements over the Japanese original, including sortable inventory and better menu functionality. Despite its cult status and limited availability (original copies can sell for hundreds of dollars), the game has been re-released on PSP, mobile platforms, and PlayStation 4/5, ensuring new generations can experience this ambitious RPG masterpiece.
      - generic [ref=e303]:
        - heading "Legacy and Impact" [level=3] [ref=e304]
        - list [ref=e305]:
          - listitem [ref=e306]: • Established tri-Ace as a premier JRPG developer alongside Square
          - listitem [ref=e307]: • Influenced narrative complexity in later Valkyrie Profile sequels
          - listitem [ref=e308]: • Pioneered the three-ending structure in Japanese RPGs
          - listitem [ref=e309]: • Featured one of the most memorable soundtracks by Motoi Sakuraba
          - listitem [ref=e310]: • Remains highly regarded among retro RPG enthusiasts decades after release
      - generic [ref=e311]:
        - heading "Genres" [level=3] [ref=e312]
        - paragraph [ref=e313]: Role-Playing Game (RPG)
      - generic [ref=e314]:
        - heading "Themes" [level=3] [ref=e315]
        - paragraph [ref=e316]: Norse Mythology, Fate and Destiny, Sacrifice, War Between Gods
      - generic [ref=e317]:
        - heading "Critical Reception" [level=3] [ref=e318]
        - paragraph [ref=e319]: "\"Valkyrie Profile is a unique and ambitious JRPG with a complex battle system, deep narrative about fate and sacrifice, and memorable characters. Its innovative mechanics and emotional storytelling have earned it a cult following among RPG enthusiasts.\""
        - paragraph [ref=e320]:
          - strong [ref=e321]: "Score:"
          - text: 8.7/10
      - generic [ref=e322]:
        - heading "Developers & Publishers" [level=3] [ref=e323]
        - paragraph [ref=e324]:
          - strong [ref=e325]: "Developed by:"
          - text: tri-Ace
        - paragraph [ref=e326]:
          - strong [ref=e327]: "Published by:"
          - text: Enix, Square Enix
      - generic [ref=e328]:
        - heading "🎯 Similar Games" [level=3] [ref=e329]
        - list [ref=e330]:
          - listitem [ref=e331]:
            - link "Chrono Trigger" [ref=e332] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=e333]:
            - 'link "Valkyrie Profile: Covenant of the Plume" [ref=e334] [cursor=pointer]':
              - /url: "#"
          - listitem [ref=e335]:
            - 'link "Star Ocean: Till the End of Time" [ref=e336] [cursor=pointer]':
              - /url: "#"
          - listitem [ref=e337]:
            - link "Xenogears" [ref=e338] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=e339]:
            - link "Vagrant Story" [ref=e340] [cursor=pointer]:
              - /url: "#"
      - button "Close" [ref=e342] [cursor=pointer]
```

# Test source

```ts
  320 |   test('3.0-E2E-023 [P1] Game detail page shows game information', async ({ page }) => {
  321 |     // Given - Game detail page is loaded
  322 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  323 | 
  324 |     // When - Look for game info
  325 |     const info = page.locator('.game-info, .info-section, [data-testid="game-info"]');
  326 | 
  327 |     // Then - Info should be visible
  328 |     await expect(info).toBeVisible();
  329 |   });
  330 | 
  331 |   test('3.0-E2E-024 [P2] Game detail page shows similar games', async ({ page }) => {
  332 |     // Given - Game detail page is loaded
  333 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  334 | 
  335 |     // When - Look for similar games section
  336 |     const similar = page.locator('.similar, .recommendations, [data-testid="similar"]');
  337 | 
  338 |     // Then - Similar games may or may not be present
  339 |     const count = await similar.count();
  340 |     expect(count >= 0).toBe(true);
  341 |   });
  342 | 
  343 |   test('3.0-E2E-025 [P2] Game detail page has back navigation', async ({ page }) => {
  344 |     // Given - Game detail page is loaded
  345 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  346 | 
  347 |     // When - Look for back button
  348 |     const backLink = page.locator('a[href="/"], button:has-text("Back")');
  349 | 
  350 |     // Then - Should have back navigation
  351 |     const count = await backLink.count();
  352 |     expect(count >= 0).toBe(true);
  353 |   });
  354 | 
  355 |   test('3.0-E2E-026 [P2] Game detail page handles non-existent game', async ({ page }) => {
  356 |     // Given - Navigate to non-existent game
  357 |     await page.goto(`${BASE_URL}/games/non-existent-game-12345`);
  358 | 
  359 |     // Then - Should show empty state or handle gracefully
  360 |     await expect(page).toHaveURL(new RegExp('.*/games/non-existent-game-12345.*'));
  361 |   });
  362 | 
  363 |   test('3.0-E2E-027 [P1] Game detail page has proper title tag', async ({ page }) => {
  364 |     // Given - Game detail page is loaded
  365 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  366 | 
  367 |     // When - Check title
  368 |     const title = await page.title();
  369 | 
  370 |     // Then - Should have game-specific title
  371 |     expect(title.length > 0).toBe(true);
  372 |   });
  373 | 
  374 |   test('3.0-E2E-028 [P2] Game detail page has share functionality', async ({ page }) => {
  375 |     // Given - Game detail page is loaded
  376 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  377 | 
  378 |     // When - Look for share buttons
  379 |     const shareButtons = page.locator('.share, [data-testid="share"]');
  380 | 
  381 |     // Then - May or may not have share functionality
  382 |     const count = await shareButtons.count();
  383 |     expect(count >= 0).toBe(true);
  384 |   });
  385 | 
  386 |   test('3.0-E2E-029 [P2] Game detail page has bookmark functionality', async ({ page }) => {
  387 |     // Given - Game detail page is loaded
  388 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  389 | 
  390 |     // When - Look for bookmark button
  391 |     const bookmarkBtn = page.locator('.bookmark, [data-testid="bookmark"]');
  392 | 
  393 |     // Then - May or may not have bookmark functionality
  394 |     const count = await bookmarkBtn.count();
  395 |     expect(count >= 0).toBe(true);
  396 |   });
  397 | 
  398 |   test('3.0-E2E-030 [P1] Game detail page URL matches game slug', async ({ page }) => {
  399 |     // Given - Navigate to game detail page
  400 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  401 | 
  402 |     // When - Check URL
  403 |     const url = page.url();
  404 | 
  405 |     // Then - URL should contain the slug
  406 |     expect(url.includes('final-fantasy-vii')).toBe(true);
  407 |   });
  408 | 
  409 |   // ==================== GAME CARD CLICK TESTS ====================
  410 | 
  411 |   test('3.0-E2E-031 [P1] Click featured game card navigates to detail page', async ({ page }) => {
  412 |     // Given - Home page is loaded
  413 |     await page.goto(BASE_URL);
  414 | 
  415 |     // When - Click on a featured game card
  416 |     const gameCard = page.locator('.game-card').first();
  417 |     await gameCard.click();
  418 | 
  419 |     // Then - Should navigate to game detail page
> 420 |     await expect(page).toHaveURL(new RegExp('.*/games/.*'));
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  421 |   });
  422 | 
  423 |   test('3.0-E2E-032 [P1] Game card click shows correct game title in detail page', async ({ page }) => {
  424 |     // Given - Home page is loaded
  425 |     await page.goto(BASE_URL);
  426 | 
  427 |     // When - Click on Final Fantasy VII card and navigate
  428 |     const ff7Card = page.locator('a[href*="final-fantasy-vii"]');
  429 |     if (await ff7Card.count() > 0) {
  430 |       await ff7Card.click();
  431 | 
  432 |       // Then - Detail page should show correct title
  433 |       const title = page.locator('h1');
  434 |       const titleText = await title.textContent();
  435 |       expect(titleText.toLowerCase()).toContain('final fantasy');
  436 |     }
  437 |   });
  438 | 
  439 |   // ==================== PLATFORM TAB TESTS ====================
  440 | 
  441 |   test('3.0-E2E-033 [P2] Platform tabs are visible on game detail page', async ({ page }) => {
  442 |     // Given - Game detail page is loaded
  443 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  444 | 
  445 |     // When - Look for platform tabs
  446 |     const platformTabs = page.locator('[role="tablist"], .platform-tabs');
  447 | 
  448 |     // Then - Platform tabs should exist
  449 |     const count = await platformTabs.count();
  450 |     expect(count >= 0).toBe(true);
  451 |   });
  452 | 
  453 |   test('3.0-E2E-034 [P2] Desktop/Console tab exists and is selectable', async ({ page }) => {
  454 |     // Given - Game detail page is loaded
  455 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  456 | 
  457 |     // When - Look for Desktop/Console tab
  458 |     const desktopConsoleTab = page.locator('button:has-text("Desktop/Console")');
  459 | 
  460 |     // Then - Tab should be clickable
  461 |     if (await desktopConsoleTab.count() > 0) {
  462 |       await desktopConsoleTab.click();
  463 |       await expect(desktopConsoleTab).toBeVisible();
  464 |     }
  465 |   });
  466 | 
  467 |   test('3.0-E2E-035 [P2] Handheld tab exists and is selectable', async ({ page }) => {
  468 |     // Given - Game detail page is loaded
  469 |     await page.goto(`${BASE_URL}/games/final-fantasy-vii`);
  470 | 
  471 |     // When - Look for Handheld tab
  472 |     const handheldTab = page.locator('button:has-text("Handheld")');
  473 | 
  474 |     // Then - Tab should be clickable
  475 |     if (await handheldTab.count() > 0) {
  476 |       await handheldTab.click();
  477 |       await expect(handheldTab).toBeVisible();
  478 |     }
  479 |   });
  480 | 
  481 |   // ==================== EMPTY STATE TESTS ====================
  482 | 
  483 |   test('3.0-E2E-036 [P1] Empty state shows when no search results', async ({ page }) => {
  484 |     // Given - Home page is loaded
  485 |     await page.goto(BASE_URL);
  486 | 
  487 |     // When - Search for non-existent game
  488 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  489 |     await searchInput.fill('NonExistentGame12345XYZ');
  490 | 
  491 |     // Wait for search to complete
  492 |     await page.waitForTimeout(1000);
  493 | 
  494 |     // Then - Empty state should be shown in search results
  495 |     const noResults = page.locator('#searchResults .no-results, #searchResults [data-testid="no-results"]');
  496 |     const isVisible = await noResults.count() > 0;
  497 |     expect(isVisible).toBe(true);
  498 |   });
  499 | 
  500 |   test('3.0-E2E-037 [P1] Empty state has helpful message', async ({ page }) => {
  501 |     // Given - Home page is loaded
  502 |     await page.goto(BASE_URL);
  503 | 
  504 |     // When - Search for non-existent game
  505 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  506 |     await searchInput.fill('XYZNonExistent123');
  507 | 
  508 |     // Wait for search to complete
  509 |     await page.waitForTimeout(1000);
  510 | 
  511 |     // Then - Should show helpful message in search results
  512 |     const noResults = page.locator('#searchResults .no-results');
  513 |     if (await noResults.count() > 0) {
  514 |       const message = await noResults.textContent();
  515 |       expect(message.length > 0).toBe(true);
  516 |     }
  517 |   });
  518 | 
  519 |   // ==================== ROMAN NUMERAL SEARCH TESTS ====================
  520 | 
```