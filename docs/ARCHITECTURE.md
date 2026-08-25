# Architecture — Tile Calculator

## Stack

- Expo SDK 57 + React Native 0.86 + TypeScript strict
- Expo Router under `src/app/`
- Expo Development Build (not Expo Go)
- Android-first

## Layers

```text
UI (src/app, src/features/tile, src/theme)
        │
        ▼
Presenter + i18n + units (parse/format)
        │ canonical numbers
        ▼
Domain (src/domain/tile) — pure TypeScript
        │
        ▼
Services: AdService / AnalyticsService (noop/dev in this bootstrap)
```

### Domain

- Canonical length: integer millimeters
- Areas: square millimeters internally; results expose m² as numbers
- Money: major units, rounded to 2 decimals only at the price result
- No React, Expo, ads, or i18n inside `src/domain/`
- Phase 3B: `layout-rect.ts` produces per-rectangle layout stats; `calculate.ts`
  aggregates walls, applies reserve/packaging/price, and attaches `layout` +
  `scheme` data for the UI
- Visualization and explanation **consume domain output** — no duplicated geometry
  formulas in React components

### Ads / analytics

UI never imports native SDKs. v1.0 bootstrap uses Noop/Dev providers.
Production Yandex Ads and AppMetrica follow the wallpaper app pattern in a later phase.

### Input

Form fields store strings. `parseTileForm` + `parseUserDecimalNumber` normalize comma/dot.
Incomplete drafts (`4,`) stay visible and fail parse instead of becoming a Number.
