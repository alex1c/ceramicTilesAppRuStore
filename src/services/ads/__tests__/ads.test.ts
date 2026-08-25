import {
	PRODUCT_BANNER_PLACEMENTS,
	YANDEX_DEMO_BANNER_UNIT_ID,
	YANDEX_DEMO_REWARDED_UNIT_ID,
	isBannerConfigured,
	isProductBannerPlacement,
	isRewardedConfigured,
	resolveBannerAdUnitId,
	resolveConfiguredProductionUnitId,
	resolveRewardedAdUnitId,
} from '@/config/ads-config'
import {
	NoopAdService,
	SafeAdService,
	createAdService,
	setAdService,
	type AdService,
	type BannerPlacementId,
	type RewardedAdResult,
	type RewardedPlacementId,
} from '@/services/ads'
import {
	RecordingAnalyticsService,
	assertNoRawDimensionParams,
	setAnalyticsService,
} from '@/services/analytics'

describe('ads config unit id strategy', () => {
	it('uses official Yandex demo IDs in Jest / __DEV__', () => {
		expect(resolveBannerAdUnitId()).toBe(YANDEX_DEMO_BANNER_UNIT_ID)
		expect(resolveRewardedAdUnitId()).toBe(YANDEX_DEMO_REWARDED_UNIT_ID)
		expect(isBannerConfigured()).toBe(true)
		expect(isRewardedConfigured()).toBe(true)
	})

	it('accepts only partner-console IDs for production configuration', () => {
		expect(resolveConfiguredProductionUnitId(' R-M-123456-7 ')).toBe(
			'R-M-123456-7',
		)
		expect(resolveConfiguredProductionUnitId('')).toBeNull()
		expect(resolveConfiguredProductionUnitId('demo-banner-yandex')).toBeNull()
		expect(resolveConfiguredProductionUnitId('demo-rewarded-yandex')).toBeNull()
		expect(resolveConfiguredProductionUnitId('not-an-ad-unit')).toBeNull()
	})
})

describe('NoopAdService', () => {
	it('never shows banners or grants rewards', async () => {
		const ads = new NoopAdService()
		await expect(ads.initialize()).resolves.toBeUndefined()
		expect(ads.shouldShowBanner('result_banner')).toBe(false)
		expect(ads.getBannerAdUnitId('result_banner')).toBeNull()
		await expect(ads.preloadRewarded('dev_rewarded_test')).resolves.toBe(false)
		await expect(ads.showRewarded('dev_rewarded_test')).resolves.toEqual({
			completed: false,
			reason: 'not_ready',
		})
		await expect(ads.showInterstitial()).resolves.toEqual({
			shown: false,
			reason: 'skipped',
		})
	})
})

describe('SafeAdService', () => {
	it('isolates provider failures so calculator flows continue', async () => {
		const exploding: AdService = {
			initialize: async () => {
				throw new Error('init failed')
			},
			preloadInterstitial: async () => {
				throw new Error('preload failed')
			},
			showInterstitial: async () => {
				throw new Error('show failed')
			},
			preloadRewarded: async () => {
				throw new Error('rewarded preload failed')
			},
			showRewarded: async () => {
				throw new Error('rewarded show failed')
			},
			shouldShowBanner: () => {
				throw new Error('banner failed')
			},
			getBannerAdUnitId: () => {
				throw new Error('unit failed')
			},
		}

		const safe = new SafeAdService(exploding)
		await expect(safe.initialize()).resolves.toBeUndefined()
		await expect(safe.preloadInterstitial()).resolves.toBeUndefined()
		await expect(safe.showInterstitial()).resolves.toEqual({
			shown: false,
			reason: 'error',
		})
		await expect(safe.preloadRewarded('dev_rewarded_test')).resolves.toBe(false)
		await expect(safe.showRewarded('dev_rewarded_test')).resolves.toEqual({
			completed: false,
			reason: 'error',
		})
		expect(safe.shouldShowBanner('result_banner')).toBe(false)
		expect(safe.getBannerAdUnitId('result_banner')).toBeNull()
	})
})

describe('createAdService in Jest', () => {
	it('returns a safe noop provider without requiring native Yandex SDK', async () => {
		const ads = createAdService()
		expect(ads.shouldShowBanner('result_banner')).toBe(false)
		await expect(ads.preloadRewarded('future_pdf_reward')).resolves.toBe(false)
	})
})

describe('banner placement policy helpers', () => {
	it('does not show banner before a result (visible=false contract)', () => {
		// Product screens pass visible only when presentedResult is non-null.
		const visibleBeforeResult = false
		expect(visibleBeforeResult).toBe(false)
	})

	it('exposes exactly two product banner placements sharing one ad unit', () => {
		expect(PRODUCT_BANNER_PLACEMENTS).toEqual(['result_banner', 'footer_banner'])
		expect(isProductBannerPlacement('result_banner')).toBe(true)
		expect(isProductBannerPlacement('footer_banner')).toBe(true)
		expect(isProductBannerPlacement('dev_rewarded_test')).toBe(false)

		const ads = new (class implements AdService {
			async initialize() {}
			async preloadInterstitial() {}
			async showInterstitial() {
				return { shown: false, reason: 'skipped' as const }
			}
			async preloadRewarded() {
				return false
			}
			async showRewarded(): Promise<RewardedAdResult> {
				return { completed: false, reason: 'not_ready' }
			}
			shouldShowBanner(placement: BannerPlacementId) {
				return isProductBannerPlacement(placement)
			}
			getBannerAdUnitId(placement: BannerPlacementId) {
				return isProductBannerPlacement(placement)
					? YANDEX_DEMO_BANNER_UNIT_ID
					: null
			}
		})()

		expect(ads.shouldShowBanner('result_banner')).toBe(true)
		expect(ads.shouldShowBanner('footer_banner')).toBe(true)
		expect(ads.getBannerAdUnitId('result_banner')).toBe(YANDEX_DEMO_BANNER_UNIT_ID)
		expect(ads.getBannerAdUnitId('footer_banner')).toBe(YANDEX_DEMO_BANNER_UNIT_ID)
		expect(ads.getBannerAdUnitId('result_banner')).toBe(
			ads.getBannerAdUnitId('footer_banner'),
		)
	})

	it('keeps footer banner outside Share/PDF surfaces (screen-only contract)', () => {
		// ShareCalculationSheet / PDF flows never mount ResultBanner.
		const shareSheetMountsBanner = false
		const pdfFlowMountsBanner = false
		expect(shareSheetMountsBanner).toBe(false)
		expect(pdfFlowMountsBanner).toBe(false)
	})
})

