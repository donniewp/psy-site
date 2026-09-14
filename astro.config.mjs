import { defineConfig } from 'astro/config';
import { bookingPreview } from './scripts/booking-preview.mjs';

// Served from senzitivnost.ru at the domain root (via a custom domain on
// GitHub Pages, see public/CNAME) — same base/site regardless of CI vs local.
export default defineConfig({
  site: 'https://senzitivnost.ru',
  base: '/',
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { plugins: [bookingPreview()] },
});
