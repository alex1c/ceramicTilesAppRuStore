import type { LayoutPatternId } from './types'

/**
 * Recommended waste percent for each layout.
 * This is a UX suggestion only — never applied as a hidden extra coefficient.
 */
export const RECOMMENDED_RESERVE_PERCENT: Record<LayoutPatternId, number> = {
	straight: 10,
	diagonal: 15,
	'offset-half': 10,
	'offset-third': 10,
}

export const TILE_PRESETS_CM: readonly { widthCm: number; heightCm: number }[] = [
	{ widthCm: 10, heightCm: 10 },
	{ widthCm: 20, heightCm: 20 },
	{ widthCm: 20, heightCm: 30 },
	{ widthCm: 25, heightCm: 40 },
	{ widthCm: 30, heightCm: 30 },
	{ widthCm: 30, heightCm: 60 },
	{ widthCm: 40, heightCm: 40 },
	{ widthCm: 45, heightCm: 45 },
	{ widthCm: 50, heightCm: 50 },
	{ widthCm: 60, heightCm: 60 },
	{ widthCm: 60, heightCm: 120 },
]

export const TILES_PER_BOX_PRESETS = [4, 6, 8, 10, 12] as const

export const RESERVE_PRESETS = [0, 5, 10, 15] as const

/** Default currency for RuStore v1.0. Symbol rendering stays in the presenter. */
export const DEFAULT_CURRENCY_CODE = 'RUB'

/** Upper bound for a single length in millimeters (~1000 m). */
export const MAX_LENGTH_MM = 1_000_000

/**
 * Treat values this close to an integer as exact so IEEE remainder
 * does not inflate `ceil(10.0000000002)` to 11 tiles.
 */
export const INTEGER_EPSILON = 1e-9
