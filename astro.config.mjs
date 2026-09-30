// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/consts.ts';

export default defineConfig({
	site: SITE_URL,
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
		},
	},
});
