import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const base = z.object({
	title: z.string(),
	description: z.string(),
	// Stable URL slug, independent of the file name (Obsidian notes keep their titles as names).
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	draft: z.boolean().default(false),
	tags: z.array(z.string()).default([]),
});

// Tech posts are cross-posted (POSSE): published here first, then syndicated with
// the canonical URL pointing back here. `canonical` only overrides that for posts
// that were originally published elsewhere.
const tech = base.extend({
	canonical: z.url().optional(),
	crosspost: z
		.object({
			devto: z.url().optional(),
		})
		.optional(),
});

const posts = defineCollection({
	loader: glob({
		base: './src/content/posts',
		// Files starting with "_" (like _template.md) are ignored.
		pattern: '**/[^_]*.{md,mdx}',
		generateId: ({ entry, data }) => (typeof data.slug === 'string' ? data.slug : entry),
	}),
	schema: z.discriminatedUnion('section', [
		tech.extend({ section: z.literal('writing') }),
		tech.extend({
			section: z.literal('devlogs'),
			// Groups devlog entries into a series, e.g. "kotsu.nvim".
			series: z.string().optional(),
		}),
		base.extend({ section: z.literal('life') }).strict(),
		base.extend({ section: z.literal('stories') }).strict(),
	]),
});

export const collections = { posts };
