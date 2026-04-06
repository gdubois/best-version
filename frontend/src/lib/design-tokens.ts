/**
 * Design Tokens - Story 7.1: Design System Configuration
 *
 * Centralized design tokens for consistent theming across the platform.
 * These tokens are used by Tailwind configuration and runtime CSS.
 */

export const colors = {
  // Background colors
  background: {
    primary: '#0a0a0a',
    secondary: '#111111',
  },
  // Surface colors (cards, panels, containers)
  surface: {
    primary: '#1a1a1a',
    secondary: '#222222',
    elevated: '#2a2a2a',
  },
  // Accent colors (brand colors)
  accent: {
    green: '#00ff88',       // Success, positive actions
    purple: '#9d4edd',      // Primary brand color
    amber: '#ffaa00',       // Warnings, Portable platform
    blue: '#3a86ff',        // Links, info
    teal: '#00f5d4',        // TV platform
    red: '#ff006e',         // Errors, destructive actions
  },
  // Semantic colors
  semantic: {
    success: '#00ff88',
    warning: '#ffaa00',
    info: '#3a86ff',
    error: '#ff006e',
  },
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#e0e0e0',
    tertiary: '#a0a0a0',
    muted: '#666666',
  },
  // Border colors
  border: {
    default: '#333333',
    light: '#444444',
    dark: '#111111',
  },
  // Utility colors
  overlay: {
    rgba: (alpha: number) => `rgba(10, 10, 10, ${alpha})`,
    glass: 'rgba(26, 26, 26, 0.8)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    mono: 'Fira Code, "JetBrains Mono", "Courier New", monospace',
  },
  fontSize: {
    h1: { size: '3rem', lineHeight: '1.2', fontWeight: 700 },
    h2: { size: '2rem', lineHeight: '1.3', fontWeight: 700 },
    h3: { size: '1.5rem', lineHeight: '1.4', fontWeight: 600 },
    h4: { size: '1.25rem', lineHeight: '1.4', fontWeight: 600 },
    body: { size: '1rem', lineHeight: '1.6', fontWeight: 400 },
    small: { size: '0.875rem', lineHeight: '1.5', fontWeight: 400 },
    xs: { size: '0.75rem', lineHeight: '1.4', fontWeight: 400 },
  },
} as const;

export const spacing = {
  // 8px base grid system
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const;

export const boxShadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 25px rgba(0, 0, 0, 0.4)',
  card: '0 4px 6px rgba(0, 0, 0, 0.3)',
  cardHover: '0 8px 25px rgba(0, 255, 136, 0.15)',
  glow: '0 0 20px rgba(0, 255, 136, 0.3)',
} as const;

export const transition = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

export const zIndices = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  toast: 1500,
} as const;

// Component-specific tokens
export const components = {
  buttons: {
    minHeight: '2.75rem',  // 44px touch target
    padding: '0.75rem 1.5rem',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.body.size,
    fontWeight: 600,
  },
  inputs: {
    minHeight: '2.75rem',  // 44px touch target
    padding: '0.5rem 1rem',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.body.size,
    borderWidth: '1px',
  },
  cards: {
    borderRadius: borderRadius.lg,
    padding: '1rem',
    boxShadow: boxShadow.card,
  },
  badges: {
    padding: '0.25rem 0.75rem',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.small.size,
    fontWeight: 500,
  },
} as const;

export default { colors, typography, spacing, borderRadius, boxShadow, transition, breakpoints, zIndices, components };
