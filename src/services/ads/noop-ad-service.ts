import type {
	AdService,
	AdShowResult,
	BannerPlacementId,
	RewardedAdResult,
	RewardedPlacementId,
} from './types'

function shouldLogDevNoop(): boolean {
	return __DEV__ && process.env.JEST_WORKER_ID === undefined
}

/**
 * Safe development / Jest provider — no SDK, no network, no real ad unit traffic.
 * Logs intent in `__DEV__` (outside Jest) so integration points remain visible.
 */
export class NoopAdService implements AdService {
	async initialize(): Promise<void> {
		if (shouldLogDevNoop()) {
			console.info('[AdService:noop] initialize skipped')
		}
	}

	async preloadInterstitial(): Promise<void> {
		if (shouldLogDevNoop()) {
			console.info('[AdService:noop] preloadInterstitial skipped')
		}
	}

	async showInterstitial(): Promise<AdShowResult> {
		if (shouldLogDevNoop()) {
			console.info('[AdService:noop] showInterstitial skipped')
		}
		return { shown: false, reason: 'skipped' }
	}

	async preloadRewarded(_placement: RewardedPlacementId): Promise<boolean> {
		if (shouldLogDevNoop()) {
			console.info('[AdService:noop] preloadRewarded skipped')
		}
		return false
	}

	async showRewarded(_placement: RewardedPlacementId): Promise<RewardedAdResult> {
		if (shouldLogDevNoop()) {
			console.info('[AdService:noop] showRewarded skipped')
		}
		return { completed: false, reason: 'not_ready' }
	}

	shouldShowBanner(_placement: BannerPlacementId): boolean {
		return false
	}

	getBannerAdUnitId(_placement: BannerPlacementId): string | null {
		return null
	}
}
