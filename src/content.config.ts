import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Synced, sanitized markdown. No frontmatter schema — these are plain docs.
const compare = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/compare' }),
});

const ebook = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/ebook' }),
});

export const collections = { compare, ebook };
