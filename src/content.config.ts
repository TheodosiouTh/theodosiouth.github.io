import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const slugify = (s: string) =>
	s
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const base = z.object({
	title: z.string(),
	description: z
		.string()
		.nullish()
		.transform((s) => s || undefined),
	// Stable URL slug, independent of the file name (Obsidian notes keep their titles as names).
	slug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case')
		.nullish()
		.transform((s) => s ?? undefined),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	draft: z.boolean().default(false),
	tags: z
		.array(z.string())
		.nullish()
		.transform((t) => t ?? []),
});

// `canonical` is only for posts first published elsewhere.
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
		// Files and folders starting with "_" (like _templates/) are ignored.
		pattern: ['**/*.{md,mdx}', '!**/_*', '!**/_*/**'],
		generateId: ({ entry, data }) =>
			typeof data.slug === 'string' && data.slug ? data.slug : slugify(entry.replace(/\.mdx?$/, '').split('/').pop()!),
	}),
	schema: z
		.discriminatedUnion('section', [
			tech.extend({ section: z.literal('writing') }),
			tech.extend({
				section: z.literal('devlogs'),
				series: z.string().optional(),
			}),
			base.extend({ section: z.literal('life') }).strict(),
			base.extend({ section: z.literal('stories') }).strict(),
		])
		.superRefine((post, ctx) => {
			if (post.draft) return;
			for (const key of ['slug', 'description'] as const) {
				if (!post[key]) ctx.addIssue({ code: 'custom', path: [key], message: `Set \`${key}\` before publishing (draft: false)` });
			}
		}),
});

export const collections = { posts };
