import type { APIRoute, GetStaticPaths } from 'astro';
import { SECTIONS, type Section } from '../../consts';
import { feed } from '../../lib/feed';
import { getActiveSections, getPosts } from '../../lib/posts';

export const getStaticPaths = (async () =>
	(await getActiveSections()).map((section) => ({ params: { section } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ site, params }) => {
	const section = params.section as Section;
	const { label, description } = SECTIONS[section];
	return feed(site!, label, description, await getPosts(section));
};
