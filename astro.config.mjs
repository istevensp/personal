import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stevensantillan.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    react(),
    sitemap(),
  ],
  vite: {
    resolve: {
      // react-dom/server's default "browser" build depends on MessageChannel,
      // which the Cloudflare Workers runtime doesn't provide. The "edge"
      // build avoids it and is required for @astrojs/react to run there.
      alias: import.meta.env.PROD
        ? {
            'react-dom/server': 'react-dom/server.edge',
          }
        : undefined,
    },
  },
});
