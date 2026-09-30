import rss from '@astrojs/rss';
import { SITE } from '../consts';
import { postPath, type Post } from './posts';

export function feed(site: URL, title: string, description: string, posts: Post[]) {
	return rss({
		title: `${SITE.name} · ${title}`,
		description,
		site,
		trailingSlash: true,
		items: posts.map((p) => ({
			title: p.data.title,
			description: p.data.description,
			pubDate: p.data.pubDate,
			link: postPath(p),
			categories: [p.data.section, ...p.data.tags],
		})),
	});
}
