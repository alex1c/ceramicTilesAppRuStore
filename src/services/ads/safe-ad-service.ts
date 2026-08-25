import type {
	AdService,
	AdShowResult,
	BannerPlacementId,
	RewardedAdResult,
	RewardedPlacementId,
} from './types'

/**
 * Wraps any ad provider so SDK failures never break calculation or navigation.
 */
export class SafeAdService implements AdService {
	constructor(private readonly inner: AdService) {}

	async initialize(): Promise<void> {
		try {
			await this.inner.initialize()
		} catch {
			// Ads must never block app startup.
		}
	}

	async preloadInterstitial(): Promise<void> {
		try {
			await this.inner.preloadInterstitial()
		} catch {
			// Swallow — interstitial is unused in Phase 5C.
		}
	}

	async showInterstitial(): Promise<AdShowResult> {
		try {
			return await this.inner.showInterstitial()
		} catch {
			return { shown: false, reason: 'error' }
		}
	}

	async preloadRewarded(placement: RewardedPlacementId): Promise<boolean> {
		try {
			return await this.inner.preloadRewarded(placement)
		} catch {
			return false
		}
	}

	async showRewarded(placement: RewardedPlacementId): Promise<RewardedAdResult> {
		try {
			return await this.inner.showRewarded(placement)
		} catch {
			return { completed: false, reason: 'error' }
		}
	}

	shouldShowBanner(placement: BannerPlacementId): boolean {
		try {
			return this.inner.shouldShowBanner(placement)
		} catch {
			return false
		}
	}

	getBannerAdUnitId(placement: BannerPlacementId): string | null {
		try {
			return this.inner.getBannerAdUnitId(placement)
		} catch {
			return null
		}
	}
}
