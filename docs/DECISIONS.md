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

## 2026-08-24 — Phase 3B layout-aware straight calculation

Status: Accepted

Context: Area-only `ceil(area/tile)` under-counts edge reuse and over-counts
`ceil(W/tw)×ceil(H/th)` when identical remainders share a source tile.

Decision:

1. Straight layouts without openings use row/column geometry + 1D edge yield +
   conservative +1 corner tile when both remainders exist.
2. Reserve applies only after `baseLayoutTiles`.
3. Multiple walls are calculated separately; no cross-wall offcut reuse.
4. Openings force area-based estimate (openings are not per-wall positioned).
5. Diagonal / offset stay area estimates with recommended reserve only.
6. Domain exposes layout structure for visualization; UI must not recompute geometry.

Consequences: Some Phase 0 acceptance numbers for straight floors with remainders
change intentionally (e.g. 4×3 m with 60×60 cm: layout base 35 vs area ceil 34).

## 2026-08-24 — New wall inherits previous dimensions

Status: Accepted

Context: Empty new-wall fields slowed multi-wall entry.

Decision: `+ Добавить стену` copies the previous wall’s width and height strings.
