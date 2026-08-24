# Decisions

## 2026-08-24 — Expo instead of bare React Native

Status: Accepted

Context: The wallpaper sibling app already ships Expo SDK 57 + development builds.

Decision: Same stack for Tile Calculator.

Why: Shared patterns, CNG, and a proven Android RuStore path.

Consequences: Native ads/analytics go behind service interfaces; Expo Go is not the runtime target.

## 2026-08-24 — Separate repository, no monorepo

Status: Accepted

Context: Platform strategy says extract a shared package only after first-app economics.

Decision: Copy proven foundation; keep this repo independent.

## 2026-08-24 — Canonical millimeters + area-based tile math

Status: Accepted

Context: Spec formulas are in meters/cm; wallpaper uses mm.

Decision: Convert to integer mm internally; expose m² in the result model. Tile count uses `ceil(rawTiles × (1 + reserve/100))` once.

Why: Avoids UI-rounded values feeding later math, matches acceptance cases.

## 2026-08-24 — Layout does not simulate placement

Status: Accepted

Context: Spec forbids fake precision.

Decision: Layout only suggests reserve percent. User-edited reserve is the only waste coefficient.

## 2026-08-24 — Currency code vs display symbol

Status: Accepted

Context: v1.0 UI uses ₽; later currencies may appear.

Decision: Domain stores ISO-like `currencyCode` (default `RUB`). Presenter renders the symbol.

## 2026-08-24 — Zero openings are incomplete, not area

Status: Accepted

Context: Case 14.

Decision: Drop openings with width or height ≤ 0 during normalize. Do not crash.
