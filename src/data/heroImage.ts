const base = `${import.meta.env.BASE_URL}img/optimized/`;

export const heroImage = {
  src: `${base}hero-768.webp`,
  srcset: [480, 768, 1120, 1536].map(width => `${base}hero-${width}.webp ${width}w`).join(', '),
  sizes: '(max-width: 900px) calc(100vw - 48px), (max-width: 1200px) calc((100vw - 96px) * 0.475), 525px',
};
