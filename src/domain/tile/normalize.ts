import type { OpeningDimensions, TileCalculationInput } from './types'

/**
 * Drops incomplete openings (zero width or zero height) so `0 × 0` never
 * participates in area math and cannot crash the engine.
 */
export function normalizeTileInput(input: TileCalculationInput): TileCalculationInput {
	if (input.surface.kind !== 'walls') {
		return input
	}

	const openings = input.surface.openings.filter((opening) => isCompleteOpening(opening))

	return {
		...input,
		surface: {
			...input.surface,
			openings,
		},
	}
}

function isCompleteOpening(opening: OpeningDimensions): boolean {
	return (
		Number.isFinite(opening.widthM) &&
		Number.isFinite(opening.heightM) &&
		opening.widthM > 0 &&
		opening.heightM > 0
	)
}
