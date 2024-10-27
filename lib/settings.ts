export const DEFAULT_SETTINGS = {
	enableLayout: true,
	dimDarkModeImages: true,
} as const;

export type Settings = typeof DEFAULT_SETTINGS;