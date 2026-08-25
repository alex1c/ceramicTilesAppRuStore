# Analytics — Tile Calculator

AppMetrica behind `AnalyticsService` (Safe / Noop / Dev / AppMetrica).

Production API key via `EXPO_PUBLIC_APPMETRICA_API_KEY` (local `.env` / CI — not git).

## Events

- `app_open`
- `calculator_opened`
- `calculation_completed` / `calculation_failed`
- `explanation_opened`
- `result_shared`
- `report_exported`
- plus categorical ad lifecycle events from Foundation

Tile product events (categorical, no dimensions) remain available.

Analytics failure never blocks calculation.
