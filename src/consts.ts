export const SITE_URL = 'https://theodosiouth.github.io';

export const SITE = {
	name: 'Thanos Theodosiou',
	title: 'Principal Product Engineer',
	description:
		'Thanos Theodosiou, Principal Product Engineer in Tokyo. Product-minded full-stack engineer working in TypeScript, Go and Python.',
	locale: 'en_US',
};

export const LINKS = {
	email: 'thanosthd@gmail.com',
	github: 'https://github.com/TheodosiouTh',
	linkedin: 'https://www.linkedin.com/in/thanos-theodosiou/',
};

// Blog sections. Order here drives nav and listing order.
export const SECTIONS = {
	writing: {
		label: 'Writing',
		description: 'Notes on building software products: architecture, migrations and shipping.',
		tech: true,
	},
	devlogs: {
		label: 'Devlogs',
		description: 'Building side projects in public, one step at a time.',
		tech: true,
	},
	life: {
		label: 'Life',
		description: 'Personal essays on living in Japan, careers and everything else.',
		tech: false,
	},
	stories: {
		label: 'Stories',
		description: 'Short fiction.',
		tech: false,
	},
} as const;

export type Section = keyof typeof SECTIONS;
export const SECTION_KEYS = Object.keys(SECTIONS) as Section[];
export const TECH_SECTIONS = SECTION_KEYS.filter((s) => SECTIONS[s].tech);
