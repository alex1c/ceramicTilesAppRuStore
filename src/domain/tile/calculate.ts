import { ceilPhysicalCount, roundMoney } from './math'
import { normalizeTileInput } from './normalize'
import type {
	PackagingResult,
	PriceResult,
	TileCalculationInput,
	TileCalculationOutcome,
	TileCalculationResult,
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
 * Fixed v1.0 formula:
 * `tilesWithReserve = ceil(rawTiles × (1 + reservePercent / 100))`
 * Reserve is never applied on top of an already-ceiled tile count.
 */
function computeTiles(input: TileCalculationInput): TileCalculationResult {
	const { effectiveAreaMm2, openingsAreaMm2, surfaceAreaMm2 } = computeSurfaceAreas(input)
	const tileWidthMm = centimetersToMillimeters(input.tileWidthCm)
	const tileHeightMm = centimetersToMillimeters(input.tileHeightCm)
	const tileAreaMm2 = rectangleAreaMm(tileWidthMm, tileHeightMm)

	const effectiveAreaM2 = squareMillimetersToSquareMeters(effectiveAreaMm2)
	const tileAreaM2 = squareMillimetersToSquareMeters(tileAreaMm2)
	const rawTiles = effectiveAreaMm2 / tileAreaMm2
	const reserveFactor = 1 + input.reservePercent / 100
	const tilesBeforeCeil = rawTiles * reserveFactor
	const ceiledTiles = ceilPhysicalCount(tilesBeforeCeil)
	const tilesWithReserve = effectiveAreaMm2 > 0 ? Math.max(1, ceiledTiles) : 0
	const requiredAreaWithReserveM2 = effectiveAreaM2 * reserveFactor

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

	return {
		effectiveAreaM2,
		tileAreaM2,
		rawTiles,
		tilesWithReserve,
		requiredAreaWithReserveM2,
		packaging,
		price,
		trace: {
			surfaceKind: input.surface.kind,
			floorLengthM: input.surface.kind === 'floor' ? input.surface.lengthM : null,
			floorWidthM: input.surface.kind === 'floor' ? input.surface.widthM : null,
			wallCount: input.surface.kind === 'walls' ? input.surface.walls.length : 0,
			surfaceAreaM2: squareMillimetersToSquareMeters(surfaceAreaMm2),
			openingsAreaM2: squareMillimetersToSquareMeters(openingsAreaMm2),
			effectiveAreaM2,
			tileWidthCm: input.tileWidthCm,
			tileHeightCm: input.tileHeightCm,
			tileAreaM2,
			rawTiles,
			reservePercent: input.reservePercent,
			tilesBeforeCeil,
			tilesWithReserve,
			layoutPattern: input.layoutPattern,
		},
	}
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
