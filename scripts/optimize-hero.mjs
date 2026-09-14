// Regenerate committed responsive assets from the original studio photograph.
// Run with the project's installed Astro/sharp dependencies: node scripts/optimize-hero.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/img/optimized', { recursive: true });
for (const width of [480, 768, 1120, 1536]) {
  await sharp('public/img/hero.jpg')
    .resize({ width })
    .webp({ quality: 82, effort: 6 })
    .toFile(`public/img/optimized/hero-${width}.webp`);
}
