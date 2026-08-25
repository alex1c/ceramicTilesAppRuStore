import { createAdService } from './create-ad-service'
import type { AdService } from './types'

let adService: AdService = createAdService()

/** Returns the process-wide ad service instance. */
export function getAdService(): AdService {
	return adService
}

/** Allows tests or future DI to replace the ad provider. */
export function setAdService(service: AdService): void {
	adService = service
}
