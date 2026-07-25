import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://stevensantillan.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    react(),
  ],
});
