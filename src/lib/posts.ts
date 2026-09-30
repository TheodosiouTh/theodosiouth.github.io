import { type CollectionEntry, getCollection } from 'astro:content';
import { SECTION_KEYS, type Section } from '../consts';

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
	d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Sections that have at least one visible post, in SECTIONS order. Empty sections get no pages or feeds. */
export async function getActiveSections(): Promise<Section[]> {
	const posts = await getPosts();
	return SECTION_KEYS.filter((s) => posts.some((p) => p.data.section === s));
}
