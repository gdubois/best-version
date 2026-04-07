# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-e2e.test.js >> Home Page Tests >> 3.0-E2E-042 [P2] Submission modal shows success message
- Location: test/e2e/app-e2e.test.js:792:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]')

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
        - heading "Final Fantasy XVI" [level=3] [ref=e48]
        - img "Final Fantasy XVI cover art" [ref=e50]
        - generic [ref=e53]: 🎮 PlayStation 5 Pro (Game Boost), Windows (Steam) with FFXVIFix Mod, PlayStation 5 (Standard), Windows (DirectX 12)
      - generic [ref=e54] [cursor=pointer]:
        - 'heading "Cannon Fodder 2: Once More unto the Breach" [level=3] [ref=e56]'
        - 'img "Cannon Fodder 2: Once More unto the Breach cover art" [ref=e58]'
        - generic [ref=e61]: 🎮 Windows (OpenFodder), Windows (GOG.com), Amiga, MS-DOS (Original)
      - generic [ref=e62] [cursor=pointer]:
        - heading "Dispatch" [level=3] [ref=e64]
        - img "Dispatch cover art" [ref=e66]
        - generic [ref=e69]: 🎮 Windows (Steam), PlayStation 5, Nintendo Switch 2, Nintendo Switch
      - generic [ref=e70] [cursor=pointer]:
        - heading "Beyond Shadowgate" [level=3] [ref=e72]
        - img "Beyond Shadowgate cover art" [ref=e74]
        - generic [ref=e77]: 🎮 Windows (Steam/GOG)
      - generic [ref=e78] [cursor=pointer]:
        - 'heading "Fire Emblem: Three Houses" [level=3] [ref=e80]'
        - 'img "Fire Emblem: Three Houses cover art" [ref=e82]'
        - generic [ref=e85]: 🎮 Nintendo Switch (OLED/Standard)
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
  725 |     }
  726 | 
  727 |     await page.waitForTimeout(500);
  728 | 
  729 |     const titleInput = page.locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]');
  730 |     const emailInput = page.locator('#submitModal input[type="email"], #submitModal input[name="email"]');
  731 | 
  732 |     await titleInput.fill('Test Submission Game');
  733 |     await emailInput.fill('test@example.com');
  734 | 
  735 |     const submitBtn = page.locator('#submitModal button[type="submit"]');
  736 |     await submitBtn.click();
  737 | 
  738 |     // Then - Should show success message
  739 |     await page.waitForTimeout(1000);
  740 | 
  741 |     const successMsg = page.locator('#submitModal .success, #submitModal [data-testid="success"]');
  742 |     const isVisible = await successMsg.count() > 0;
  743 |     expect(isVisible).toBe(true);
  744 |   });
  745 | 
  746 |   test('3.0-E2E-040 [P2] Submission modal validates required fields', async ({ page }) => {
  747 |     // Given - Home page is loaded
  748 |     await page.goto(BASE_URL);
  749 | 
  750 |     // When - Open submit modal
  751 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  752 |     if (await submitLink.count() > 0) {
  753 |       await submitLink.first().click();
  754 |     }
  755 | 
  756 |     await page.waitForTimeout(500);
  757 | 
  758 |     // When - Try to submit empty form
  759 |     const submitBtn = page.locator('#submitModal button[type="submit"]');
  760 |     await submitBtn.click();
  761 | 
  762 |     // Then - Should show validation errors
  763 |     await page.waitForTimeout(1000);
  764 | 
  765 |     const titleInput = page.locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]');
  766 |     const value = await titleInput.inputValue();
  767 | 
  768 |     expect(value.length >= 0).toBe(true);
  769 |   });
  770 | 
  771 |   test('3.0-E2E-041 [P2] Submission modal handles hCaptcha', async ({ page }) => {
  772 |     // Given - Home page is loaded
  773 |     await page.goto(BASE_URL);
  774 | 
  775 |     // When - Open submit modal
  776 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  777 |     if (await submitLink.count() > 0) {
  778 |       await submitLink.first().click();
  779 |     }
  780 | 
  781 |     await page.waitForTimeout(500);
  782 | 
  783 |     // When - Look for hCaptcha in modal
  784 |     const captcha = page.locator('#submitModal .hcaptcha, #submitModal [data-sitekey]');
  785 | 
  786 |     // Then - hCaptcha may or may not be present (depends on config)
  787 |     const count = await captcha.count();
  788 | 
  789 |     expect(count >= 0).toBe(true);
  790 |   });
  791 | 
  792 |   test('3.0-E2E-042 [P2] Submission modal shows success message', async ({ page }) => {
  793 |     // Given - Home page is loaded
  794 |     await page.goto(BASE_URL);
  795 | 
  796 |     // When - Open submit modal
  797 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  798 |     if (await submitLink.count() > 0) {
  799 |       await submitLink.first().click();
  800 |     }
  801 | 
  802 |     await page.waitForTimeout(500);
  803 | 
  804 |     // When - Submit valid form
  805 |     const titleInput = page.locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]');
  806 |     const emailInput = page.locator('#submitModal input[type="email"], #submitModal input[name="email"]');
  807 | 
> 808 |     await titleInput.fill('Test Game 2');
      |                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  809 |     await emailInput.fill('test2@example.com');
  810 | 
  811 |     const submitBtn = page.locator('#submitModal button[type="submit"]');
  812 |     await submitBtn.click();
  813 | 
  814 |     // Then - Look for success message
  815 |     await page.waitForTimeout(2000);
  816 | 
  817 |     const successMsg = page.locator('#submitModal .success, #submitModal [data-testid="success"]');
  818 |     const count = await successMsg.count();
  819 | 
  820 |     expect(count >= 0).toBe(true);
  821 |   });
  822 | 
  823 |   test('3.0-E2E-043 [P2] Submission modal prevents duplicate submissions', async ({ page }) => {
  824 |     // Given - Home page is loaded
  825 |     await page.goto(BASE_URL);
  826 | 
  827 |     // When - Open submit modal
  828 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  829 |     if (await submitLink.count() > 0) {
  830 |       await submitLink.first().click();
  831 |     }
  832 | 
  833 |     await page.waitForTimeout(500);
  834 | 
  835 |     // When - Submit same data twice
  836 |     const titleInput = page.locator('#submitModal input[name="title"], #submitModal input[placeholder*="title"]');
  837 |     const emailInput = page.locator('#submitModal input[type="email"], #submitModal input[name="email"]');
  838 | 
  839 |     await titleInput.fill('Duplicate Test');
  840 |     await emailInput.fill('duplicate@example.com');
  841 | 
  842 |     const submitBtn = page.locator('#submitModal button[type="submit"]');
  843 |     await submitBtn.click();
  844 | 
  845 |     // Wait and try again
  846 |     await page.waitForTimeout(1000);
  847 | 
  848 |     await submitBtn.click();
  849 | 
  850 |     // Then - Form should handle gracefully
  851 |     await page.waitForTimeout(1000);
  852 | 
  853 |     expect(true).toBe(true);
  854 |   });
  855 | 
  856 |   test('3.0-E2E-044 [P2] Submission modal has clear button', async ({ page }) => {
  857 |     // Given - Home page is loaded
  858 |     await page.goto(BASE_URL);
  859 | 
  860 |     // When - Open submit modal
  861 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  862 |     if (await submitLink.count() > 0) {
  863 |       await submitLink.first().click();
  864 |     }
  865 | 
  866 |     await page.waitForTimeout(500);
  867 | 
  868 |     // When - Look for clear/reset button
  869 |     const clearBtn = page.locator('#submitModal button[type="reset"], #submitModal .clear-btn');
  870 | 
  871 |     // Then - May or may not have clear button
  872 |     const count = await clearBtn.count();
  873 | 
  874 |     expect(count >= 0).toBe(true);
  875 |   });
  876 | 
  877 |   test('3.0-E2E-045 [P1] Submit modal has close button', async ({ page }) => {
  878 |     // Given - Home page is loaded
  879 |     await page.goto(BASE_URL);
  880 | 
  881 |     // When - Open submit modal
  882 |     const submitLink = page.locator('a:has-text("Submit"), button:has-text("Submit")');
  883 |     if (await submitLink.count() > 0) {
  884 |       await submitLink.first().click();
  885 |     }
  886 | 
  887 |     await page.waitForTimeout(500);
  888 | 
  889 |     // When - Look for close button
  890 |     const closeBtn = page.locator('#submitModal .submit-close, #submitModal button:has-text("Close")');
  891 | 
  892 |     // Then - Close button should exist
  893 |     await expect(closeBtn).toBeVisible();
  894 |   });
  895 | 
  896 |   // ==================== ADMIN PAGE TESTS ====================
  897 |   // Note: Admin pages served at /admin and /admin/login routes
  898 | 
  899 |   test('3.0-E2E-046 [P1] Admin page loads', async ({ page }) => {
  900 |     // Given - Navigate to admin page
  901 |     await page.goto(`${BASE_URL}/admin`);
  902 | 
  903 |     // Then - Page should load
  904 |     await expect(page).toHaveURL(new RegExp('.*/admin.*'));
  905 |   });
  906 | 
  907 |   test('3.0-E2E-047 [P2] Admin page shows stats', async ({ page }) => {
  908 |     // Given - Admin page is loaded
```