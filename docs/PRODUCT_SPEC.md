# Tile Calculator — Product & Calculation Spec (v1.0.0)

Frozen Phase 0 source of truth. Implementation must not silently change formulas.
Full original scope was provided for ForestMusic — «Калькулятор плитки».

## Goal

Help the user answer: **how many tiles and boxes to buy, and what it will cost?**

Opens directly on the calculator. No account, onboarding, cloud, or network for calculation.

## Core formula

```
effectiveArea = floorLength × floorWidth
             or totalWallArea − totalOpeningArea
tileArea = tileWidthCm / 100 × tileHeightCm / 100
rawTiles = effectiveArea / tileArea
tilesWithReserve = ceil(rawTiles × (1 + reservePercent / 100))
```

Do **not** ceil `rawTiles` first and then apply reserve.

Layout patterns only change **recommended** reserve (straight 10%, diagonal 15%, offset 1/2 10%, offset 1/3 10%). Never apply a hidden extra layout coefficient.

## Surfaces and openings

- Floor: length × width in meters.
- Walls: one or more walls (width × height). User can add/remove/edit. Minimum one wall.
- Openings (walls only): door / window / other — UX labels only; math is identical.
- Incomplete `0 × 0` openings are ignored.
- If openings area > wall area → validation error, never a negative tile count.

## Packaging

Optional.

- Tiles per box: `boxes = ceil(tilesWithReserve / tilesPerBox)`; remainder = purchased − required.
- m² per box: `boxes = ceil(requiredAreaWithReserve / boxArea)`.

## Pricing

Optional. Currency code is independent of the ₽ symbol.

- Per tile: purchased tiles (or `tilesWithReserve` if no packaging) × price.
- Per box: requires packaging; boxes × price.
- Per m²: purchased area if packaging, else required area with reserve.

## Input

Accept `4`, `4.5`, `4,5`. Keep editable strings (allow `4,`, `0,`, empty). Normalize on parse, not while typing.

## Non-goals (v1.0)

No 2D editor, AR, exact geometric placement, grout/adhesive, L-shape engine, mixed tile sizes, weight, or delivery.

## Acceptance cases

Cases 1–20 from the product spec are implemented as Jest tests in
`src/domain/tile/__tests__/acceptance.test.ts`.
