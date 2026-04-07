# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-056 [P1] Navigation between pages works
- Location: test/e2e/app-e2e.test.js:1023:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/games/**" until "load"
============================================================
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
        - heading "Grandia" [level=3] [ref=e48]
        - img "Grandia cover art" [ref=e50]
        - generic [ref=e53]: 🎮 PlayStation, Nintendo Switch / Windows (Steam), Sega Saturn
      - generic [ref=e54] [cursor=pointer]:
        - heading "Metal Gear" [level=3] [ref=e56]
        - img "Metal Gear cover art" [ref=e58]
        - generic [ref=e61]: 🎮 Windows (GOG.com), Nintendo Switch / PlayStation 4 / PlayStation 5 / Xbox Series X/S, MSX2, Nintendo Entertainment System (NES), Commodore 64, MS-DOS
      - generic [ref=e62] [cursor=pointer]:
        - heading "Xenoblade Chronicles X" [level=3] [ref=e64]
        - img "Xenoblade Chronicles X cover art" [ref=e66]
        - generic [ref=e69]: 🎮 Nintendo Switch (Definitive Edition), Wii U (Original)
      - generic [ref=e70] [cursor=pointer]:
        - 'heading "Metal Gear Solid 2: Sons of Liberty" [level=3] [ref=e72]'
        - 'img "Metal Gear Solid 2: Sons of Liberty cover art" [ref=e74]'
        - generic [ref=e77]: 🎮 PlayStation 2, Windows (Steam - Master Collection), Windows (Original PC - GOG), PlayStation 3 / Xbox 360 (HD Collection), Nintendo Switch / PS4 / Xbox One (Master Collection)
      - generic [ref=e78] [cursor=pointer]:
        - heading "Super Mario World" [level=3] [ref=e80]
        - img "Super Mario World cover art" [ref=e82]
        - generic [ref=e85]: 🎮 Nintendo Switch (Nintendo Switch Online), Super Nintendo Entertainment System (SNES), Super Nintendo Entertainment System (SNES) - Original Hardware, Game Boy Advance, Nintendo Switch (SNES Classic Edition)
      - generic [ref=e86] [cursor=pointer]:
        - 'heading "Persona 5: The Phantom X" [level=3] [ref=e88]'
        - 'img "Persona 5: The Phantom X cover art" [ref=e90]'
        - generic [ref=e93]: 🎮 PlayStation 5 / Xbox Series X|S, Windows (PC - Steam), Nintendo Switch
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
      - heading "Grandia" [level=2] [ref=e248]
      - img "Grandia cover" [ref=e250]
      - generic [ref=e251]:
        - heading "🎮 Recommended Versions & Patches" [level=3] [ref=e252]
        - generic [ref=e253]:
          - heading "🎮 PlayStation" [level=4] [ref=e254]
          - paragraph [ref=e255]: The definitive version with official English localization, widely available through PSN and physical copies. Features DualShock support and PocketStation compatibility.
        - generic [ref=e256]:
          - heading "🎮 Nintendo Switch / Windows (Steam)" [level=4] [ref=e257]
          - paragraph [ref=e258]: HD Remaster version with enhanced visuals, widescreen support, and multiple language options. Based on PlayStation code but references Saturn for visual details.
          - generic [ref=e259]:
            - heading "Recommended Patches & Mods:" [level=5] [ref=e260]
            - generic [ref=e261]:
              - generic [ref=e262]:
                - generic [ref=e263]: 📦 HD Remaster Bug Fix Patch
                - generic [ref=e264]: Download
              - paragraph [ref=e265]: Official patch addressing various bugs including localization errors and game freezing issues (version 1.01.00+)
              - link "Download Patch" [ref=e266] [cursor=pointer]:
                - /url: https://store.steampowered.com/app/1034860/Grandia_HD_Remaster/
        - generic [ref=e267]:
          - heading "🎮 Sega Saturn" [level=4] [ref=e268]
          - paragraph [ref=e269]: The original version with superior visual effects, better frame rates in town areas, and building shadows not present in the PS1 port. Requires English translation patch for non-Japanese players.
          - generic [ref=e270]:
            - heading "Recommended Patches & Mods:" [level=5] [ref=e271]
            - generic [ref=e272]:
              - generic [ref=e273]:
                - generic [ref=e274]: 📦 Sega Saturn English Translation Patch
                - generic [ref=e275]: Download
              - paragraph [ref=e276]: Applies the official PlayStation English translation to the Japanese Saturn release. Created by TrekkiesUnite118 and team.
              - link "Download Patch" [ref=e277] [cursor=pointer]:
                - /url: https://segaxtreme.net/resources/grandia-english-patch.67/
      - generic [ref=e278]:
        - paragraph [ref=e279]: "Released on:"
        - list [ref=e280]:
          - listitem [ref=e281]: Sega Saturn (Japan) - 1997-12-18
          - listitem [ref=e282]: PlayStation (Japan) - 1999-06-24
          - listitem [ref=e283]: PlayStation (North America) - 1999-10-26
          - listitem [ref=e284]: PlayStation (Europe) - 2000-03-31
          - listitem [ref=e285]: Nintendo Switch (Worldwide) - 2019-08-16
          - listitem [ref=e286]: Windows (Steam) (Worldwide) - 2019-10-15
          - listitem [ref=e287]: PlayStation 4 (Worldwide) - 2024-03-26
          - listitem [ref=e288]: Xbox One (Worldwide) - 2024-03-26
          - paragraph
      - generic [ref=e289]:
        - heading "Synopsis" [level=3] [ref=e290]
        - paragraph [ref=e291]: A young boy named Justin inherits a magic stone that leads him on an adventure around the world to uncover the mystery of a long-lost civilization while evading the militaristic Garlyle Forces.
      - generic [ref=e292]:
        - heading "Key Features" [level=3] [ref=e293]
        - list [ref=e294]:
          - listitem [ref=e295]: ✓ Innovative real-time battle system with IP bar timing mechanics
          - listitem [ref=e296]: ✓ Rotational party roster with skill-based character progression
          - listitem [ref=e297]: ✓ Preemptive strike system based on attack angle and positioning
          - listitem [ref=e298]: ✓ 3D environments with 2D animated bitmap sprites
          - listitem [ref=e299]: ✓ Fully rotational camera for exploration
      - generic [ref=e300]:
        - heading "Long Description" [level=3] [ref=e301]
        - paragraph [ref=e302]: Grandia, developed by Game Arts over a period of more than two years following their Lunar series work, is considered one of the finest JRPGs of the late 1990s. The game was originally intended for Sega CD but shifted to Saturn during development. Featuring 20,000 frames of animation and music composed by Noriyuki Iwadare (recorded at Skywalker Sound), Grandia introduced an innovative battle system where players must time their attacks based on the IP bar mechanics. The story follows Justin, a young adventurer seeking his missing father while uncovering ancient secrets about the Icarians and the parasitic creature Gaia. The game received near-universal acclaim, with GameSpot calling it 'every bit as worthwhile as Final Fantasy VIII' and IGN ranking it 17th on their top PlayStation games list in 2000.
      - generic [ref=e303]:
        - heading "Legacy and Impact" [level=3] [ref=e304]
        - list [ref=e305]:
          - listitem [ref=e306]: • Influenced battle system design in numerous subsequent JRPGs
          - listitem [ref=e307]: • Featured prominently in GameSpot's 'Best RPGs of All Time' lists
          - listitem [ref=e308]: • Voted 73rd greatest game of all time by Famitsu readers in 2006
          - listitem [ref=e309]: • Established Game Arts as a premier JRPG developer alongside Square and Enix
          - listitem [ref=e310]: • Continued to receive ports and remasters decades after original release
      - generic [ref=e311]:
        - heading "Genres" [level=3] [ref=e312]
        - paragraph [ref=e313]: RPG
      - generic [ref=e314]:
        - heading "Themes" [level=3] [ref=e315]
        - paragraph [ref=e316]: Adventure, Exploration, Ancient Civilization, Friendship, Coming of Age
      - generic [ref=e317]:
        - heading "Critical Reception" [level=3] [ref=e318]
        - paragraph [ref=e319]: "\"Grandia is a landmark JRPG praised for its innovative battle system, charming characters, and memorable world design. Its blend of real-time combat with strategic elements set new standards for the genre.\""
        - paragraph [ref=e320]:
          - strong [ref=e321]: "Score:"
          - text: 8.9/10
      - generic [ref=e322]:
        - heading "Developers & Publishers" [level=3] [ref=e323]
        - paragraph [ref=e324]:
          - strong [ref=e325]: "Developed by:"
          - text: Game Arts
        - paragraph [ref=e326]:
          - strong [ref=e327]: "Published by:"
          - text: Entertainment Software Publishing, Sony Computer Entertainment, Ubisoft, GungHo Online Entertainment
      - generic [ref=e328]:
        - heading "🎯 Similar Games" [level=3] [ref=e329]
        - list [ref=e330]:
          - listitem [ref=e331]:
            - 'link "Lunar: Silver Star Story Complete" [ref=e332] [cursor=pointer]':
              - /url: "#"
          - listitem [ref=e333]:
            - link "Final Fantasy VI" [ref=e334] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=e335]:
            - link "Chrono Trigger" [ref=e336] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=e337]:
            - link "Xenogears" [ref=e338] [cursor=pointer]:
              - /url: "#"
          - listitem [ref=e339]:
            - 'link "Star Ocean: The Second Story" [ref=e340] [cursor=pointer]':
              - /url: "#"
      - button "Close" [ref=e342] [cursor=pointer]
```

# Test source

```ts
  934  | 
  935  |     // Then - Page should load
  936  |     await expect(page).toHaveURL(new RegExp('.*/admin/login.*'));
  937  |   });
  938  | 
  939  |   test('3.0-E2E-050 [P2] Admin login form has token input', async ({ page }) => {
  940  |     // Given - Admin login page is loaded
  941  |     await page.goto(`${BASE_URL}/admin/login`);
  942  | 
  943  |     // When - Look for token input
  944  |     const tokenInput = page.locator('input[name="token"], #admin-token, input[type="password"]');
  945  | 
  946  |     // Then - Token input should exist
  947  |     const count = await tokenInput.count();
  948  |     expect(count >= 0).toBe(true);
  949  |   });
  950  | 
  951  |   test('3.0-E2E-051 [P2] Admin login form has submit button', async ({ page }) => {
  952  |     // Given - Admin login page is loaded
  953  |     await page.goto(`${BASE_URL}/admin/login`);
  954  | 
  955  |     // When - Look for submit button
  956  |     const submitBtn = page.locator('button[type="submit"]');
  957  | 
  958  |     // Then - Submit button should exist
  959  |     const count = await submitBtn.count();
  960  |     expect(count >= 0).toBe(true);
  961  |   });
  962  | 
  963  |   // ==================== LEGAL PAGE TESTS ====================
  964  |   // Note: Legal pages are static HTML files at /legal/privacy.html and /legal/terms.html
  965  | 
  966  |   test('3.0-E2E-051 [P1] Privacy policy page loads', async ({ page }) => {
  967  |     // Given - Navigate to privacy page
  968  |     await page.goto(`${BASE_URL}/legal/privacy.html`);
  969  | 
  970  |     // Then - Page should load
  971  |     await expect(page).toHaveURL(new RegExp('.*/legal/privacy.*'));
  972  |   });
  973  | 
  974  |   test('3.0-E2E-052 [P1] Privacy page has content', async ({ page }) => {
  975  |     // Given - Privacy page is loaded
  976  |     await page.goto(`${BASE_URL}/legal/privacy.html`);
  977  | 
  978  |     // When - Look for content
  979  |     const content = page.locator('main, .content, [data-testid="content"]');
  980  | 
  981  |     // Then - Content should exist
  982  |     const count = await content.count();
  983  | 
  984  |     expect(count >= 0).toBe(true);
  985  |   });
  986  | 
  987  |   test('3.0-E2E-053 [P1] Terms of service page loads', async ({ page }) => {
  988  |     // Given - Navigate to terms page
  989  |     await page.goto(`${BASE_URL}/legal/terms.html`);
  990  | 
  991  |     // Then - Page should load
  992  |     await expect(page).toHaveURL(new RegExp('.*/legal/terms.*'));
  993  |   });
  994  | 
  995  |   test('3.0-E2E-054 [P1] Terms page has content', async ({ page }) => {
  996  |     // Given - Terms page is loaded
  997  |     await page.goto(`${BASE_URL}/legal/terms.html`);
  998  | 
  999  |     // When - Look for content
  1000 |     const content = page.locator('main, .content, [data-testid="content"]');
  1001 | 
  1002 |     // Then - Content should exist
  1003 |     const count = await content.count();
  1004 | 
  1005 |     expect(count >= 0).toBe(true);
  1006 |   });
  1007 | 
  1008 |   test('3.0-E2E-055 [P2] Legal pages have navigation back to home', async ({ page }) => {
  1009 |     // Given - Privacy page is loaded
  1010 |     await page.goto(`${BASE_URL}/legal/privacy.html`);
  1011 | 
  1012 |     // When - Look for home link
  1013 |     const homeLink = page.locator('a[href="/"]');
  1014 | 
  1015 |     // Then - Home link should exist
  1016 |     const count = await homeLink.count();
  1017 | 
  1018 |     expect(count >= 0).toBe(true);
  1019 |   });
  1020 | 
  1021 |   // ==================== NAVIGATION TESTS ====================
  1022 | 
  1023 |   test('3.0-E2E-056 [P1] Navigation between pages works', async ({ page }) => {
  1024 |     // Given - Start at home page
  1025 |     await page.goto(BASE_URL);
  1026 | 
  1027 |     // When - Click on game card
  1028 |     const gameCard = page.locator('.game-card, .game-entry, [data-testid="game"]').first();
  1029 | 
  1030 |     if (await gameCard.count() > 0) {
  1031 |       await gameCard.click();
  1032 | 
  1033 |       // Then - Should navigate to game detail page
> 1034 |       await page.waitForURL('**/games/**');
       |                  ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  1035 |     }
  1036 |   });
  1037 | 
  1038 |   test('3.0-E2E-057 [P1] Breadcrumb navigation works (if present)', async ({ page }) => {
  1039 |     // Given - Game detail page is loaded
  1040 |     await page.goto(`${BASE_URL}/games/pokemon-emerald`);
  1041 | 
  1042 |     // When - Look for breadcrumbs
  1043 |     const breadcrumbs = page.locator('.breadcrumb, [data-testid="breadcrumb"]');
  1044 | 
  1045 |     // Then - May or may not have breadcrumbs
  1046 |     const count = await breadcrumbs.count();
  1047 | 
  1048 |     expect(count >= 0).toBe(true);
  1049 |   });
  1050 | 
  1051 |   test('3.0-E2E-058 [P2] Footer navigation links work', async ({ page }) => {
  1052 |     // Given - Home page is loaded
  1053 |     await page.goto(BASE_URL);
  1054 | 
  1055 |     // When - Click on footer link
  1056 |     const footerLink = page.locator('footer a').first();
  1057 | 
  1058 |     if (await footerLink.count() > 0) {
  1059 |       await footerLink.click();
  1060 | 
  1061 |       // Then - Should navigate
  1062 |       await page.waitForURL();
  1063 |     }
  1064 |   });
  1065 | 
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
```