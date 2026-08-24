import { MAX_LENGTH_MM } from './defaults'
import { isFiniteNumber } from './math'
import type {
	TileCalculationError,
	TileCalculationInput,
	WallDimensions,
} from './types'
import { centimetersToMillimeters, metersToMillimeters } from '@/units/length'

export type ValidationOutcome =
	| { ok: true }
	| { ok: false; error: TileCalculationError }

/**
 * Validates canonical numeric input. Does not parse locale strings —
 * that belongs in the UI adapter.
 */
export function validateTileInput(input: TileCalculationInput): ValidationOutcome {
	if (!isPositiveLengthM(input.tileWidthCm / 100) || !isPositiveLengthM(input.tileHeightCm / 100)) {
		return fail('INVALID_TILE_SIZE')
	}

	const tileWidthMm = centimetersToMillimeters(input.tileWidthCm)
	const tileHeightMm = centimetersToMillimeters(input.tileHeightCm)

	if (tileWidthMm <= 0 || tileHeightMm <= 0) {
		return fail('INVALID_TILE_SIZE')
	}

	if (!isFiniteNumber(input.reservePercent) || input.reservePercent < 0) {
		return fail('INVALID_RESERVE')
	}

	if (input.surface.kind === 'floor') {
		if (!isPositiveLengthM(input.surface.lengthM) || !isPositiveLengthM(input.surface.widthM)) {
			return fail('INVALID_DIMENSION')
		}
	} else {
		if (!Array.isArray(input.surface.walls) || input.surface.walls.length < 1) {
			return fail('INVALID_DIMENSION')
		}

		for (const wall of input.surface.walls) {
			if (!isValidWall(wall)) {
				return fail('INVALID_DIMENSION')
			}
		}

		const wallArea = input.surface.walls.reduce(
			(sum, wall) => sum + wall.widthM * wall.heightM,
			0,
		)
		const openingsArea = input.surface.openings.reduce(
			(sum, opening) => sum + opening.widthM * opening.heightM,
			0,
		)

		if (!isFiniteNumber(wallArea) || !isFiniteNumber(openingsArea)) {
			return fail('NOT_FINITE')
		}

		if (openingsArea > wallArea) {
			return fail('OPENINGS_EXCEED_WALLS')
		}
	}

	if (input.packaging.enabled) {
		if (input.packaging.mode === 'tiles-per-box') {
			if (
				!Number.isInteger(input.packaging.tilesPerBox) ||
				input.packaging.tilesPerBox <= 0
			) {
				return fail('INVALID_PACKAGING')
			}
		} else if (!isFiniteNumber(input.packaging.boxAreaM2) || input.packaging.boxAreaM2 <= 0) {
			return fail('INVALID_PACKAGING')
		}
	}

	if (input.pricing.enabled) {
		if (!isFiniteNumber(input.pricing.amount) || input.pricing.amount < 0) {
			return fail('INVALID_PRICE')
		}

		if (input.pricing.mode === 'per-box' && !input.packaging.enabled) {
			return fail('PRICE_BOX_REQUIRES_PACKAGING')
		}
	}

	return { ok: true }
}

function isValidWall(wall: WallDimensions): boolean {
	return isPositiveLengthM(wall.widthM) && isPositiveLengthM(wall.heightM)
}

function isPositiveLengthM(value: number): boolean {
	if (!isFiniteNumber(value) || value <= 0) {
		return false
	}

	const mm = metersToMillimeters(value)
	return mm > 0 && mm <= MAX_LENGTH_MM
}

function fail(code: TileCalculationError['code']): ValidationOutcome {
	return { ok: false, error: { code } }
}
