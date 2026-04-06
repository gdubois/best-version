/**
 * Tailwind Configuration - Story 7.1: Design System Configuration
 *
 * Aligns Tailwind with design tokens for consistent theming.
 * All colors, spacing, and typography match the design-system.css.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      /* Color palette - matches design-system.css */
      colors: {
        /* Background */
        background: '#0a0a0a',
        backgroundSecondary: '#111111',

        /* Surface */
        surface: '#1a1a1a',
        surfaceSecondary: '#222222',
        surfaceElevated: '#2a2a2a',

        /* Accent colors */
        accentGreen: '#00ff88',
        accentGreenHover: '#00cc6a',
        accentPurple: '#9d4edd',
        accentPurpleHover: '#8b3fd4',
        accentAmber: '#ffaa00',
        accentAmberHover: '#cc8800',
        accentBlue: '#3a86ff',
        accentBlueHover: '#2568cc',
        accentTeal: '#00f5d4',
        accentTealHover: '#00c4a8',
        accentRed: '#ff006e',
        accentRedHover: '#cc005a',

        /* Semantic */
        success: '#00ff88',
        warning: '#ffaa00',
        info: '#3a86ff',
        error: '#ff006e',

        /* Text */
        textPrimary: '#ffffff',
        textSecondary: '#e0e0e0',
        textTertiary: '#a0a0a0',
        textMuted: '#666666',

        /* Border */
        borderDefault: '#333333',
        borderLight: '#444444',
        borderDark: '#111111',
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'Fira Code',
          'JetBrains Mono',
          'SF Mono',
          'Segoe UI Mono',
          'Roboto Mono',
          'Courier New',
          'monospace',
        ],
      },

      fontSize: {
        h1: ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['2rem', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        small: ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        xs: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },

      spacing: {
        /* 8px base grid - standard Tailwind */
        1: '0.25rem',
        1.5: '0.375rem',
        2.5: '0.625rem',
        3.5: '0.875rem',
        /* Extended for design system */
        10: '2.5rem',
        14: '3.5rem',
        18: '4.5rem',
        20: '5rem',
        24: '6rem',
      },

      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.3)',
        cardHover: '0 8px 25px rgba(0, 255, 136, 0.15)',
        glowGreen: '0 0 20px rgba(0, 255, 136, 0.3)',
        glowPurple: '0 0 20px rgba(157, 78, 221, 0.3)',
        xl: '0 12px 40px rgba(0, 0, 0, 0.5)',
      },

      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },

      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },

      minHeight: {
        button: '2.75rem',
        input: '2.75rem',
      },
    },
  },
  plugins: [],
};
