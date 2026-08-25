import { NoopShareService } from './noop-share-service'
import type { ShareService } from './types'

function isJestRuntime(): boolean {
	return typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined
}

let shareService: ShareService = isJestRuntime()
	? new NoopShareService()
	: null as unknown as ShareService

/**
 * Returns the process-wide share service.
 * Jest uses Noop; production lazily loads the Expo native adapter.
 */
export function getShareService(): ShareService {
	if (!shareService) {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { ExpoShareService } = require('./expo-share-service') as typeof import('./expo-share-service')
		shareService = new ExpoShareService()
	}

	return shareService
}

/** Test helper — inject a fake share adapter. */
export function setShareService(service: ShareService): void {
	shareService = service
}

export type { ShareService, ShareOutcome, PdfGenerationOutcome } from './types'
export { NoopShareService } from './noop-share-service'
