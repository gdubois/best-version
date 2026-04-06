# E2E Test Coverage Analysis Report

**Project:** RetroGame Curator (Best Version)
**Date:** 2026-04-06
**Test File:** `test/e2e/app-e2e.test.js`

---

## Executive Summary

The current E2E test suite has **significant gaps** in coverage for critical user interactions defined in the PRD and architecture documents. Additionally, several tests reference pages that have incorrect routes.

### Key Findings

| Category | Count | Status |
|----------|-------|--------|
| Tests for non-existent routes | 2 | ❌ Need fixing |
| Missing core interactions | 6 | ❌ Need adding |
| Tests covering existing features | 15 | ✅ Good coverage |
| Total tests | 100 | ⚠️ Many are weak assertions |

---

## Page Route Analysis

### Routes That Exist (Per Frontend)

| Route | Page | Status |
|-------|------|--------|
| `/` | `src/pages/index.astro` | ✅ Exists |
| `/search` | `src/pages/search.astro` | ✅ Exists |
| `/submit` | `src/pages/submit.astro` | ✅ Exists |
| `/game/[slug]` | **Does NOT exist** | ❌ Missing |
| `/admin/*` | **Does NOT exist** | ❌ Missing (v2.0+) |

### Test Issues Found

1. **Test 3.0-E2E-021 to 3.0-E2E-030** - Test game detail page at `/games/pokemon-emerald`
   - **Issue:** Actual route should be `/game/pokemon-emerald` (single "e" not plural)
   - **Bigger Issue:** Game detail page **does not exist** in frontend

2. **Tests 3.0-E2E-046 to 3.0-E2E-050** - Admin page tests
   - **Issue:** Admin pages are **v2.0+ features**, not in MVP
   - **Action:** Mark as skipped or move to v2.0 test suite

---

## User Interaction Coverage Analysis

### ✅ WELL COVERED (Tests exist with meaningful assertions)

| User Interaction | Test IDs | Notes |
|-----------------|----------|-------|
| Home page loads | 3.0-E2E-001 | ✅ Checks title |
| Home page has navigation | 3.0-E2E-002 | ✅ Checks nav element |
| Search bar exists on home | 3.0-E2E-003 | ✅ Checks input |
| Game cards display | 3.0-E2E-004 | ✅ Counts cards |
| Submission page loads | 3.0-E2E-031 | ✅ Checks URL |
| Submission form exists | 3.0-E2E-032 | ✅ Checks form |
| Footer exists | 3.0-E2E-005 | ✅ Checks footer |
| Legal links exist | 3.0-E2E-006 | ✅ Privacy + Terms |
| Responsive tests | 3.0-E2E-010, 3.0-E2E-066-068 | ✅ Mobile/tablet/desktop |
| Basic SEO | 3.0-E2E-009, 3.0-E2E-076-078 | ✅ Meta tags |

### ⚠️ PARTIALLY COVERED (Tests exist but assertions are weak)

| User Interaction | Test IDs | Issue |
|-----------------|----------|-------|
| Home search works | 3.0-E2E-007 | ❌ Uses `waitForTimeout` instead of proper assertions |
| Search page exists | 3.0-E2E-011 | ✅ But 3.0-E2E-018 assumes `/` home link exists |
| Search performs | 3.0-E2E-013 | ❌ Uses `waitForTimeout` |
| Game detail loads | 3.0-E2E-021 | ❌ Wrong route (`/games/` should be `/game/`) |
| Game detail shows title | 3.0-E2E-022 | ❌ Page doesn't exist |
| Submission submits | 3.0-E2E-039 | ❌ Uses `waitForTimeout`, no success verification |
| Submission validation | 3.0-E2E-040 | ❌ Only checks input value, not error messages |
| Navigation between pages | 3.0-E2E-056 | ⚠️ Only checks URL change, not content |

### ❌ MISSING (Critical user interactions not tested)

| User Interaction | Priority | Why It Matters |
|-----------------|----------|---------------|
| **Click featured game card navigates to detail** | P1 | Core user journey - Sarah discovers game |
| **Game detail page shows correct content** | P1 | User needs to see platform recommendations |
| **Platform tabs toggle (TV/Portable)** | P2 | Marcus needs to switch views for TV vs portable |
| **Submission form validation shows errors** | P1 | User needs feedback when fields are empty |
| **Empty state appears when no search results** | P1 | User needs to know search returned nothing |
| **Roman numeral search works** | P2 | "Final Fantasy 7" and "Final Fantasy VII" should return same results |
| **Featured games section displays** | P2 | Home page has featured games, should be tested |
| **Success message after submission** | P1 | SubmissionForm.astro shows success, should be verified |
| **hCaptcha checkbox exists** | P2 | Required by SubmissionForm |

---

## Specific Test Issues & Fixes

### 1. Wrong Route for Game Detail Pages

**Current (Line 298, 306, 317, 328, 340, 360, 371, 383, 395):**
```javascript
await page.goto(`${BASE_URL}/games/pokemon-emerald`);
```

**Should be:**
```javascript
// Note: Game detail page does not exist yet!
// When implemented, route should be:
await page.goto(`${BASE_URL}/game/pokemon-emerald`);
```

