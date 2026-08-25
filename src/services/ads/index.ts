export { getAdService, setAdService } from './ad-registry'
export type {
	AdErrorCategory,
	AdFormat,
	AdPlacementId,
	AdService,
	AdShowResult,
	BannerPlacementId,
	ResultBannerContext,
	RewardedAdResult,
	RewardedPlacementId,
} from './types'
export { NoopAdService } from './noop-ad-service'
export { SafeAdService } from './safe-ad-service'
export { createAdService } from './create-ad-service'

// ResultBanner lives in `./result-banner` and must be imported directly —
// it depends on React Native and must not enter the Jest node test graph.
