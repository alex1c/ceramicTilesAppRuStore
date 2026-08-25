/** Staggers tile joints inside a row; surface/opening layers never use this. */
export function buildOffsetVerticalRatios(
	vertical: number[],
	rowIndex: number,
	offsetFraction: number,
	colSlots: number,
): number[] {
	const shift = rowIndex % 2 === 1 ? offsetFraction / Math.max(1, colSlots) : 0
	return vertical.map((ratio) => (ratio + shift) % 1)
}
