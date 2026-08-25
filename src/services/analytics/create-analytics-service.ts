import { env } from '@/config/env'
import { AppMetricaAnalyticsService } from './appmetrica-analytics-service'
import { DevAnalyticsService } from './dev-analytics-service'
import { NoopAnalyticsService } from './noop-analytics-service'
import { SafeAnalyticsService } from './safe-analytics-service'
import type { AnalyticsService } from './types'

const PLACEHOLDER_API_KEY = 'your-dev-appmetrica-key'

function isJestRuntime(): boolean {
  return typeof process !== 'undefined' && process.env.JEST_WORKER_ID !== undefined
}

function hasConfiguredAppMetricaKey(apiKey: string): boolean {
  const trimmed = apiKey.trim()
  return trimmed.length > 0 && trimmed !== PLACEHOLDER_API_KEY
}

/**
 * Builds the process analytics provider.
 *
 * Priority:
 * 1. Jest → silent noop
 * 2. Missing/placeholder API key → dev logger (no native SDK)
 * 3. Real API key → AppMetrica adapter
 *
 * Always wrapped in SafeAnalyticsService so failures never crash the app.
 */
export function createAnalyticsService(): AnalyticsService {
  if (isJestRuntime()) {
    return new SafeAnalyticsService(new NoopAnalyticsService())
  }

  if (!hasConfiguredAppMetricaKey(env.appMetricaApiKey)) {
    return new SafeAnalyticsService(new DevAnalyticsService())
  }

  return new SafeAnalyticsService(
    new AppMetricaAnalyticsService(env.appMetricaApiKey),
  )
}

export { hasConfiguredAppMetricaKey, PLACEHOLDER_API_KEY }
