/**
 * Static product configuration shared across the app shell.
 */
export const appConfig = {
	defaultLocale: 'ru' as const,
	supportedLocales: ['ru', 'en'] as const,
	androidPackage: 'com.calculatorplatform.tile',
	productId: 'tile-calculator',
} as const

export type SupportedLocale = (typeof appConfig.supportedLocales)[number]
