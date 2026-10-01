// @ts-check
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { SITE_URL } from './src/consts.ts';
import remarkObsidian from './src/lib/remark-obsidian.mjs';

export default defineConfig({
	site: SITE_URL,
	trailingSlash: 'always',
	integrations: [mdx(), sitemap()],
	image: {
		// Post images get a srcset; sync-posts caps them at 1280px (2x the text column).
		layout: 'constrained',
		breakpoints: [640, 960, 1280],
	},
	markdown: {
		processor: unified({ remarkPlugins: [remarkObsidian] }),
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
		},
	},
});
