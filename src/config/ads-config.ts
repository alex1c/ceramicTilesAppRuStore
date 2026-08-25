import { env } from '@/config/env'

/**
 * Official Yandex demo ad unit IDs — guaranteed test creatives, no paid traffic.
 * @see https://ads.yandex.com/helpcenter/en/dev/android/demo-blocks
 */
export const YANDEX_DEMO_BANNER_UNIT_ID = 'demo-banner-yandex'
export const YANDEX_DEMO_REWARDED_UNIT_ID = 'demo-rewarded-yandex'

/** Product placement ids — never confuse with Yandex adUnitId strings. */
export type BannerPlacementId = 'result_banner' | 'footer_banner'
export type RewardedPlacementId = 'dev_rewarded_test' | 'future_pdf_reward'

export type AdPlacementId = BannerPlacementId | RewardedPlacementId

/**
 * Tile v1 product policy: at most ONE advertisement visible on screen.
 * Only this placement may render; footer_banner stays configured but disabled.
 */
export const TILE_V1_ACTIVE_BANNER_PLACEMENT: BannerPlacementId = 'result_banner'

/** Product banner placements that share one Yandex banner ad unit. */
export const PRODUCT_BANNER_PLACEMENTS: readonly BannerPlacementId[] = [
	'result_banner',
	'footer_banner',
] as const

export function isProductBannerPlacement(
	placement: string,
): placement is BannerPlacementId {
	return (PRODUCT_BANNER_PLACEMENTS as readonly string[]).includes(placement)
}

/** Tile v1 — only the single active placement may show. */
export function isBannerPlacementEnabled(placement: BannerPlacementId): boolean {
	return placement === TILE_V1_ACTIVE_BANNER_PLACEMENT
}

/**
 * Max height (dp) for the inline banner.
 * Keeps the adaptive banner compact inside scroll content.
 */
export const RESULT_BANNER_MAX_HEIGHT_DP = 90

function isJestRuntime(): boolean {
	return typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined
}

function trimUnitId(value: string): string {
	return value.trim()
}

const YANDEX_PRODUCTION_UNIT_ID_PATTERN = /^R-M-\d+-\d+$/

/** Accept only partner-console unit IDs in production; demo/malformed values disable ads. */
export function resolveConfiguredProductionUnitId(value: string): string | null {
	const configured = trimUnitId(value)
	return YANDEX_PRODUCTION_UNIT_ID_PATTERN.test(configured) ? configured : null
}

/**
 * Resolves the banner ad unit for the current runtime.
 *
 * Strategy:
 * - `__DEV__` / Jest → always official demo ID (never production impressions).
 * - Production → env production ID only; empty → ads disabled (fail open).
 */
export function resolveBannerAdUnitId(): string | null {
	if (__DEV__ || isJestRuntime()) {
		return YANDEX_DEMO_BANNER_UNIT_ID
	}

	return resolveConfiguredProductionUnitId(env.yandexAdsBannerUnitId)
}

/**
 * Resolves the rewarded ad unit for the current runtime.
 * Tile v1 never shows rewarded — ID is reserved for future configuration only.
 */
export function resolveRewardedAdUnitId(): string | null {
	if (__DEV__ || isJestRuntime()) {
		return YANDEX_DEMO_REWARDED_UNIT_ID
	}

	return resolveConfiguredProductionUnitId(env.yandexAdsRewardedUnitId)
}

/** True when a banner placement may attempt to load (unit id present + v1 policy). */
export function isBannerConfigured(): boolean {
	return resolveBannerAdUnitId() !== null
}

/**
 * Rewarded remains configured for future use but is disabled in Tile v1 product UI.
 * Keep false so no rewarded preload/show path is product-active.
 */
export function isRewardedEnabledInProduct(): boolean {
	return false
}

/** True when rewarded unit id resolves — does NOT enable product UI. */
export function isRewardedConfigured(): boolean {
	return resolveRewardedAdUnitId() !== null
}
