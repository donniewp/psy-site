import { defineConfig } from 'astro/config';

// GITHUB_PAGES is set only by the Pages deploy workflow — local/production builds
// keep using the real domain and root base path untouched.
const isGhPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGhPages ? 'https://donniewp.github.io' : 'https://senzitivnost.ru',
  base: isGhPages ? '/psy-site/' : '/',
  compressHTML: true,
});
