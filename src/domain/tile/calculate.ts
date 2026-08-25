import { ceilPhysicalCount, roundMoney } from './math'
import { calculateRectLayout } from './layout-rect'
import { normalizeTileInput } from './normalize'
import type {
	ExplanationTrace,
	LayoutCalculationSummary,
	OrientationComparison,
	PackagingResult,
	PriceResult,
	QuantityMode,
	SurfaceLayoutPanel,
	TileCalculationInput,
	TileCalculationOutcome,
	TileCalculationResult,
	TileOrientationId,
} from './types'
import { validateTileInput } from './validate'
import {
	centimetersToMillimeters,
	metersToMillimeters,
	rectangleAreaMm,
	squareMillimetersToSquareMeters,
} from '@/units/length'

/**
 * Public calculation entry: normalize → validate → calculate.
 * React components must call this instead of duplicating formulas.
 */
export function calculateTiles(input: TileCalculationInput): TileCalculationOutcome {
	const normalized = normalizeTileInput(input)
	const validation = validateTileInput(normalized)

	if (!validation.ok) {
		return validation
	}

	return { ok: true, result: computeTiles(normalized) }
}

/**
 * Phase 3B quantity pipeline:
 * layout (or area estimate) → reserve → final tiles → packaging / price.
 * Reserve is never a hidden layout multiplier.
 */
function computeTiles(input: TileCalculationInput): TileCalculationResult {
	const { effectiveAreaMm2, openingsAreaMm2, surfaceAreaMm2 } = computeSurfaceAreas(input)
	const enteredWidthMm = centimetersToMillimeters(input.tileWidthCm)
	const enteredHeightMm = centimetersToMillimeters(input.tileHeightCm)
	const tileAreaMm2 = rectangleAreaMm(enteredWidthMm, enteredHeightMm)
	const isSquareTile = enteredWidthMm === enteredHeightMm
	const orientation: TileOrientationId = isSquareTile ? 'as-entered' : input.orientation
	const oriented = orientTile(enteredWidthMm, enteredHeightMm, orientation)

	const effectiveAreaM2 = squareMillimetersToSquareMeters(effectiveAreaMm2)
	const tileAreaM2 = squareMillimetersToSquareMeters(tileAreaMm2)
	const rawTiles = tileAreaMm2 > 0 ? effectiveAreaMm2 / tileAreaMm2 : 0
	const openingsAreaM2 = squareMillimetersToSquareMeters(openingsAreaMm2)
	const openingsEstimated = openingsAreaMm2 > 0
	const useLayout =
		input.layoutPattern === 'straight' && !openingsEstimated

	/*
	 * Always build rectangle panels for the visual scheme.
	 * Quantity uses them only for straight layouts without openings.
	 */
	const panels = buildLayoutPanels(input, oriented.widthMm, oriented.heightMm)

	const orientationOptions = isSquareTile
		? []
		: buildOrientationOptions(input, enteredWidthMm, enteredHeightMm)

	let baseLayoutTileCount: number
	let quantityMode: QuantityMode

	if (useLayout) {
		quantityMode = 'layout-straight'
		baseLayoutTileCount = panels.reduce(
			(sum, panel) => sum + panel.rect.baseLayoutTileCount,
			0,
		)
	} else {
		quantityMode = 'area-estimate'
		baseLayoutTileCount =
			effectiveAreaMm2 > 0 ? Math.max(1, ceilPhysicalCount(rawTiles)) : 0
	}

	const reserveFactor = 1 + input.reservePercent / 100
	const tilesBeforeCeil = baseLayoutTileCount * reserveFactor
	const ceiledWithReserve = ceilPhysicalCount(tilesBeforeCeil)
	const tilesWithReserve =
		baseLayoutTileCount > 0 ? Math.max(1, ceiledWithReserve) : 0
	const reserveTileCount = Math.max(0, tilesWithReserve - baseLayoutTileCount)
	/*
	 * Packaging / per-m² price use tile-count × tile area so layout quantity
	 * and purchased area stay consistent (Phase 3B).
	 */
	const requiredAreaWithReserveM2 = tilesWithReserve * tileAreaM2

	const packaging = computePackaging(
		input,
		tilesWithReserve,
		requiredAreaWithReserveM2,
		tileAreaM2,
	)
	const price = computePrice(
		input,
		tilesWithReserve,
		requiredAreaWithReserveM2,
		tileAreaM2,
		packaging,
	)

	const schemeOpenings =
		input.surface.kind === 'walls'
			? input.surface.openings.map((opening) => ({
					kind: opening.kind,
					widthM: opening.widthM,
					heightM: opening.heightM,
				}))
			: []

	const layout: LayoutCalculationSummary = {
		quantityMode,
		orientation,
		isSquareTile,
		orientedTileWidthMm: oriented.widthMm,
		orientedTileHeightMm: oriented.heightMm,
		panels,
		orientationOptions,
		baseLayoutTileCount,
		reservePercent: input.reservePercent,
		reserveTileCount,
		finalRequiredTiles: tilesWithReserve,
		openingsEstimated,
		openingsAreaM2,
		layoutPattern: input.layoutPattern,
		schemeOpenings,
	}

	const trace: ExplanationTrace = {
		surfaceKind: input.surface.kind,
		floorLengthM: input.surface.kind === 'floor' ? input.surface.lengthM : null,
		floorWidthM: input.surface.kind === 'floor' ? input.surface.widthM : null,
		wallCount: input.surface.kind === 'walls' ? input.surface.walls.length : 0,
		surfaceAreaM2: squareMillimetersToSquareMeters(surfaceAreaMm2),
		openingsAreaM2,
		effectiveAreaM2,
		tileWidthCm: input.tileWidthCm,
		tileHeightCm: input.tileHeightCm,
		tileAreaM2,
		rawTiles,
		reservePercent: input.reservePercent,
		baseLayoutTileCount,
		reserveTileCount,
		tilesBeforeCeil,
		tilesWithReserve,
		layoutPattern: input.layoutPattern,
		quantityMode,
		orientation,
		openingsEstimated,
	}

	return {
		effectiveAreaM2,
		tileAreaM2,
		rawTiles,
		baseLayoutTileCount,
		reserveTileCount,
		tilesWithReserve,
		requiredAreaWithReserveM2,
		packaging,
		price,
		layout,
		trace,
	}
}

