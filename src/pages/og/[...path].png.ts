import type { APIRoute, GetStaticPaths } from 'astro';
import { SECTIONS, SITE } from '../../consts';
import { renderOgImage, type OgImage } from '../../lib/og';
import { formatDate, getPosts } from '../../lib/posts';

// /og/index.png for the home page, /og/<section>/<slug>.png for each post.
export const getStaticPaths = (async () => {
	const posts = await getPosts();
	const pages: { params: { path: string }; props: OgImage }[] = [
		{ params: { path: 'index' }, props: { title: `${SITE.title} in Tokyo`, label: 'theodosiouth.github.io' } },
		...posts.map((p) => ({
			params: { path: `${p.data.section}/${p.id}` },
			props: { title: p.data.title, label: `${SECTIONS[p.data.section].label} · ${formatDate(p.data.pubDate)}` },
		})),
	];
	return pages;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
	new Response(new Uint8Array(await renderOgImage(props as OgImage)), { headers: { 'Content-Type': 'image/png' } });
