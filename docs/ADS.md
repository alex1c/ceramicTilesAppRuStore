# Ads — Tile Calculator v1

Yandex Mobile Ads behind `AdService`.

## Product policy

**At most one advertisement visible on screen.**

Active placement: `result_banner` (below Share actions in the result card).  
`footer_banner` remains in config but is **disabled** via `isBannerPlacementEnabled`.

Production banner: `R-M-19813928-1` (via `EXPO_PUBLIC_YANDEX_ADS_BANNER_UNIT_ID`).

Reserved rewarded: `R-M-19813928-2` — **DISABLED in v1** (no UI, no show).

No interstitial.

## Rules

- Fail-open if load fails.
- Never cover calculator controls or result lines.
- `__DEV__` / Jest use official Yandex demo units.
