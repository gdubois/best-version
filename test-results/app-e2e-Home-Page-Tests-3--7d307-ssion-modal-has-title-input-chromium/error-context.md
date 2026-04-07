# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-033 [P1] Submission modal has title input
- Location: test/e2e/app-e2e.test.js:609:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
        - link "Submit" [active] [ref=e19] [cursor=pointer]:
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
        - 'heading "Castlevania: Symphony of the Night" [level=3] [ref=e48]'
        - 'img "Castlevania: Symphony of the Night cover art" [ref=e50]'
        - generic [ref=e53]: 🎮 PlayStation 4 (via Castlevania Requiem), Windows (Emulation), iOS/Android (Mobile)
      - generic [ref=e54] [cursor=pointer]:
        - heading "Xenoblade Chronicles X" [level=3] [ref=e56]
        - img "Xenoblade Chronicles X cover art" [ref=e58]
        - generic [ref=e61]: 🎮 Nintendo Switch (Definitive Edition), Wii U (Original)
      - generic [ref=e62] [cursor=pointer]:
        - heading "Bravely Default" [level=3] [ref=e64]
        - img "Bravely Default cover art" [ref=e66]
        - generic [ref=e69]: 🎮 Nintendo Switch 2 / PC (Steam) / Xbox Series X|S, Nintendo 3DS, Nintendo 3DS (Original Release)
      - generic [ref=e70] [cursor=pointer]:
        - heading "Xenoblade Chronicles 2" [level=3] [ref=e72]
        - img "Xenoblade Chronicles 2 cover art" [ref=e74]
        - generic [ref=e77]: 🎮 Nintendo Switch (Base Game + Expansion Pass), Nintendo Switch (Base Game Only), Nintendo Switch (Torna - The Golden Country Standalone)
      - generic [ref=e78] [cursor=pointer]:
        - 'heading "Metal Gear Solid 2: Sons of Liberty" [level=3] [ref=e80]'
        - 'img "Metal Gear Solid 2: Sons of Liberty cover art" [ref=e82]'
        - generic [ref=e85]: 🎮 PlayStation 2, Windows (Steam - Master Collection), Windows (Original PC - GOG), PlayStation 3 / Xbox 360 (HD Collection), Nintendo Switch / PS4 / Xbox One (Master Collection)
      - generic [ref=e86] [cursor=pointer]:
        - heading "Grandia III" [level=3] [ref=e88]
        - img "Grandia III cover art" [ref=e90]
        - generic [ref=e93]: 🎮 PlayStation 2, PlayStation 3 (PSN Classic)
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
    - generic [ref=e246]:
      - heading "Submit a Game" [level=2] [ref=e247]
      - button "×" [ref=e248] [cursor=pointer]
    - generic [ref=e250]:
      - generic [ref=e251]:
        - generic [ref=e252]: Game Title *
        - textbox "Game Title *" [ref=e253]:
          - /placeholder: e.g., Final Fantasy VII
        - paragraph [ref=e254]: Enter the official title of the game
      - generic [ref=e255]:
        - generic [ref=e256]: Alternative Names
        - textbox "Alternative Names" [ref=e257]:
          - /placeholder: Comma-separated (e.g., FF7, Final Fantasy 7)
        - paragraph [ref=e258]: Helpful for search - include common abbreviations or variants
      - generic [ref=e259]:
        - generic [ref=e260]: Platform
        - generic [ref=e261]:
          - generic [ref=e262] [cursor=pointer]:
            - checkbox "Desktop/Console" [ref=e263]
            - generic [ref=e264]: Desktop/Console
          - generic [ref=e265] [cursor=pointer]:
            - checkbox "Handheld" [ref=e266]
            - generic [ref=e267]: Handheld
        - paragraph [ref=e268]: "Optional: Select platform(s) if known"
      - generic [ref=e269]:
        - generic [ref=e270]: Recommendations
        - generic [ref=e272]:
          - generic [ref=e274]: Recommendation 1
          - generic [ref=e275]:
            - textbox "Emulator name (e.g., RetroArch, mGBA)" [ref=e276]
            - textbox "Version (optional)" [ref=e277]
            - textbox "Config link (optional)" [ref=e278]
        - button "+ Add Recommendation" [ref=e279] [cursor=pointer]
      - generic [ref=e280]:
        - generic [ref=e281]: Additional Notes
        - textbox "Additional Notes" [ref=e282]:
          - /placeholder: Any additional information about this game or recommended setup...
        - paragraph [ref=e283]: Optional context that might help with the submission
      - generic [ref=e284]:
        - generic [ref=e285]: Email (Optional)
        - textbox "Email (Optional)" [ref=e286]:
          - /placeholder: your@email.com
        - paragraph [ref=e287]: Receive notifications when your submission is approved or rejected
      - generic [ref=e288]:
        - generic [ref=e289]: Human Verification
        - generic [ref=e290]: "[hCaptcha will be integrated for bot protection]"
      - button "Submit Game" [ref=e292] [cursor=pointer]
