# Best Version - Astro Frontend

This is the Astro frontend for Best Version, built with TypeScript and Tailwind CSS.

## Project Structure

- `src/` - Source files for the Astro application
  - `pages/` - Astro page components (routes)
  - `layouts/` - Reusable layout components
  - `components/` - Reusable UI components
  - `global.css` - Global styles with Tailwind

- `public/` - Static assets

- Configuration:
  - `astro.config.mjs` - Astro configuration
  - `tailwind.config.mjs` - Tailwind CSS configuration
  - `tsconfig.json` - TypeScript configuration

## Commands

All commands are run from the frontend directory:

```sh
npm install              # Install dependencies
npm run dev              # Start dev server at localhost:4321
npm run build            # Build to ./dist/
npm run preview          # Preview build locally
npm run check            # TypeScript type checking
```

## Design System

The frontend uses Tailwind CSS with custom theme configuration:

- **Colors**:
  - Background: `#0a0a0a`
  - Surface: `#1a1a1a`
  - Accent Green: `#00ff88`
  - Accent Purple: `#9d4edd`
  - Accent Amber: `#ffaa00`

- **Typography**:
  - H1: 3rem (heading level 1)
  - H2: 2rem (heading level 2)
  - H3: 1.5rem (heading level 3)
  - Body: 1rem (standard text)
  - Small: 0.875rem (secondary text)

## Development Notes

- This frontend connects to the Express.js backend API at the configured endpoint
- All components use Astro's island architecture for optimal performance
- TypeScript strict mode is enabled for type safety
- Dark theme is the default design
