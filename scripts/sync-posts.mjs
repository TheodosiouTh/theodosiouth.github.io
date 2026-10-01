// Mirrors the Obsidian vault's Blog/ folder (the source of truth) into src/content/posts/.
// Images are shrunk and stripped of metadata on the way in; originals stay in the vault.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE =
	process.env.BLOG_VAULT_DIR ??
	path.join(homedir(), 'Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault/Blog');
const TARGET = path.resolve('src/content/posts');
const dryRun = process.argv.includes('--dry-run');
// Source hashes of what was last synced, so processed images aren't redone every run.
const MANIFEST = path.join(TARGET, '.sync-manifest.json');
// 2x the 640px text column.
const MAX_IMAGE_WIDTH = 1280;
const RASTER = /\.(jpe?g|png|webp)$/i;

const fail = (msg) => {
	console.error(`✗ ${msg}`);
	process.exit(1);
};

/** Skips hidden files/folders (.obsidian, .DS_Store, …) and symlinks. */
function files(dir, rel = '') {
	return readdirSync(path.join(dir, rel)).flatMap((name) => {
		if (name.startsWith('.')) return [];
		const r = path.join(rel, name);
		const st = lstatSync(path.join(dir, r));
		if (st.isSymbolicLink()) return [];
		return st.isDirectory() ? files(dir, r) : [r];
	});
}

/** iCloud placeholders for files not downloaded to this Mac look like ".name.icloud". */
function placeholders(dir, rel = '') {
	return readdirSync(path.join(dir, rel)).flatMap((name) => {
		const r = path.join(rel, name);
		if (/^\..+\.icloud$/.test(name)) return [r];
		if (name.startsWith('.')) return [];
		const st = lstatSync(path.join(dir, r));
		return st.isDirectory() && !st.isSymbolicLink() ? placeholders(dir, r) : [];
	});
}

const hash = (file) => createHash('sha1').update(readFileSync(file)).digest('hex');

// First run: seed the vault from the repo.
if (!existsSync(SOURCE)) {
	console.log(`No vault folder at ${SOURCE}`);
	if (dryRun) process.exit(0);
	mkdirSync(path.dirname(SOURCE), { recursive: true });
	cpSync(TARGET, SOURCE, { recursive: true, filter: (f) => f !== MANIFEST });
	console.log(`✓ Created it and copied the current posts into it. Write there from now on.`);
	process.exit(0);
}
if (lstatSync(SOURCE).isSymbolicLink()) {
	fail(`${SOURCE} is a symlink. Remove it (rm without a trailing slash) and run this again.`);
}

const missing = placeholders(SOURCE);
if (missing.length) {
	fail(
		`Some files are still in iCloud and not downloaded to this Mac:\n  ${missing.join('\n  ')}\n` +
			`Open them in Finder or run: brctl download "${SOURCE}"`,
	);
}

/** @type {Record<string, string>} */
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const src = new Set(files(SOURCE));
const dst = new Set(files(TARGET));
const sourceHash = Object.fromEntries([...src].map((f) => [f, hash(path.join(SOURCE, f))]));
const added = [...src].filter((f) => !dst.has(f));
const changed = [...src].filter(
	(f) =>
		dst.has(f) &&
		sourceHash[f] !== manifest[f] &&
		// Files synced before the manifest existed: unchanged if identical, except
		// images, which still need shrinking.
		(manifest[f] !== undefined || RASTER.test(f) || sourceHash[f] !== hash(path.join(TARGET, f))),
);
const removed = [...dst].filter((f) => !src.has(f));

for (const [label, list] of [
	['+ added', added],
	['~ changed', changed],
	['- removed', removed],
]) {
	for (const f of list) console.log(`${label.padEnd(10)} ${f}`);
}
if (!added.length && !changed.length && !removed.length) {
	console.log('✓ Already in sync.');
	process.exit(0);
}
if (dryRun) process.exit(0);

// Keeps the format, so the file name the post links to still matches.
async function shrink(from, to) {
	const image = sharp(from).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
	const ext = path.extname(from).toLowerCase();
	const out =
		ext === '.png'
			? image.png({ compressionLevel: 9, effort: 10 })
			: ext === '.webp'
				? image.webp({ quality: 82 })
				: image.jpeg({ quality: 82, mozjpeg: true });
	const before = readFileSync(from).length;
	await out.toFile(to);
	const after = readFileSync(to).length;
	// Already-small files can grow when re-encoded; keep the original then.
	if (after >= before) cpSync(from, to);
	return [before, Math.min(before, after)];
}

const kb = (n) => `${Math.round(n / 1024)} KB`;
for (const f of [...added, ...changed]) {
	const from = path.join(SOURCE, f);
	const to = path.join(TARGET, f);
	mkdirSync(path.dirname(to), { recursive: true });
	if (RASTER.test(f)) {
		const [before, after] = await shrink(from, to);
		console.log(`  ${f}: ${kb(before)} → ${kb(after)}`);
	} else {
		cpSync(from, to);
	}
}
for (const f of removed) rmSync(path.join(TARGET, f));
writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(sourceHash).sort()), null, '\t') + '\n');
// Drop folders left empty by removals.
for (const dir of readdirSync(TARGET, { recursive: true, withFileTypes: true }).reverse()) {
	const full = path.join(dir.parentPath, dir.name);
	if (dir.isDirectory() && readdirSync(full).length === 0) rmSync(full, { recursive: true });
}
console.log(`✓ Synced ${added.length + changed.length} file(s), removed ${removed.length}.`);
