/**
 * Layout patterns supported in v1.0.
 * These do not simulate physical placement; they only recommend reserve percent.
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
	rawTiles: number
	reservePercent: number
	tilesBeforeCeil: number
	tilesWithReserve: number
	layoutPattern: LayoutPatternId
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
	rawTiles: number
	tilesWithReserve: number
	requiredAreaWithReserveM2: number
	packaging: PackagingResult | null
	price: PriceResult | null
	trace: ExplanationTrace
}

export type TileCalculationOutcome =
	| { ok: true; result: TileCalculationResult }
	| { ok: false; error: TileCalculationError }
