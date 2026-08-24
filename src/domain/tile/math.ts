import { INTEGER_EPSILON } from './defaults'

/**
 * Rounds physical counts (tiles, boxes) up.
 * Values within {@link INTEGER_EPSILON} of an integer are treated as exact.
 */
export function ceilPhysicalCount(value: number): number {
	if (!Number.isFinite(value) || value <= 0) {
		return 0
	}

	const nearest = Math.round(value)

	if (Math.abs(value - nearest) < INTEGER_EPSILON) {
		return nearest
	}

	return Math.ceil(value)
}

/**
 * Rounds money to two decimal places using major currency units.
 * The domain never stores formatted UI strings.
 */
export function roundMoney(value: number): number {
	return Math.round(value * 100) / 100
}

/** Returns true when a numeric input is usable in calculation. */
export function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}
