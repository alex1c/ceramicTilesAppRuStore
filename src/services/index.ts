import { getAdService } from './ads'
import { getAnalyticsService } from './analytics'
import { getShareService } from './sharing'

let initialized = false

/**
 * Bootstraps cross-cutting services once at app entry.
 * Analytics and ads activation are fail-safe and never block calculation UX.
 */
export function initializeAppServices(): void {
	if (initialized) {
		return
	}

	const analytics = getAnalyticsService()
	analytics.initialize()
	analytics.track('app_open')

	void getAdService().initialize()
	// Interstitial intentionally unused; keep Foundation call as noop.
	void getAdService().preloadInterstitial()
	void getShareService()

	initialized = true
}

/** Test helper — allows re-running bootstrap after replacing services. */
export function resetAppServicesInitializationForTests(): void {
	initialized = false
}

export { getAdService, setAdService } from './ads'
export { getAnalyticsService, setAnalyticsService } from './analytics'
export { getShareService, setShareService } from './sharing'

export type {
	AdService,
	AdShowResult,
	RewardedAdResult,
} from './ads'
export type {
	AnalyticsEventName,
	AnalyticsService,
} from './analytics'
export type { ShareService, ShareOutcome, PdfGenerationOutcome } from './sharing'
