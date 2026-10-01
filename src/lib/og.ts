import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const require = createRequire(import.meta.url);
const fontFile = (weight: number) =>
	require.resolve(`@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}-normal.woff`);

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | undefined;
const loadFonts = () =>
	(fonts ??= Promise.all(
		([400, 700] as const).map(async (weight) => ({
			name: 'IBM Plex Sans',
			data: await readFile(fontFile(weight)),
			weight,
			style: 'normal' as const,
		})),
	));

const color = { bg: '#121211', fg: '#e8e8e4', muted: '#9a9a94', border: '#2c2c29', accent: '#8ab8ff' };

const THETA = `data:image/svg+xml;utf8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="14" fill="${color.bg}" stroke="${color.border}" stroke-width="2"/><ellipse cx="32" cy="32" rx="14.5" ry="19" fill="none" stroke="${color.fg}" stroke-width="6.5"/><rect x="19" y="28.75" width="26" height="6.5" rx="1.5" fill="${color.accent}"/></svg>`,
)}`;

type Node = { type: string; props: Record<string, unknown> & { children?: Node | Node[] | string } };
const h = (type: string, style: Record<string, unknown>, children?: Node['props']['children'], extra = {}): Node => ({
	type,
	props: { style, children, ...extra },
});

export type OgImage = {
	title: string;
	label: string;
};

export async function renderOgImage({ title, label }: OgImage): Promise<Buffer> {
	const titleSize = title.length > 70 ? 56 : title.length > 40 ? 66 : 78;
	const svg = await satori(
		h(
			'div',
			{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: '72px 80px',
				background: color.bg,
				color: color.fg,
				fontFamily: 'IBM Plex Sans',
			},
			[
				h('div', { display: 'flex', alignItems: 'center', gap: 24 }, [
					h('img', { width: 72, height: 72 }, undefined, { src: THETA, width: 72, height: 72 }),
					h('div', { display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }, 'Thanos Theodosiou'),
				]),
				h(
					'div',
					{ display: 'flex', fontSize: titleSize, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em' },
					title,
				),
				h('div', { display: 'flex', fontSize: 28, color: color.muted }, label),
			],
		) as never,
		{ width: OG_WIDTH, height: OG_HEIGHT, fonts: await loadFonts() },
	);
	return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