### 2. Missing Platform Tab Interaction Tests

**PlatformTabs.astro exists but no tests verify:**
- Clicking "TV" tab shows TV recommendation
- Clicking "Portable" tab shows portable recommendation
- Keyboard navigation (Tab, Enter) works on tabs

**Suggested Test:**
```javascript
test('3.0-E2E-XXX [P2] Platform tabs toggle displays correct content', async ({ page }) => {
  await page.goto(`${BASE_URL}/game/final-fantasy-vii`);
  
  // Click portable tab
  const portableTab = page.locator('[role="tab"]:has-text("Portable")');
  await portableTab.click();
  
  // Verify portable panel is visible
  const portablePanel = page.locator('[role="tabpanel"][id="panel-portable"]');
  await expect(portablePanel).toBeVisible();
});
```

### 3. Missing Submission Form Validation Tests

**Current test 3.0-E2E-040 only checks input value:**
```javascript
test('3.0-E2E-040 [P2] Submission form validates required fields', async ({ page }) => {
  await page.goto(`${BASE_URL}/submit`);
  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();
  await page.waitForTimeout(1000);
  const titleInput = page.locator('input[name="title"]');
  const value = await titleInput.inputValue();
  expect(value.length >= 0).toBe(true); // Useless assertion!
});
```

**Should verify:**
- Error messages appear for required fields
- "Game title is required" message shows
- "Please select at least one platform" message shows

### 4. Missing Empty State Test

**EmptyState.astro exists but no test verifies:**
```javascript
test('3.0-E2E-XXX [P1] Empty state shows when no search results', async ({ page }) => {
  await page.goto(`${BASE_URL}/search`);
  
  // Search for non-existent game
  const searchInput = page.locator('input[type="search"]');
  await searchInput.fill('NonExistentGame12345XYZ');
  await page.locator('button[type="submit"]').click();
  
  // Wait for search to complete
  await page.waitForTimeout(1000);
  
  // Verify empty state
  const emptyState = page.locator('.empty-state, [data-testid="empty"]');
  await expect(emptyState).toBeVisible();
});
```

### 5. Roman Numeral Search Test

**SearchBar.astro has Roman numeral conversion logic but no test:**
```javascript
test('3.0-E2E-XXX [P2] Roman numeral search works correctly', async ({ page }) => {
  await page.goto(`${BASE_URL}/search`);
  
  // Search with Arabic numeral
  const searchInput = page.locator('input[type="search"]');
  await searchInput.fill('Final Fantasy 7');
  await page.locator('button[type="submit"]').click();
  
  // Should find FF7 results
  await page.waitForTimeout(1000);
  const results = page.locator('.game-card');
  const count1 = await results.count();
  
  // Now search with Roman numeral
  await page.goto(`${BASE_URL}/search`);
  await searchInput.fill('Final Fantasy VII');
  await page.locator('button[type="submit"]').click();
  
  await page.waitForTimeout(1000);
  const results2 = page.locator('.game-card');
  const count2 = await results2.count();
  
  // Should return same results
  expect(count1).toBe(count2);
});
```

---

## Recommended Test Priorities

### Phase 1: Critical Fixes (P1)

1. **Remove/fix game detail tests** - Page doesn't exist, fix route to `/game/` when implemented
2. **Add featured game card click test** - Core user journey
3. **Fix search tests** - Remove `waitForTimeout`, add proper assertions
4. **Add submission form validation test** - Verify error messages appear
5. **Add empty state test** - Verify user feedback when no results

### Phase 2: Important Enhancements (P2)

6. **Add platform tab interaction test** - Verify TV/Portable switching
7. **Add Roman numeral search test** - Verify search intelligence
8. **Add featured games display test** - Verify homepage content
9. **Add submission success message test** - Verify form submission flow

### Phase 3: Cleanup

10. **Remove admin page tests** - v2.0+ feature, not in MVP
11. **Replace `waitForTimeout` calls** - Use proper Playwright assertions
12. **Add accessibility tests** - Keyboard navigation, ARIA labels

---

## Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total tests | 100 | 100% |
| Tests with weak assertions (`waitForTimeout`) | 28 | 28% |
| Tests for non-existent routes | 10 | 10% |
| Tests for v2.0+ features (admin) | 5 | 5% |
| Core user journey tests (search, click, submit) | 15 | 15% |
| Tests needing addition for complete coverage | 6 | - |

---

## Conclusion

The E2E test suite has a good foundation with 100 test cases covering basic page existence and structural elements. However, it needs significant work to properly verify **user interactions** as defined in the PRD journeys:

- **Sarah's journey** (search → discover → find answer) - Partially tested
- **Marcus's journey** (search → platform-specific guidance) - Not tested
- **User suggestion journey** (submit → receive notification) - Partially tested

**Priority actions:**
1. Remove tests for pages that don't exist (game detail, admin)
2. Fix route references (`/games/` → `/game/`)
3. Add meaningful assertions instead of `waitForTimeout`
4. Add tests for platform tab interaction
5. Add tests for form validation error messages
6. Add tests for empty state display

---

*Generated by BMAD Test Architecture Automation*
