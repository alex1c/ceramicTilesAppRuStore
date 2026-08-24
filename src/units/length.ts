/**
 * Canonical length unit for the calculation domain.
 * All domain math uses integer millimeters to keep surface and tile sizes aligned.
 */
export type Millimeters = number & { readonly __brand: 'Millimeters' }

/** Square millimeters — area canonical unit derived from integer lengths. */
export type SquareMillimeters = number & { readonly __brand: 'SquareMillimeters' }

/** Converts meters to canonical millimeters (nearest mm). */
export function metersToMillimeters(value: number): Millimeters {
	return Math.round(value * 1000) as Millimeters
}

/** Converts centimeters to canonical millimeters (nearest mm). */
export function centimetersToMillimeters(value: number): Millimeters {
	return Math.round(value * 10) as Millimeters
}

/** Converts millimeters back to meters for traces and presenters. */
export function millimetersToMeters(value: Millimeters): number {
	return value / 1000
}

/** Converts millimeters back to centimeters for traces and presenters. */
export function millimetersToCentimeters(value: Millimeters): number {
	return value / 10
}

/** Rectangular area in square millimeters. */
export function rectangleAreaMm(
	widthMm: Millimeters,
	heightMm: Millimeters,
): SquareMillimeters {
	return (widthMm * heightMm) as SquareMillimeters
}

/** Converts square millimeters to square meters without UI rounding. */
export function squareMillimetersToSquareMeters(areaMm2: SquareMillimeters): number {
	return areaMm2 / 1_000_000
}
