# Roadmap — Tile Calculator

## Phase 0 — Product spec ✅

Frozen in `docs/PRODUCT_SPEC.md`.

## Phase 1 — Foundation ✅ (this bootstrap)

Expo, Router, TypeScript, i18n, units, AdService/AnalyticsService boundaries, tests.

## Phase 2 — Calculation engine ✅

Pure TypeScript engine + acceptance cases 1–20.

## Phase 3 — MVP UX ✅

Single calculator screen: floor/walls, openings, tile presets, layout, reserve, optional packaging/price, explanation.

## Phase 3B — Layout-aware calculation & visual scheme (current)

- Straight rectangular layout quantity with 1D edge reuse + conservative corner policy
- Tile orientation comparison for non-square tiles
- Per-wall geometry (no merged rectangle); openings remain estimated
- Compact visual scheme driven by domain layout output
- New wall inherits previous dimensions
- Spec: `docs/PRODUCT_SPEC.md` (Phase 3B section)

## Phase 4 — Ads & analytics production

Yandex Mobile Ads banners after the result; AppMetrica with the taxonomy in the product spec.

## Phase 5 — Product quality

Last-calculation persistence, accessibility pass, privacy policy hosting.

## Phase 6 — RuStore release

Signing, listing, privacy URL, version 1.0.0 / versionCode 1.

Deferred: grout, adhesive, L-shape, saved projects, share/PDF (may copy wallpaper Phase 5B later).
