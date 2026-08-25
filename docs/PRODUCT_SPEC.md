# Tile Calculator — Product & Calculation Spec

**Brand:** ForestMusic — «Калькулятор плитки»
**Package:** `com.calculatorplatform.tile`

This document is the product/calculation source of truth. Phase 0 area formulas remain
documented for history. **Phase 3B replaces the primary quantity model for straight
rectangular layouts.**

---

## Goal

Help the user answer: **how many tiles and boxes to buy, and what it will cost?**

Opens directly on the calculator. No account, onboarding, cloud, or network for calculation.

The UI must continue to state that the result is an **estimate**, not a professional
cutting plan or CAD layout.

---

## Phase 3B — Layout-aware calculation

### What “layout-aware” means

For a **straight** layout on a **rectangle** (floor or a single wall) with a rectangular
tile, the engine derives quantity from **rows, columns, and edge remainders**, including
safe reuse of **identical one-dimensional edge pieces**, instead of only
`surfaceArea / tileArea`.

### What can be calculated exactly (straight, no openings)

- Full-tile grid (`fullColumns × fullRows`).
- Count of identical right/left edge pieces and top/bottom edge pieces.
- How many source tiles those edge pieces need when
  `piecesPerTile = floor(tileDim / pieceDim)` is valid.
- Comparison of the two tile orientations for non-square tiles.
- Per-wall geometry when multiple walls are entered (walls are **not** merged into one
  rectangle).

### What remains an estimate

- Diagonal and offset (1/2, 1/3) layouts — area-based quantity + recommended reserve.
- Walls that have openings — openings reduce useful area for estimation; they are shown
  schematically but are **not** an exact cut-around-opening optimizer.
- User reserve — practical extra material (breakage, defects, mistakes, replacements).
- Packaging rounding and price.

### Separated concepts

| Concept | Meaning |
|--------|---------|
| **A. Layout quantity** | Source tiles implied by the straight rectangular layout (full + edge reuse + corner policy). |
| **B. Reusable cuts** | Identical 1D edge pieces cut from one full tile when `floor(tileDim/pieceDim) ≥ 1`. |
| **C. User reserve** | Applied **after** layout quantity. Never a hidden layout multiplier. |

```text
baseLayoutTiles
→ ceil(baseLayoutTiles × (1 + reservePercent / 100))
→ finalRequiredTiles
→ packaging / price
```

Example presentation:

```text
По раскладке: 825 плиток
Запас 10%: +83
Итого: 908 плиток
```

---

## Straight rectangular algorithm (canonical mm)

Inputs (integers, millimeters):

```text
surfaceWidthMm, surfaceHeightMm
tileWidthMm, tileHeightMm   // for the selected orientation
```

```text
fullColumns = floor(surfaceWidthMm / tileWidthMm)
fullRows    = floor(surfaceHeightMm / tileHeightMm)
remW = surfaceWidthMm - fullColumns * tileWidthMm
remH = surfaceHeightMm - fullRows * tileHeightMm
```

### Regions

1. **Full tiles:** `fullColumns × fullRows`
2. **Vertical edge** (if `remW > 0`): `fullRows` pieces of size `remW × tileHeightMm`
3. **Horizontal edge** (if `remH > 0`): `fullColumns` pieces of size `tileWidthMm × remH`
4. **Corner** (if `remW > 0` and `remH > 0`): one piece `remW × remH`

### 1D edge yield

```text
piecesPerTile = floor(tileDimAlongCut / requiredPieceDim)
sourceTiles   = ceil(requiredPieces / piecesPerTile)
```

Examples:

- Tile 100 mm, piece 50 mm → 2 pieces / tile.
- Tile 600 mm, piece 400 mm → 1 piece / tile (cannot get two 400 mm from 600 mm).

### Corner policy (Phase 3B — conservative)

When both remainders are non-zero, add **+1 source tile** for the corner piece.
Do **not** assume leftovers from independent edge strips cover the corner.
This avoids ambiguous 2D offcut reuse without a cutting-stock optimizer.

### Total base layout quantity (one rectangle)

```text
base =
  fullColumns * fullRows
  + verticalEdgeSourceTiles
  + horizontalEdgeSourceTiles
  + (bothRemainders ? 1 : 0)
```

If the surface is smaller than one tile in both axes, `base = 1` when area &gt; 0
(covers a single cut piece / corner-only case).

