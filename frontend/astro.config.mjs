import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  site: 'http://localhost:3000',
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url),
        '@components': new URL('./src/components/', import.meta.url),
      },
    },
    ssr: {
      noExternal: ['@astrojs/tailwind'],
    },
  },
});
