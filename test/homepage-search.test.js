// Homepage Search Tests - Story 1.1
// Tests for acceptance criteria of Story 1.1: Homepage with Search Bar

const assert = require('assert');

/**
 * Story 1.1: Homepage with Search Bar
 * Tests the search bar functionality and accessibility
 */

describe('Story 1.1: Homepage with Search Bar', () => {
  describe('Search Bar Placeholder Text', () => {
    it('AC: Search bar should have placeholder text "Search for a game (e.g., \'Final Fantasy VII\')"', () => {
      // Read the index.astro file and check for correct placeholder
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for the expected placeholder text
      const expectedPlaceholder = "Search for a game (e.g., 'Final Fantasy VII')";

      assert.ok(
        content.includes(`placeholder="${expectedPlaceholder}"`) ||
        content.includes(`placeholder='${expectedPlaceholder}'`),
        `Search bar should have placeholder text: "${expectedPlaceholder}"`
      );
    });
  });

  describe('Search Bar Accessibility', () => {
    it('AC: Search bar should have a clear label for screen readers', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for aria-label or associated label element for the search input
      const hasAriaLabel = content.includes('aria-label') && content.includes('Search');
      const hasAssociatedLabel = content.includes('<label') && content.includes('for="gameSearch"');

      assert.ok(
        hasAriaLabel || hasAssociatedLabel,
        'Search bar should have an aria-label or associated label for screen readers'
      );
    });

    it('AC: Search bar should be keyboard focusable', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check that search input exists and is focusable (has id or tabindex)
      const hasId = content.includes('id="gameSearch"') || content.includes('id=\'gameSearch\'');
      const isInput = content.includes('<input') && content.includes('type="text"');

      assert.ok(
        hasId && isInput,
        'Search bar should be a focusable input element with an id'
      );
    });
  });

  describe('Search Bar Responsiveness', () => {
    it('AC: Search bar should be responsive and work on mobile devices', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for responsive styles (media queries for mobile)
      const hasMobileMediaQuery = content.includes('@media') &&
        (content.includes('max-width') || content.includes('768px') || content.includes('mobile'));

      assert.ok(
        hasMobileMediaQuery,
        'Search bar should have responsive styles for mobile devices'
      );
    });
  });

  describe('Search Bar Design', () => {
    it('AC: Design should match dark theme with retro accents', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for dark theme colors
      const hasDarkColors = content.includes('#0a0a0a') ||
                           content.includes('#111111') ||
                           content.includes('var(--dark)') ||
                           content.includes('background:');

      // Check for retro accent colors
      const hasAccentColors = content.includes('#00ff88') || // neon green
                              content.includes('#9d4edd') || // electric purple
                              content.includes('accent') ||
                              content.includes('gradient');

      assert.ok(
        hasDarkColors && hasAccentColors,
        'Design should include dark theme colors and retro accent colors'
      );
    });
  });

  describe('Search Bar Prominence', () => {
    it('AC: Search bar should be prominent and centered', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'index.astro');
      const content = fs.readFileSync(indexPath, 'utf8');

      // Check for centering styles
      const hasCentering = content.includes('justify-content: center') ||
                          content.includes('text-align: center') ||
                          content.includes('align-items: center') ||
                          content.includes('margin: 0 auto');

      // Check for prominent sizing or styling
      const hasProminentStyling = content.includes('padding:') ||
                                  content.includes('width:') ||
                                  content.includes('font-size:') ||
                                  content.includes('border');

      assert.ok(
        hasCentering && hasProminentStyling,
        'Search bar should be centered and have prominent styling'
      );
    });
  });
});
