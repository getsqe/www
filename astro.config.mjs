// @ts-check
import { defineConfig } from 'astro/config';

// Static marketing site for getsqe.com. No SSR, no adapter — pure static output.
export default defineConfig({
  site: 'https://getsqe.com',
  markdown: {
    // Shiki ships with Astro; dark theme matches the code-block aesthetic.
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
  },
});