Do **not** use `ceil(W/tw) × ceil(H/th)` as the primary formula — it overcounts when
identical remainders share a source tile.

---

## Tile orientation

Non-square tiles support two orientations:

| Control label (example 30×60) | Mapping |
|-------------------------------|---------|
| ↔ 60×30 | larger side along surface width |
| ↕ 30×60 | larger side along surface height |

The domain computes **both** alternatives for comparison. The UI may mark the cheaper
one as **«Экономичнее»** but must **not** silently override an explicit user choice.

Square tiles: no orientation control (orientations are identical).

---

## Floors vs walls vs multiple walls

- **Floor:** one rectangle (`length × width`).
- **Single wall:** one rectangle (`width × height`).
- **Multiple walls:** each wall is calculated separately; base tiles are **summed**.
  **No cross-wall offcut reuse** in Phase 3B.

New wall UX: when the user adds a wall, inherit dimensions from the previous wall
(width and height) so fields are not empty.

---

## Openings

Openings (door / window / other) remain UX-typed but mathematically equal.

- Incomplete `0 × 0` openings are ignored.
- Openings area &gt; wall area → validation error.
- **With openings:** quantity uses **area estimate** on
  `effectiveArea = wallArea − openingsArea` (ceil division by tile area), because
  openings are not assigned to a specific wall edge and exact strip geometry around
  openings is out of scope.
- Visualization may still show schematic opening rectangles on walls.
- The app must **not** claim exact tile-by-tile cutting around openings.

---

## Diagonal / offset layouts

| Pattern | Quantity | Recommended reserve |
|---------|----------|---------------------|
| straight | layout-aware (when no openings) | 10% |
| diagonal | area estimate | 15% |
| offset 1/2 | area estimate | 10% |
| offset 1/3 | area estimate | 10% |

Area estimate:

```text
baseLayoutTiles = ceil(effectiveArea / tileArea)
finalRequiredTiles = ceil(baseLayoutTiles × (1 + reservePercent / 100))
```

No hidden extra layout coefficient. User-edited reserve is the reserve actually used.
Explanation states that diagonal/offset quantity is estimated.

---

## Packaging & pricing

Operate on **finalRequiredTiles** (after reserve):

```text
layout → reserve → required tiles → package rounding → purchased → remainder
```

- Tiles per box: `boxes = ceil(finalRequiredTiles / tilesPerBox)`.
- m² per box: `requiredAreaWithReserve = finalRequiredTiles × tileArea`;
  `boxes = ceil(requiredAreaWithReserve / boxArea)`.
- Price per tile / box / m² unchanged in structure; regression-tested after Phase 3B.

Currency code remains independent of the ₽ display symbol.

---

## Visualization semantics

A compact schematic (not CAD):

- Proportional surface outline.
- Representative grid (bounded density — never one React node per physical tile).
- Full vs edge regions for straight layout.
- Tile orientation.
- Schematic openings.
- Diagonal / offset indicated visually without becoming calculation truth.

Prefer placement near the result / «Как рассчитано».

---

## Input

Accept `4`, `4.5`, `4,5`. Keep editable strings (`4,`, `0,`, empty). Normalize on parse.

Canonical domain lengths: **integer millimeters**.

---

## Non-goals (still)

No 2D editor, AR, exact opening optimizer, L-shape engine, general 2D cutting-stock,
cross-room bin packing, grout/adhesive, mixed tile sizes, weight, delivery.

---

## Acceptance / reference cases

### Legacy Phase 0 area cases

Several early cases expected area-only `ceil(area/tile)`. Under Phase 3B **straight**
layout those expectations **intentionally change** when remainders exist (see
`docs/DECISIONS.md`). Tests are updated with justification.

### Phase 3B reference cases

| ID | Setup | Expected base (0% reserve) |
|----|--------|----------------------------|
| A | 300×270 cm, 10×10 | 810 |
| B | 300×275 cm, 10×10 | 825 (810 + 15 edge sources) |
| C | edge 40 cm from tile 60 cm | `piecesPerTile = 1` |
| D | 30×60 vs 60×30 on a chosen surface | different bases; cheaper flagged |
| E | 310×275 cm, 60×60 | conservative corner policy |
| F | two walls | separate layouts, sum |
| G | reserve after layout | no hidden multiplier |
| H–I | packaging / price | use final required tiles |
| J | square tile | no meaningful dual orientation |

Implemented in Jest under `src/domain/tile/__tests__/`.
