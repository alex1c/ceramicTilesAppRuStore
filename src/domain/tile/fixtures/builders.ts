import type { OpeningDimensions, TileCalculationInput, WallDimensions } from '../types'

/** Shared floor used by several acceptance cases. */
export function floorInput(
	overrides: Partial<TileCalculationInput> & {
		lengthM?: number
		widthM?: number
		tileWidthCm?: number
		tileHeightCm?: number
		reservePercent?: number
	} = {},
): TileCalculationInput {
return {
		surface: {
			kind: 'floor',
			lengthM: overrides.lengthM ?? 4,
			widthM: overrides.widthM ?? 3,
		},
		tileWidthCm: overrides.tileWidthCm ?? 60,
		tileHeightCm: overrides.tileHeightCm ?? 60,
		orientation: overrides.orientation ?? 'as-entered',
		layoutPattern: overrides.layoutPattern ?? 'straight',
		reservePercent: overrides.reservePercent ?? 0,
		packaging: overrides.packaging ?? { enabled: false },
		pricing: overrides.pricing ?? { enabled: false },
	}
}

export function wallsInput(
	walls: WallDimensions[],
	openings: OpeningDimensions[] = [],
	overrides: Partial<TileCalculationInput> = {},
): TileCalculationInput {
	return {
		surface: {
			kind: 'walls',
			walls,
			openings,
		},
		tileWidthCm: overrides.tileWidthCm ?? 60,
		tileHeightCm: overrides.tileHeightCm ?? 60,
		orientation: overrides.orientation ?? 'as-entered',
		layoutPattern: overrides.layoutPattern ?? 'straight',
		reservePercent: overrides.reservePercent ?? 0,
		packaging: overrides.packaging ?? { enabled: false },
		pricing: overrides.pricing ?? { enabled: false },
	}
}
