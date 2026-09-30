import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { feed } from '../lib/feed';
import { getPosts } from '../lib/posts';

export const GET: APIRoute = async ({ site }) =>
	feed(site!, 'All posts', `Everything ${SITE.name} writes: tech, devlogs, essays and stories.`, await getPosts());
