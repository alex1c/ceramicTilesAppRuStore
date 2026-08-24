/** Advertising boundary — UI never imports a native ads SDK. */
export type AdShowResult =
	| { shown: true }
	| { shown: false; reason: 'not_ready' | 'skipped' | 'error' }

export interface AdService {
	initialize(): Promise<void>
	preloadInterstitial(): Promise<void>
	showInterstitial(): Promise<AdShowResult>
	shouldShowBanner(): boolean
}

export class NoopAdService implements AdService {
	async initialize(): Promise<void> {}

	async preloadInterstitial(): Promise<void> {}

	async showInterstitial(): Promise<AdShowResult> {
		return { shown: false, reason: 'skipped' }
	}

	shouldShowBanner(): boolean {
		return false
	}
}

let adService: AdService = new NoopAdService()

export function getAdService(): AdService {
	return adService
}

export function setAdService(service: AdService): void {
	adService = service
}
