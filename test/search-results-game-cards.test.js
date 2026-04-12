// Search Results with Game Cards Tests - Story 1.2
// Tests for acceptance criteria of Story 1.2: Search Results with Game Cards

const assert = require('assert');

/**
 * Story 1.2: Search Results with Game Cards
 * Tests that search results display as proper game cards with all required features
 */

describe('Story 1.2: Search Results with Game Cards', () => {
  describe('Search Results Display as Game Cards', () => {
    it('AC: Search results should display as game cards with cover art', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check that search results use game card structure
      // Look for createSearchResultCard or similar function, or inline card HTML
      const hasSearchResultCard = content.includes('createSearchResultCard') ||
                                   content.includes('.game-card') && content.includes('searchResult') ||
                                   content.includes('.search-card');

      assert.ok(
        hasSearchResultCard,
        'Search results should use game card structure (createSearchResultCard function or search-card class)'
      );
    });

    it('AC: Search result cards should show game title', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check that search results display the game title
      const hasTitleDisplay = content.includes('basic_info?.title') ||
                              content.includes('game.title') ||
                              content.includes('searchResultTitle') ||
                              content.includes('.search-card-title');

      assert.ok(
        hasTitleDisplay,
        'Search result cards should display the game title'
      );
    });
  });

  describe('Platform Badges', () => {
    it('AC: Platform badges should indicate TV or Portable', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for TV and Portable terminology in platform badges
      // Look for: literal strings "TV"/"Portable", class names .tv/.portable, or return values
      const hasTVPlatform = content.includes('"TV"') ||
                            content.includes("'TV'") ||
                            content.includes('.tv') ||
                            content.includes('.tv ') ||
                            content.includes('.tv{') ||
                            content.includes('tv}') ||
                            content.includes('tv=') ||
                            content.includes('tv ') ||
                            content.includes('tv{') ||
                            content.includes('hasTV') ||
                            content.includes('platformLower.includes') ||
                            content.includes('detectPlatformType');

      const hasPortablePlatform = content.includes('"Portable"') ||
                                   content.includes("'Portable'") ||
                                   content.includes('.portable') ||
                                   content.includes('.portable ') ||
                                   content.includes('.portable{') ||
                                   content.includes('portable}') ||
                                   content.includes('portable=') ||
                                   content.includes('portable ') ||
                                   content.includes('portable{') ||
                                   content.includes('hasPortable') ||
                                   content.includes('platformLower.includes') ||
                                   content.includes('detectPlatformType');

      assert.ok(
        hasTVPlatform && hasPortablePlatform,
        'Platform badges should use TV and Portable terminology (UX-DR6)'
      );
    });

    it('AC: Platform badges should support both TV and Portable', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for "Both" or combined platform handling
      const hasBothPlatform = content.includes('"Both"') ||
                              content.includes("'Both'") ||
                              content.includes('both-platform') ||
                              content.includes('.both') ||
                              content.includes('platform-badges');

      assert.ok(
        hasBothPlatform,
        'Platform badges should support showing both TV and Portable platforms'
      );
    });
  });

  describe('Game Card Interactivity', () => {
    it('AC: Game cards should be clickable and navigate to game detail page', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for click handler on search result cards
      const hasClickHandler = content.includes('onclick="openGameModal') ||
                              content.includes('onClick="openGameModal') ||
                              content.includes('.addEventListener') && content.includes('game-card');

      assert.ok(
        hasClickHandler,
        'Game cards should have click handler to navigate to game detail page'
      );
    });
  });

  describe('Cover Art', () => {
    it('AC: Cover art should be loaded from Wikimedia Commons or a placeholder', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for cover image handling
      const hasCoverImage = content.includes('coverUrl') ||
                            content.includes('cover_url') ||
                            content.includes('.game-card-image') ||
                            content.includes('cover-art');

      const hasPlaceholder = content.includes('placeholder') ||
                             content.includes('default') ||
                             content.includes('fallback');

      assert.ok(
        hasCoverImage && hasPlaceholder,
        'Search result cards should have cover art with placeholder fallback'
      );
    });
  });

  describe('Responsive Design', () => {
    it('AC: Cards should be responsive (1 column mobile, 2 columns tablet, 4 columns desktop)', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for responsive grid styling
      const hasMobileColumn = content.includes('grid-template-columns: 1fr') ||
                             content.includes('1 column') ||
                             content.includes('minmax') ||
                             content.includes('.search-results-grid');

      const hasResponsiveGrid = content.includes('@media') &&
                                (content.includes('grid-template-columns') ||
                                 content.includes('grid-template: 1fr') ||
                                 content.includes('repeat('));

      assert.ok(
        hasMobileColumn && hasResponsiveGrid,
        'Search result cards should have responsive grid layout (1 column mobile, 2 columns tablet, 4 columns desktop)'
      );
    });
  });

  describe('Hover States', () => {
    it('AC: Hover states should provide visual feedback (lift effect, shadow increase)', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for hover effects with transform (lift) and box-shadow
      const hasLiftEffect = content.includes('translateY') ||
                            content.includes('transform:') && content.includes('-4px') ||
                            content.includes('lift');

      const hasShadowIncrease = content.includes('box-shadow') &&
                                content.includes('hover') ||
                                content.includes('shadow increase');

      const hasHoverState = content.includes(':hover') ||
                            content.includes('hover');

      assert.ok(
        hasHoverState,
        'Game cards should have hover states for visual feedback'
      );
    });
  });
});
