// @ts-check
// Converts Obsidian-only syntax to plain Markdown at build time:
//   ![[diagram.png]]          → image (found anywhere under the posts folder)
//   ![[diagram.png|Alt text]] → image with alt text (a number like |400 is ignored)
//   [[Other note]]            → link to that post (plain text if it isn't published)
//   [[Other note|label]]      → same, with custom text
//   %%comment%%               → removed
//   ==highlight==             → <mark>highlight</mark>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve('src/content/posts');
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const TOKEN = /(!?)\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]*))?\]\]|==([^=\n]+)==/g;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
	return readdirSync(dir).flatMap((name) => {
		if (name.startsWith('.')) return [];
		const full = path.join(dir, name);
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

/** @param {string} s */
const slugify = (s) =>
	s
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

/** Note name (file name without extension) → URL of the published post. */
function postIndex() {
	/** @type {Map<string, string>} */
	const urls = new Map();
	for (const file of walk(POSTS_DIR)) {
		if (!/\.mdx?$/.test(file) || path.basename(file).startsWith('_')) continue;
		const fm = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
		const field = (/** @type {string} */ key) =>
			fm.match(new RegExp(`^${key}:\\s*['"]?([^'"#\\n]*?)['"]?\\s*(#.*)?$`, 'm'))?.[1].trim();
		if (field('draft') === 'true' && process.env.NODE_ENV === 'production') continue;
		const name = path.basename(file).replace(/\.mdx?$/, '');
		const section = field('section');
		if (!section) continue;
		urls.set(name.toLowerCase(), `/${section}/${field('slug') || slugify(name)}/`);
	}
	return urls;
}

/** @param {string} name @param {string} fromDir */
function findImage(name, fromDir) {
	const base = path.basename(name);
	const hit = walk(POSTS_DIR).find((f) => path.basename(f) === base);
	if (!hit) return undefined;
	const rel = path.relative(fromDir, hit).split(path.sep).join('/');
	return encodeURI(rel.startsWith('.') ? rel : `./${rel}`);
}

/** @param {any} node */
const text = (node) => ({ type: 'text', value: node });

export default function remarkObsidian() {
	/** @param {any} tree @param {any} file */
	return (tree, file) => {
		const fromDir = path.dirname(file.path ?? path.join(POSTS_DIR, 'x.md'));
		/** @type {Map<string, string> | undefined} */
		let urls;

		/** @param {any} parent */
		const visit = (parent) => {
			if (!Array.isArray(parent.children)) return;
			parent.children = parent.children.flatMap((/** @type {any} */ node) => {
				if (node.type === 'code' || node.type === 'inlineCode') return [node];
				if (node.type !== 'text') {
					visit(node);
					return [node];
				}
				const value = node.value.replace(/%%[\s\S]*?%%/g, '');
				/** @type {any[]} */
				const out = [];
				let last = 0;
				for (const m of value.matchAll(TOKEN)) {
					const [whole, bang, target, , alias, highlight] = m;
					if (m.index > last) out.push(text(value.slice(last, m.index)));
					last = m.index + whole.length;
					if (highlight !== undefined) {
						out.push({ type: 'html', value: '<mark>' }, text(highlight), { type: 'html', value: '</mark>' });
					} else if (bang && IMAGE_EXT.test(target.trim())) {
						const url = findImage(target.trim(), fromDir);
						if (url) {
							const alt = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : '';
							out.push({ type: 'image', url, alt });
						} else {
							file.message(`Image not found under src/content/posts: ${target}`);
							out.push(text(whole));
						}
					} else {
						urls ??= postIndex();
						const label = alias || target.trim();
						const url = urls.get(target.trim().toLowerCase());
						out.push(url ? { type: 'link', url, children: [text(label)] } : text(label));
					}
				}
				if (last < value.length) out.push(text(value.slice(last)));
				return out;
			});
		};
		visit(tree);
	};
}
