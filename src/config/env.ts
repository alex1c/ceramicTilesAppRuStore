/**
 * Typed access to public environment variables.
 *
 * AppMetrica API key and Yandex ad unit IDs are client-embedded identifiers
 * (not private server secrets). Still keep production values out of git via
 * local `.env` / CI injection — never commit real keys or production unit IDs.
 */
export const env = {
	/**
	 * When true, DevAnalyticsService logs events to the console.
	 * Defaults to true in `__DEV__`.
	 */
	analyticsDevMode:
		process.env.EXPO_PUBLIC_ANALYTICS_DEV_MODE === 'true' || __DEV__,

	/**
	 * AppMetrica application API key from the AppMetrica console.
	 * Empty / placeholder → DevAnalyticsService (no native activate).
	 */
	appMetricaApiKey: process.env.EXPO_PUBLIC_APPMETRICA_API_KEY ?? '',

	/**
	 * Production Yandex banner ad unit (R-M-…).
	 * Ignored in `__DEV__` — demo-banner-yandex is used instead.
	 */
	yandexAdsBannerUnitId:
		process.env.EXPO_PUBLIC_YANDEX_ADS_BANNER_UNIT_ID ??
		process.env.EXPO_PUBLIC_YANDEX_BANNER_BLOCK_ID ??
		'',

	/**
	 * Production Yandex rewarded ad unit (R-M-…).
	 * Reserved for future use — Tile v1 never shows rewarded ads.
	 * Ignored in `__DEV__` — demo-rewarded-yandex is used instead when resolved.
	 */
	yandexAdsRewardedUnitId:
		process.env.EXPO_PUBLIC_YANDEX_ADS_REWARDED_UNIT_ID ??
		process.env.EXPO_PUBLIC_YANDEX_REWARDED_BLOCK_ID ??
		'',
} as const