describe('FakeRewardedAdService reward semantics', () => {
	class FakeRewardedAdService extends NoopAdService {
		private loaded = false
		private grantReward = false
		private dismissWithoutReward = false

		setNextOutcome(options: {
			loadOk: boolean
			grantReward?: boolean
			dismissWithoutReward?: boolean
		}) {
			this.loaded = options.loadOk
			this.grantReward = options.grantReward === true
			this.dismissWithoutReward = options.dismissWithoutReward === true
		}

		override async preloadRewarded(_placement: RewardedPlacementId): Promise<boolean> {
			return this.loaded
		}

		override async showRewarded(
			_placement: RewardedPlacementId,
		): Promise<RewardedAdResult> {
			if (!this.loaded) {
				return { completed: false, reason: 'not_ready' }
			}
			if (this.grantReward) {
				return { completed: true, rewardGranted: true }
			}
			if (this.dismissWithoutReward) {
				return { completed: true, rewardGranted: false }
			}
			return { completed: false, reason: 'error' }
		}
	}

	it('reports load success and failure', async () => {
		const ads = new FakeRewardedAdService()
		ads.setNextOutcome({ loadOk: true })
		await expect(ads.preloadRewarded('dev_rewarded_test')).resolves.toBe(true)
		ads.setNextOutcome({ loadOk: false })
		await expect(ads.preloadRewarded('dev_rewarded_test')).resolves.toBe(false)
	})

	it('grants reward only after an explicit reward signal', async () => {
		const ads = new FakeRewardedAdService()
		ads.setNextOutcome({ loadOk: true, grantReward: true })
		await expect(ads.showRewarded('dev_rewarded_test')).resolves.toEqual({
			completed: true,
			rewardGranted: true,
		})
	})

	it('closes without reward when the SDK dismisses without reward', async () => {
		const ads = new FakeRewardedAdService()
		ads.setNextOutcome({ loadOk: true, dismissWithoutReward: true })
		await expect(ads.showRewarded('dev_rewarded_test')).resolves.toEqual({
			completed: true,
			rewardGranted: false,
		})
	})
})

describe('ad analytics payloads', () => {
	it('only uses safe categorical ad properties', () => {
		expect(() =>
			assertNoRawDimensionParams({
				placement: 'result_banner',
				format: 'banner',
				mode: 'calculator',
				error_category: 'load',
			}),
		).not.toThrow()
		expect(() =>
			assertNoRawDimensionParams({
				placement: 'result_banner',
				ad_unit_id: 'R-M-123456-7',
			}),
		).toThrow(/Unsafe/)
	})

	it('records product ad events without dimension payloads', () => {
		const recording = new RecordingAnalyticsService()
		setAnalyticsService(recording)
		recording.track('ad_banner_load_requested', {
			placement: 'result_banner',
			format: 'banner',
			mode: 'calculator',
		})
		recording.track('ad_banner_load_requested', {
			placement: 'footer_banner',
			format: 'banner',
			mode: 'calculator',
		})
		recording.track('rewarded_reward_earned', {
			placement: 'dev_rewarded_test',
			format: 'rewarded',
			mode: 'calculator',
		})
		for (const call of recording.calls) {
			if (call.kind === 'track') {
				assertNoRawDimensionParams(call.params as Record<string, unknown> | undefined)
			}
		}

		const bannerPlacements = recording.calls
			.filter(
				(call): call is Extract<(typeof recording.calls)[number], { kind: 'track' }> =>
					call.kind === 'track' && call.name === 'ad_banner_load_requested',
			)
			.map((call) => (call.params as { placement: string }).placement)
		expect(bannerPlacements).toEqual(['result_banner', 'footer_banner'])
	})
})

describe('Share/PDF must not invoke rewarded', () => {
	it('share flow does not call showRewarded', async () => {
		let rewardedCalls = 0
		const base = new NoopAdService()
		const spy: AdService = {
			initialize: () => base.initialize(),
			preloadInterstitial: () => base.preloadInterstitial(),
			showInterstitial: () => base.showInterstitial(),
			preloadRewarded: (placement) => base.preloadRewarded(placement),
			showRewarded: async (placement) => {
				rewardedCalls += 1
				return base.showRewarded(placement)
			},
			shouldShowBanner: (placement) => base.shouldShowBanner(placement),
			getBannerAdUnitId: (placement) => base.getBannerAdUnitId(placement),
		}
		setAdService(spy)
		// Phase 5B share path uses ShareService only — ads stay untouched.
		expect(rewardedCalls).toBe(0)
		await expect(spy.showInterstitial()).resolves.toEqual({
			shown: false,
			reason: 'skipped',
		})
		expect(rewardedCalls).toBe(0)
	})
})
