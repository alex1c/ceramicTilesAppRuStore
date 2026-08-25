import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsScreenName,
} from './event-taxonomy'
import type { AnalyticsService } from './types'

export type RecordedAnalyticsCall =
  | { kind: 'track'; name: AnalyticsEventName; params?: object }
  | { kind: 'screen'; name: AnalyticsScreenName }
  | { kind: 'initialize' }
  | { kind: 'setEnabled'; enabled: boolean }

/**
 * In-memory analytics recorder for unit tests.
 */
export class RecordingAnalyticsService implements AnalyticsService {
  readonly calls: RecordedAnalyticsCall[] = []
  private enabled = true
  private initializeCount = 0

  initialize(): void {
    this.initializeCount += 1
    this.calls.push({ kind: 'initialize' })
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

    this.calls.push({
      kind: 'track',
      name,
      params: args[0] as object | undefined,
    })
  }

  screen(name: AnalyticsScreenName): void {
    if (!this.enabled) {
      return
    }

    this.calls.push({ kind: 'screen', name })
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.calls.push({ kind: 'setEnabled', enabled })
  }

  getInitializeCount(): number {
    return this.initializeCount
  }

  trackedNames(): AnalyticsEventName[] {
    return this.calls
      .filter((call): call is Extract<RecordedAnalyticsCall, { kind: 'track' }> => call.kind === 'track')
      .map((call) => call.name)
  }
}
