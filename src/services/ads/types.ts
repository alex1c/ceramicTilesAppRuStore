import type { ModeAnalyticsValue } from '@/services/analytics'
import type {
	AdPlacementId,
	BannerPlacementId,
	RewardedPlacementId,
} from '@/config/ads-config'

/** Result of attempting to show an interstitial ad. */
export type AdShowResult =
	| { shown: true }
	| { shown: false; reason: 'not_ready' | 'skipped' | 'error' }

/** Result of a rewarded ad flow. */
export type RewardedAdResult =
	| { completed: true; rewardGranted: true }
	| { completed: true; rewardGranted: false }
	| { completed: false; reason: 'not_ready' | 'dismissed' | 'error' }

export type AdFormat = 'banner' | 'rewarded'
export type AdErrorCategory = 'load' | 'show' | 'sdk' | 'unavailable'

export type { AdPlacementId, BannerPlacementId, RewardedPlacementId }

/**
 * Advertising boundary — UI depends on this interface, not on Yandex SDK types.
 *
 * Phase 5C: banner + rewarded foundation. Interstitial / app-open stay noop.
 */
export interface AdService {
	/** Initializes the native ads SDK when available. Fail-open. */
	initialize(): Promise<void>

	/** Phase 5C: interstitial intentionally not monetized — always noop. */
	preloadInterstitial(): Promise<void>
	showInterstitial(): Promise<AdShowResult>

	/**
	 * Preloads a rewarded ad for a placement.
	 * Returns true when an ad is ready to show.
	 */
	preloadRewarded(placement: RewardedPlacementId): Promise<boolean>

	/**
	 * Shows a previously loaded (or freshly loaded) rewarded ad.
	 * Reward is granted only when the SDK fires the reward callback.
	 */
	showRewarded(placement: RewardedPlacementId): Promise<RewardedAdResult>

	/** Whether the product may render a banner for this placement. */
	shouldShowBanner(placement: BannerPlacementId): boolean

	/** Resolved ad unit id for BannerView, or null when disabled. */
	getBannerAdUnitId(placement: BannerPlacementId): string | null
}

/** Context passed from product screens into banner analytics. */
export interface ResultBannerContext {
	placement: BannerPlacementId
	mode: ModeAnalyticsValue
	/** Stable key from the presented result — remounts banner on recalculation. */
	resultKey: string
}