function orientTile(
	widthMm: number,
	heightMm: number,
	orientation: TileOrientationId,
): { widthMm: number; heightMm: number } {
	if (orientation === 'rotated') {
		return { widthMm: heightMm, heightMm: widthMm }
	}

	return { widthMm, heightMm }
}

function buildLayoutPanels(
	input: TileCalculationInput,
	tileWidthMm: number,
	tileHeightMm: number,
): SurfaceLayoutPanel[] {
	if (input.surface.kind === 'floor') {
		const rect = calculateRectLayout({
			surfaceWidthMm: metersToMillimeters(input.surface.lengthM),
			surfaceHeightMm: metersToMillimeters(input.surface.widthM),
			tileWidthMm,
			tileHeightMm,
		})

		return [
			{
				id: 'floor',
				labelKind: 'floor',
				wallIndex: null,
				rect,
			},
		]
	}

	return input.surface.walls.map((wall, index) => ({
		id: `wall-${index}`,
		labelKind: 'wall' as const,
		wallIndex: index,
		rect: calculateRectLayout({
			surfaceWidthMm: metersToMillimeters(wall.widthM),
			surfaceHeightMm: metersToMillimeters(wall.heightM),
			tileWidthMm,
			tileHeightMm,
		}),
	}))
}

/**
 * Compare both orientations using the same surface set (no openings / straight only).
 * When openings or non-straight patterns force area mode, still compare layout
 * geometry on the rectangles so the UI can show economical orientation hints
 * for straight re-selection; for area modes both orientations share the same
 * base count (tile area is invariant), so isEconomical is false for both.
 */
function buildOrientationOptions(
	input: TileCalculationInput,
	enteredWidthMm: number,
	enteredHeightMm: number,
): OrientationComparison[] {
	const openingsEstimated =
		input.surface.kind === 'walls' &&
		input.surface.openings.some((o) => o.widthM > 0 && o.heightM > 0)
	const useLayout = input.layoutPattern === 'straight' && !openingsEstimated

	const asEntered = sumBaseForOrientation(
		input,
		enteredWidthMm,
		enteredHeightMm,
		useLayout,
	)
	const rotated = sumBaseForOrientation(
		input,
		enteredHeightMm,
		enteredWidthMm,
		useLayout,
	)

	const minBase = Math.min(asEntered, rotated)
	const bothEqual = asEntered === rotated

	return [
		{
			orientation: 'as-entered',
			tileWidthMm: enteredWidthMm,
			tileHeightMm: enteredHeightMm,
			baseLayoutTileCount: asEntered,
			isEconomical: !bothEqual && asEntered === minBase,
		},
		{
			orientation: 'rotated',
			tileWidthMm: enteredHeightMm,
			tileHeightMm: enteredWidthMm,
			baseLayoutTileCount: rotated,
			isEconomical: !bothEqual && rotated === minBase,
		},
	]
}

