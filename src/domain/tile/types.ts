import type { EdgeStripLayout, RectLayoutResult } from './layout-rect'

/**
 * Layout patterns supported in v1.0 / Phase 3B.
 * Straight uses geometric layout when openings are absent.
 * Diagonal / offset remain area estimates.
 */
export type LayoutPatternId =
	| 'straight'
	| 'diagonal'
	| 'offset-half'
	| 'offset-third'

export type SurfaceKind = 'floor' | 'walls'

export type OpeningKind = 'door' | 'window' | 'other'

export type PackagingMode = 'tiles-per-box' | 'area-per-box'

export type PriceMode = 'per-tile' | 'per-box' | 'per-m2'

/**
 * How the tile's entered width/height map onto the surface axes.
 * `as-entered`: tileWidth → surface width, tileHeight → surface height.
 * `rotated`: swapped.
 */
export type TileOrientationId = 'as-entered' | 'rotated'

/** How the base quantity was produced. */
export type QuantityMode =
	| 'layout-straight'
	| 'area-estimate'

/**
 * ISO 4217 currency code. Display symbols (₽) belong in the presenter, not here.
 */
export type CurrencyCode = string

export interface FloorSurfaceInput {
	kind: 'floor'
	lengthM: number
	widthM: number
}

export interface WallDimensions {
	widthM: number
	heightM: number
}

export interface OpeningDimensions {
	kind: OpeningKind
	widthM: number
	heightM: number
}

export interface WallsSurfaceInput {
	kind: 'walls'
	walls: WallDimensions[]
	openings: OpeningDimensions[]
}

export type SurfaceInput = FloorSurfaceInput | WallsSurfaceInput

export type PackagingInput =
	| { enabled: false }
	| { enabled: true; mode: 'tiles-per-box'; tilesPerBox: number }
	| { enabled: true; mode: 'area-per-box'; boxAreaM2: number }

export type PricingInput =
	| { enabled: false }
	| { enabled: true; mode: PriceMode; amount: number; currencyCode: CurrencyCode }

/**
 * Canonical calculation input after UI parsing.
 * Numbers are SI values (meters, centimeters, percent, money major units).
 */
export interface TileCalculationInput {
	surface: SurfaceInput
	tileWidthCm: number
	tileHeightCm: number
	/**
	 * Selected orientation for rectangular tiles.
	 * Ignored for square tiles (both orientations are identical).
	 */
	orientation: TileOrientationId
	layoutPattern: LayoutPatternId
	reservePercent: number
	packaging: PackagingInput
	pricing: PricingInput
}

export type TileCalculationErrorCode =
	| 'INVALID_DIMENSION'
	| 'INVALID_TILE_SIZE'
	| 'INVALID_RESERVE'
	| 'OPENINGS_EXCEED_WALLS'
	| 'INVALID_PACKAGING'
	| 'INVALID_PRICE'
	| 'PRICE_BOX_REQUIRES_PACKAGING'
	| 'NOT_FINITE'

export interface TileCalculationError {
	code: TileCalculationErrorCode
}

export interface OrientationComparison {
	orientation: TileOrientationId
	tileWidthMm: number
	tileHeightMm: number
	baseLayoutTileCount: number
	isEconomical: boolean
}

export interface SurfaceLayoutPanel {
	/** Stable id for UI keys — floor or wall index. */
	id: string
	labelKind: 'floor' | 'wall'
	wallIndex: number | null
	rect: RectLayoutResult
}

/**
 * Structured layout output consumed by explanation + visual scheme.
 * The React UI must not recalculate geometry from raw dimensions.
 */
/** Schematic opening for visualization only — not a cutting optimizer input. */
export interface SchemeOpening {
	kind: OpeningKind
	widthM: number
	heightM: number
}

export interface LayoutCalculationSummary {
	quantityMode: QuantityMode
	orientation: TileOrientationId
	isSquareTile: boolean
	/** Tile extents after applying orientation (mm). */
	orientedTileWidthMm: number
	orientedTileHeightMm: number
	panels: SurfaceLayoutPanel[]
	/** Both orientations when tile is non-square; empty for square. */
	orientationOptions: OrientationComparison[]
	baseLayoutTileCount: number
	reservePercent: number
	reserveTileCount: number
	finalRequiredTiles: number
	/** True when openings forced area estimate. */
	openingsEstimated: boolean
	openingsAreaM2: number
	/** Layout pattern echoed for the scheme (diagonal / offset visuals). */
	layoutPattern: LayoutPatternId
	/**
	 * Openings drawn schematically on the first wall panel.
	 * Positions are illustrative; quantity is not optimized around them.
	 */
	schemeOpenings: SchemeOpening[]
}

export interface ExplanationTrace {
	surfaceKind: SurfaceKind
	floorLengthM: number | null
	floorWidthM: number | null
	wallCount: number
	surfaceAreaM2: number
	openingsAreaM2: number
	effectiveAreaM2: number
	tileWidthCm: number
	tileHeightCm: number
	tileAreaM2: number
	/** Kept for area-estimate modes / packaging diagnostics. */
	rawTiles: number
	reservePercent: number
	baseLayoutTileCount: number
	reserveTileCount: number
	tilesBeforeCeil: number
	tilesWithReserve: number
	layoutPattern: LayoutPatternId
	quantityMode: QuantityMode
	orientation: TileOrientationId
	openingsEstimated: boolean
}

export interface PackagingResult {
	mode: PackagingMode
	boxes: number
	tilesPerBox: number | null
	boxAreaM2: number | null
	purchasedTiles: number | null
	purchasedAreaM2: number
	remainingTiles: number | null
	remainingAreaM2: number
}

export interface PriceResult {
	mode: PriceMode
	currencyCode: CurrencyCode
	unitAmount: number
	total: number
}

export interface TileCalculationResult {
	effectiveAreaM2: number
	tileAreaM2: number
	/** Area ratio (diagnostic); layout quantity may differ. */
	rawTiles: number
	baseLayoutTileCount: number
	reserveTileCount: number
	tilesWithReserve: number
	requiredAreaWithReserveM2: number
	packaging: PackagingResult | null
	price: PriceResult | null
	layout: LayoutCalculationSummary
	trace: ExplanationTrace
}

export type TileCalculationOutcome =
	| { ok: true; result: TileCalculationResult }
	| { ok: false; error: TileCalculationError }

export type { EdgeStripLayout, RectLayoutResult }
