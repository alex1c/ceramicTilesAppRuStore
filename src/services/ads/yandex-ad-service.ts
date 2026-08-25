import {
	isBannerConfigured,
	isBannerPlacementEnabled,
	isProductBannerPlacement,
	isRewardedConfigured,
	isRewardedEnabledInProduct,
	resolveBannerAdUnitId,
	resolveRewardedAdUnitId,
	type RewardedPlacementId,
} from '@/config/ads-config'
import { getAnalyticsService } from '@/services/analytics'
import type {
	AdService,
	AdShowResult,
	BannerPlacementId,
	RewardedAdResult,
} from './types'

type YandexMobileAdsModule = typeof import('yandex-mobile-ads')

type LoadedRewarded = {
	placement: RewardedPlacementId
	ad: import('yandex-mobile-ads').RewardedAd
}

/**
 * Yandex Mobile Ads adapter — native SDK isolated behind AdService.
 *
 * Phase 5C scope: initialize + rewarded load/show. Banner rendering uses
 * BannerView in `result-banner.tsx` (same package, still not imported by UI).
 * Interstitial / app-open intentionally stay unimplemented.
 */
export class YandexAdService implements AdService {
	private sdk: YandexMobileAdsModule | null = null
	private initialized = false
	private initializePromise: Promise<void> | null = null
	private loadedRewarded: LoadedRewarded | null = null
	private rewardedLoading = false

	private loadSdk(): YandexMobileAdsModule | null {
		if (this.sdk) {
			return this.sdk
		}

		try {
			// Lazy require so Jest and web tooling never touch the native module.
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			this.sdk = require('yandex-mobile-ads') as YandexMobileAdsModule
			return this.sdk
		} catch {
			return null
		}
	}

	async initialize(): Promise<void> {
		if (this.initialized) {
			return
		}

		if (this.initializePromise) {
			return this.initializePromise
		}

		this.initializePromise = this.doInitialize()
		return this.initializePromise
	}

	private async doInitialize(): Promise<void> {
		const sdk = this.loadSdk()
		if (!sdk) {
			return
		}

		try {
			/*
			 * Privacy defaults (conservative, Russia-first RuStore):
			 * - Do not enable location targeting from app code.
			 * - Do not invent GDPR consent UI; leave userConsent unset/false.
			 * - Age-restricted flag stays false (adult DIY calculator audience).
			 * See docs/ADS.md for the product/legal caveat.
			 */
			sdk.MobileAds.setLocationConsent(false)
			sdk.MobileAds.setAgeRestrictedUser(false)
			await sdk.MobileAds.initialize()
			this.initialized = true
		} catch {
			// Fail open — product features stay available without ads.
		}
	}

	async preloadInterstitial(): Promise<void> {
		// Phase 5C policy: no interstitial monetization.
	}

	async showInterstitial(): Promise<AdShowResult> {
		return { shown: false, reason: 'skipped' }
	}

	shouldShowBanner(placement: BannerPlacementId): boolean {
		// Tile v1: only one placement may render (see isBannerPlacementEnabled).
		return (
			isProductBannerPlacement(placement) &&
			isBannerPlacementEnabled(placement) &&
			isBannerConfigured()
		)
	}

	getBannerAdUnitId(placement: BannerPlacementId): string | null {
		if (!isProductBannerPlacement(placement) || !isBannerPlacementEnabled(placement)) {
			return null
		}
		return resolveBannerAdUnitId()
	}

	async preloadRewarded(placement: RewardedPlacementId): Promise<boolean> {
		// Tile v1 product policy — rewarded ID may exist in config but must not load.
		if (!isRewardedEnabledInProduct() || !isRewardedConfigured()) {
			getAnalyticsService().track('rewarded_failed', {
				placement,
				format: 'rewarded',
				mode: 'calculator',
				error_category: 'unavailable',
			})
			return false
		}

		if (this.loadedRewarded?.placement === placement) {
			return true
		}

		if (this.rewardedLoading) {
			return false
		}

		await this.initialize()
		const sdk = this.loadSdk()
		const adUnitId = resolveRewardedAdUnitId()
		if (!sdk || !adUnitId) {
			return false
		}

		this.rewardedLoading = true
		getAnalyticsService().track('rewarded_load_requested', {
			placement,
			format: 'rewarded',
			mode: 'calculator',
		})

		try {
			const loader = await sdk.RewardedAdLoader.create()
			const ad = await loader.loadAd({ adUnitId })
			this.loadedRewarded = { placement, ad }
			getAnalyticsService().track('rewarded_loaded', {
				placement,
				format: 'rewarded',
				mode: 'calculator',
			})
			return true
		} catch {
			this.loadedRewarded = null
			getAnalyticsService().track('rewarded_failed', {
				placement,
				format: 'rewarded',
				mode: 'calculator',
				error_category: 'load',
			})
			return false
		} finally {
			this.rewardedLoading = false
		}
	}

	async showRewarded(placement: RewardedPlacementId): Promise<RewardedAdResult> {
		if (!isRewardedEnabledInProduct()) {
			return { completed: false, reason: 'not_ready' }
		}
		const ready = await this.preloadRewarded(placement)
		if (!ready || !this.loadedRewarded || this.loadedRewarded.placement !== placement) {
			return { completed: false, reason: 'not_ready' }
		}

		const ad = this.loadedRewarded.ad
		this.loadedRewarded = null

		return new Promise<RewardedAdResult>((resolve) => {
			let settled = false
			let rewardGranted = false
			let rewardReported = false

			const detachCallbacks = () => {
				ad.onAdShown = () => {}
				ad.onRewarded = () => {}
				ad.onAdFailedToShow = () => {}
				ad.onAdDismissed = () => {}
			}

			const finish = (result: RewardedAdResult) => {
				if (settled) {
					return
				}
				settled = true
				detachCallbacks()
				resolve(result)
			}

			ad.onAdShown = () => {
				getAnalyticsService().track('rewarded_opened', {
					placement,
					format: 'rewarded',
					mode: 'calculator',
				})
			}

			ad.onRewarded = () => {
				if (settled || rewardReported) {
					return
				}
				rewardReported = true
				rewardGranted = true
				getAnalyticsService().track('rewarded_reward_earned', {
					placement,
					format: 'rewarded',
					mode: 'calculator',
				})
			}

			ad.onAdFailedToShow = () => {
				if (settled) {
					return
				}
				getAnalyticsService().track('rewarded_failed', {
					placement,
					format: 'rewarded',
					mode: 'calculator',
					error_category: 'show',
				})
				finish({ completed: false, reason: 'error' })
			}

			ad.onAdDismissed = () => {
				if (settled) {
					return
				}
				getAnalyticsService().track('rewarded_closed', {
					placement,
					format: 'rewarded',
					mode: 'calculator',
					reward_granted: rewardGranted,
				})
				if (rewardGranted) {
					finish({ completed: true, rewardGranted: true })
				} else {
					finish({ completed: true, rewardGranted: false })
				}
			}

			void ad.show().catch(() => {
				if (settled) {
					return
				}
				getAnalyticsService().track('rewarded_failed', {
					placement,
					format: 'rewarded',
					mode: 'calculator',
					error_category: 'show',
				})
				finish({ completed: false, reason: 'error' })
			})
		})
	}
}