```

# Test source

```ts
  524 | 
  525 |     // When - Search with Roman numeral
  526 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  527 |     await searchInput.fill('Final Fantasy VII');
  528 | 
  529 |     await page.waitForTimeout(1000);
  530 | 
  531 |     // Then - Should find results
  532 |     const results = page.locator('.game-card, .game-entry, [data-testid="game"]');
  533 |     const count = await results.count();
  534 | 
  535 |     expect(count >= 0).toBe(true);
  536 |   });
  537 | 
  538 |   test('3.0-E2E-039 [P2] Roman numeral search works for both VII and 7', async ({ page }) => {
  539 |     // Given - Home page is loaded
  540 |     await page.goto(BASE_URL);
  541 | 
  542 |     // When - Search with Arabic numeral first
  543 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  544 |     await searchInput.fill('Final Fantasy 7');
  545 | 
  546 |     await page.waitForTimeout(1000);
  547 | 
  548 |     const results1 = page.locator('.game-card, .game-entry, [data-testid="game"]');
  549 |     const count1 = await results1.count();
  550 | 
  551 |     // Then - Search with Roman numeral
  552 |     await searchInput.fill('Final Fantasy VII');
  553 |     await page.waitForTimeout(1000);
  554 | 
  555 |     const results2 = page.locator('.game-card, .game-entry, [data-testid="game"]');
  556 |     const count2 = await results2.count();
  557 | 
  558 |     expect(count1 >= 0 && count2 >= 0).toBe(true);
  559 |   });
  560 | 
  561 |   test('3.0-E2E-040 [P2] Roman numeral search for Persona III', async ({ page }) => {
  562 |     // Given - Home page is loaded
  563 |     await page.goto(BASE_URL);
  564 | 
  565 |     // When - Search with Roman numeral III
  566 |     const searchInput = page.locator('#gameSearch, input[placeholder*="search"]');
  567 |     await searchInput.fill('Persona III');
  568 | 
  569 |     await page.waitForTimeout(1000);
  570 | 
  571 |     // Then - Should find results or handle gracefully
  572 |     const results = page.locator('.game-card, .game-entry, [data-testid="game"]');
  573 |     const count = await results.count();
  574 | 
  575 |     expect(count >= 0).toBe(true);
  576 |   });
  577 | 
  578 |   // ==================== SUBMISSION MODAL TESTS (SPA-based) ====================
  579 |   // Note: App is SPA - submit form is in a modal
  580 | 
  581 |   test('3.0-E2E-031 [P1] Submission modal is accessible', async ({ page }) => {
  582 |     // Given - Home page is loaded
  583 |     await page.goto(BASE_URL);
  584 | 
  585 |     // When - Look for submit link/button
  586 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit"), [data-testid="submit"]');
  587 | 
  588 |     // Then - Submit should be accessible
  589 |     const isVisible = await submitLink.count() > 0;
  590 |     expect(isVisible).toBe(true);
  591 |   });
  592 | 
  593 |   test('3.0-E2E-032 [P1] Submission modal opens when clicking submit', async ({ page }) => {
  594 |     // Given - Home page is loaded
  595 |     await page.goto(BASE_URL);
  596 | 
  597 |     // When - Click submit link
  598 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  599 |     if (await submitLink.count() > 0) {
  600 |       await submitLink.first().click();
  601 |     }
  602 | 
  603 |     // Then - Modal should be visible
  604 |     const modal = page.locator('#submitModal, .submit-modal.active');
  605 |     const isVisible = await modal.count() > 0;
  606 |     expect(isVisible).toBe(true);
  607 |   });
  608 | 
  609 |   test('3.0-E2E-033 [P1] Submission modal has title input', async ({ page }) => {
  610 |     // Given - Home page is loaded
  611 |     await page.goto(BASE_URL);
  612 | 
  613 |     // When - Open submit modal
  614 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  615 |     if (await submitLink.count() > 0) {
  616 |       await submitLink.first().click();
  617 |     }
  618 | 
  619 |     await page.waitForTimeout(500);
  620 | 
  621 |     // Then - Title input should exist in modal
  622 |     const titleInput = page.locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]');
  623 |     const exists = await titleInput.count() > 0;
> 624 |     expect(exists).toBe(true);
      |                    ^ Error: expect(received).toBe(expected) // Object.is equality
  625 |   });
  626 | 
  627 |   test('3.0-E2E-034 [P1] Submission modal has platform selection', async ({ page }) => {
  628 |     // Given - Home page is loaded
  629 |     await page.goto(BASE_URL);
  630 | 
  631 |     // When - Open submit modal
  632 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  633 |     if (await submitLink.count() > 0) {
  634 |       await submitLink.first().click();
  635 |     }
  636 | 
  637 |     await page.waitForTimeout(500);
  638 | 
  639 |     // Then - Platform input should exist in modal
  640 |     const platformInput = page.locator('#submitModal input[name="platforms"], #submitModal select[name="platforms"]');
  641 |     const exists = await platformInput.count() > 0;
  642 |     expect(exists).toBe(true);
  643 |   });
  644 | 
  645 |   test('3.0-E2E-035 [P1] Submission modal has recommendations section', async ({ page }) => {
  646 |     // Given - Home page is loaded
  647 |     await page.goto(BASE_URL);
  648 | 
  649 |     // When - Open submit modal
  650 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  651 |     if (await submitLink.count() > 0) {
  652 |       await submitLink.first().click();
  653 |     }
  654 | 
  655 |     await page.waitForTimeout(500);
  656 | 
  657 |     // Then - Recommendations section should exist in modal
  658 |     const recs = page.locator('#submitModal .recommendations, #submitModal [data-testid="recommendations"]');
  659 |     const count = await recs.count();
  660 |     expect(count >= 0).toBe(true);
  661 |   });
  662 | 
  663 |   test('3.0-E2E-036 [P1] Submission modal has notes textarea', async ({ page }) => {
  664 |     // Given - Home page is loaded
  665 |     await page.goto(BASE_URL);
  666 | 
  667 |     // When - Open submit modal
  668 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  669 |     if (await submitLink.count() > 0) {
  670 |       await submitLink.first().click();
  671 |     }
  672 | 
  673 |     await page.waitForTimeout(500);
  674 | 
  675 |     // Then - Notes textarea should exist in modal
  676 |     const notes = page.locator('#submitModal textarea[name="notes"], #submitModal textarea[placeholder*="notes"]');
  677 |     const exists = await notes.count() > 0;
  678 |     expect(exists).toBe(true);
  679 |   });
  680 | 
  681 |   test('3.0-E2E-037 [P1] Submission modal has email input', async ({ page }) => {
  682 |     // Given - Home page is loaded
  683 |     await page.goto(BASE_URL);
  684 | 
  685 |     // When - Open submit modal
  686 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  687 |     if (await submitLink.count() > 0) {
  688 |       await submitLink.first().click();
  689 |     }
  690 | 
  691 |     await page.waitForTimeout(500);
  692 | 
  693 |     // Then - Email input should exist in modal
  694 |     const emailInput = page.locator('#submitModal input[type="email"], #submitModal input[name="email"]');
  695 |     const exists = await emailInput.count() > 0;
  696 |     expect(exists).toBe(true);
  697 |   });
  698 | 
  699 |   test('3.0-E2E-038 [P1] Submission modal has submit button', async ({ page }) => {
  700 |     // Given - Home page is loaded
  701 |     await page.goto(BASE_URL);
  702 | 
  703 |     // When - Open submit modal
  704 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  705 |     if (await submitLink.count() > 0) {
  706 |       await submitLink.first().click();
  707 |     }
  708 | 
  709 |     await page.waitForTimeout(500);
  710 | 
  711 |     // Then - Submit button should exist in modal
  712 |     const submitBtn = page.locator('#submitModal button[type="submit"], #submitModal button:has-text("Submit")');
  713 |     const exists = await submitBtn.count() > 0;
  714 |     expect(exists).toBe(true);
  715 |   });
  716 | 
  717 |   test('3.0-E2E-039 [P1] Submission modal form submits successfully', async ({ page }) => {
  718 |     // Given - Home page is loaded
  719 |     await page.goto(BASE_URL);
  720 | 
  721 |     // When - Open submit modal and fill form
  722 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  723 |     if (await submitLink.count() > 0) {
  724 |       await submitLink.first().click();
```