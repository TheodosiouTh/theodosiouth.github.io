import { type CollectionEntry, getCollection } from 'astro:content';
import type { Section } from '../consts';

export type Post = CollectionEntry<'posts'>;

/** Published posts (drafts are visible in dev only), newest first. */
export async function getPosts(section?: Section): Promise<Post[]> {
	const posts = await getCollection(
		'posts',
		(p) => (!section || p.data.section === section) && (import.meta.env.DEV || !p.data.draft),
	);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postPath = (p: Post) => `/${p.data.section}/${p.id}/`;

export const formatDate = (d: Date) =>
	d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
