import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsParams,
  AnalyticsScreenName,
} from './event-taxonomy'
import type { AnalyticsService } from './types'

export type AppMetricaModule = {
  activate: (config: {
    apiKey: string
    sessionTimeout?: number
    locationTracking?: boolean
    statisticsSending?: boolean
    logs?: boolean
    crashReporting?: boolean
    advIdentifiersTracking?: boolean
    firstActivationAsUpdate?: boolean
  }) => void
  reportEvent: (eventName: string, attributes?: Record<string, unknown>) => void
  setDataSendingEnabled: (enabled: boolean) => void
}

export type AppMetricaSdkLoader = () => AppMetricaModule | null

/**
 * Default loader — isolates the native require so Jest never evaluates it unless asked.
 */
export const defaultAppMetricaSdkLoader: AppMetricaSdkLoader = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('@appmetrica/react-native-analytics') as {
      default?: AppMetricaModule
    } & AppMetricaModule

    return loaded.default ?? loaded
  } catch {
    return null
  }
}

/**
 * AppMetrica provider adapter. UI must never import this module directly.
 *
 * API key treatment: AppMetrica issues an application identifier for client
 * embedding (similar to a public analytics app id). It is not a server secret,
 * but production keys still stay in local `.env` / CI secrets and are not
 * committed (see AGENTS.md / .env.example).
 */
export class AppMetricaAnalyticsService implements AnalyticsService {
  private readonly apiKey: string
  private readonly loadSdk: AppMetricaSdkLoader
  private activated = false
  private enabled = true
  private sdk: AppMetricaModule | null | undefined

  constructor(apiKey: string, loadSdk: AppMetricaSdkLoader = defaultAppMetricaSdkLoader) {
    this.apiKey = apiKey.trim()
    this.loadSdk = loadSdk
  }

  initialize(): void {
    if (this.activated || this.apiKey.length === 0) {
      return
    }

    const sdk = this.getSdk()
    if (!sdk) {
      return
    }

    sdk.activate({
      apiKey: this.apiKey,
      sessionTimeout: 120,
      // Privacy defaults for product analytics — no app-driven location.
      locationTracking: false,
      advIdentifiersTracking: false,
      statisticsSending: this.enabled,
      // SDK debug logs only in development builds — never in production.
      logs: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
      crashReporting: true,
      firstActivationAsUpdate: false,
    })

    this.activated = true
  }

  track<Name extends AnalyticsEventName>(
    name: Name,
    ...args: AnalyticsEventMap[Name] extends undefined
      ? []
      : [params: AnalyticsEventMap[Name]]
  ): void {
    if (!this.enabled) {
      return
    }

    this.initialize()

    const sdk = this.getSdk()
    if (!sdk || !this.activated) {
      return
    }

    const params = (args[0] ?? undefined) as AnalyticsParams | undefined
    // Local JS console diagnostics intentionally omitted — use AppMetrica
    // SDK `logs: __DEV__` (activate config) for native-side verification.
    if (params) {
      sdk.reportEvent(name, params)
    } else {
      sdk.reportEvent(name)
    }
  }

  screen(name: AnalyticsScreenName): void {
    if (!this.enabled) {
      return
    }

    this.initialize()
    const sdk = this.getSdk()
    if (!sdk || !this.activated) {
      return
    }

    // AppMetrica RN plugin has no dedicated screen API — use a stable event.
    sdk.reportEvent('screen_view', { screen: name })
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled

    const sdk = this.getSdk()
    if (!sdk || !this.activated) {
      return
    }

    sdk.setDataSendingEnabled(enabled)
  }

  /** Test/diagnostic helper. */
  isActivated(): boolean {
    return this.activated
  }

  private getSdk(): AppMetricaModule | null {
    if (this.sdk === undefined) {
      this.sdk = this.loadSdk()
    }

    return this.sdk
  }
}
