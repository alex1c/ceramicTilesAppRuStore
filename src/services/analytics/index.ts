import { env } from '@/config/env'
import { DevAnalyticsService } from './dev-analytics-service'
import { NoopAnalyticsService } from './noop-analytics-service'
import { SafeAnalyticsService } from './safe-analytics-service'
import type { AnalyticsService } from './types'

function createDefaultAnalyticsService(): AnalyticsService {
	const useNoop = Boolean(process.env.JEST_WORKER_ID) || !env.analyticsDevMode
	return new SafeAnalyticsService(
		useNoop ? new NoopAnalyticsService() : new DevAnalyticsService(),
	)
}

let analyticsService: AnalyticsService = createDefaultAnalyticsService()

export function getAnalyticsService(): AnalyticsService {
	return analyticsService
}

export function setAnalyticsService(service: AnalyticsService): void {
	analyticsService = service
}

export type { AnalyticsService } from './types'
export type { AnalyticsEventName } from './event-taxonomy'