function sumBaseForOrientation(
	input: TileCalculationInput,
	tileWidthMm: number,
	tileHeightMm: number,
	useLayout: boolean,
): number {
	if (!useLayout) {
		const { effectiveAreaMm2 } = computeSurfaceAreas(input)
		const tileAreaMm2 = rectangleAreaMm(
			centimetersToMillimeters(input.tileWidthCm),
			centimetersToMillimeters(input.tileHeightCm),
		)
		const raw = tileAreaMm2 > 0 ? effectiveAreaMm2 / tileAreaMm2 : 0
		return effectiveAreaMm2 > 0 ? Math.max(1, ceilPhysicalCount(raw)) : 0
	}

	return buildLayoutPanels(input, tileWidthMm, tileHeightMm).reduce(
		(sum, panel) => sum + panel.rect.baseLayoutTileCount,
		0,
	)
}

function computeSurfaceAreas(input: TileCalculationInput): {
	surfaceAreaMm2: ReturnType<typeof rectangleAreaMm>
	openingsAreaMm2: ReturnType<typeof rectangleAreaMm>
	effectiveAreaMm2: ReturnType<typeof rectangleAreaMm>
} {
	if (input.surface.kind === 'floor') {
		const area = rectangleAreaMm(
			metersToMillimeters(input.surface.lengthM),
			metersToMillimeters(input.surface.widthM),
		)

		return {
			surfaceAreaMm2: area,
			openingsAreaMm2: 0 as typeof area,
			effectiveAreaMm2: area,
		}
	}

	const surfaceAreaMm2 = input.surface.walls.reduce((sum, wall) => {
		const area = rectangleAreaMm(
			metersToMillimeters(wall.widthM),
			metersToMillimeters(wall.heightM),
		)
		return (sum + area) as typeof area
	}, 0 as ReturnType<typeof rectangleAreaMm>)

	const openingsAreaMm2 = input.surface.openings.reduce((sum, opening) => {
		const area = rectangleAreaMm(
			metersToMillimeters(opening.widthM),
			metersToMillimeters(opening.heightM),
		)
		return (sum + area) as typeof area
	}, 0 as ReturnType<typeof rectangleAreaMm>)

	const effectiveAreaMm2 = (surfaceAreaMm2 - openingsAreaMm2) as typeof surfaceAreaMm2

	return { surfaceAreaMm2, openingsAreaMm2, effectiveAreaMm2 }
}

function computePackaging(
	input: TileCalculationInput,
	tilesWithReserve: number,
	requiredAreaWithReserveM2: number,
	tileAreaM2: number,
): PackagingResult | null {
	if (!input.packaging.enabled) {
		return null
	}

	if (input.packaging.mode === 'tiles-per-box') {
		const tilesPerBox = input.packaging.tilesPerBox
		const boxes = ceilPhysicalCount(tilesWithReserve / tilesPerBox)
		const purchasedTiles = boxes * tilesPerBox
		const purchasedAreaM2 = purchasedTiles * tileAreaM2

		return {
			mode: 'tiles-per-box',
			boxes,
			tilesPerBox,
			boxAreaM2: null,
			purchasedTiles,
			purchasedAreaM2,
			remainingTiles: purchasedTiles - tilesWithReserve,
			remainingAreaM2: purchasedAreaM2 - requiredAreaWithReserveM2,
		}
	}

	const boxAreaM2 = input.packaging.boxAreaM2
	const boxes = ceilPhysicalCount(requiredAreaWithReserveM2 / boxAreaM2)
	const purchasedAreaM2 = boxes * boxAreaM2

	return {
		mode: 'area-per-box',
		boxes,
		tilesPerBox: null,
		boxAreaM2,
		purchasedTiles: null,
		purchasedAreaM2,
		remainingTiles: null,
		remainingAreaM2: purchasedAreaM2 - requiredAreaWithReserveM2,
	}
}

function computePrice(
	input: TileCalculationInput,
	tilesWithReserve: number,
	requiredAreaWithReserveM2: number,
	tileAreaM2: number,
	packaging: PackagingResult | null,
): PriceResult | null {
	if (!input.pricing.enabled) {
		return null
	}

	const { mode, amount, currencyCode } = input.pricing
	let total = 0

	if (mode === 'per-tile') {
		const tilesToBuy = packaging
			? (packaging.purchasedTiles ??
				ceilPhysicalCount(packaging.purchasedAreaM2 / tileAreaM2))
			: tilesWithReserve
		total = tilesToBuy * amount
	} else if (mode === 'per-box') {
		total = (packaging?.boxes ?? 0) * amount
	} else if (packaging) {
		total = packaging.purchasedAreaM2 * amount
	} else {
		total = requiredAreaWithReserveM2 * amount
	}

	return {
		mode,
		currencyCode,
		unitAmount: amount,
		total: roundMoney(total),
	}
}
