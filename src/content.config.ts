import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Synced, sanitized markdown. No frontmatter schema — these are plain docs.
const compare = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/compare' }),
});

const ebook = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/ebook' }),
});

// Engine blog — synced from the SQE source, with YAML frontmatter.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Jacob Verhoeks'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { compare, ebook, blog };
