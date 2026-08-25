/**
 * Builds ExportReport from already-computed Tile domain + presented models.
 * No domain recalculation — Share/PDF consume this DTO only.
 */
import type { TileCalculationResult } from '@/domain/tile'
import type { ExportReport } from '@/export'
import { formatAreaM2, formatNumber, t } from '@/i18n'
import type { PresentedTileResult } from './present-tile-result'

function layoutLabel(result: TileCalculationResult): string {
	const layout = t().calculator.layout
	switch (result.layout.layoutPattern) {
		case 'straight':
			return layout.straight
		case 'diagonal':
			return layout.diagonal
		case 'offset-half':
			return layout.offsetHalf
		case 'offset-third':
			return layout.offsetThird
		default:
			return layout.straight
	}
}

function orientationLabel(result: TileCalculationResult): string | null {
	if (result.layout.orientationOptions.length === 0) {
		return null
	}
	const w = formatNumber(result.layout.orientedTileWidthMm / 10, {
		maximumFractionDigits: 2,
	})
	const h = formatNumber(result.layout.orientedTileHeightMm / 10, {
		maximumFractionDigits: 2,
	})
	return `${w}×${h} см`
}

/**
 * Maps TileCalculationResult + PresentedTileResult → shared ExportReport.
 */
export function buildTileExportReport(
	result: TileCalculationResult,
	presented: PresentedTileResult,
): ExportReport {
	const share = t().calculator.share
	const calc = t().calculator
	const sections: ExportReport['sections'] = []

	// Surface
	const surfaceLines: string[] = []
	if (
		result.trace.surfaceKind === 'floor' &&
		result.trace.floorLengthM !== null &&
		result.trace.floorWidthM !== null
	) {
		surfaceLines.push(
			`${calc.surface.floor}: ${formatNumber(result.trace.floorLengthM, { maximumFractionDigits: 2 })} × ${formatNumber(result.trace.floorWidthM, { maximumFractionDigits: 2 })} ${calc.units.meters}`,
		)
	} else {
		surfaceLines.push(
			`${calc.surface.walls}: ${formatAreaM2(result.trace.surfaceAreaM2)}`,
		)
	}
	if (result.trace.openingsAreaM2 > 0) {
		surfaceLines.push(
			`${calc.openings.title}: ${formatAreaM2(result.trace.openingsAreaM2)}`,
		)
	}
	surfaceLines.push(
		`${calc.result.surfaceArea.replace('{area}', formatAreaM2(result.effectiveAreaM2))}`,
	)
	sections.push({ heading: share.sections.surface, lines: surfaceLines })

	// Tile
	const tileLines: string[] = [
		`${calc.tile.title}: ${formatNumber(result.layout.orientedTileWidthMm / 10, { maximumFractionDigits: 2 })} × ${formatNumber(result.layout.orientedTileHeightMm / 10, { maximumFractionDigits: 2 })} ${calc.units.centimeters}`,
		`${calc.layout.title}: ${layoutLabel(result)}`,
	]
	const orientation = orientationLabel(result)
	if (orientation) {
		tileLines.push(`${calc.tile.orientationTitle}: ${orientation}`)
	}
	tileLines.push(
		`${calc.reserve.title}: ${formatNumber(result.trace.reservePercent)}%`,
	)
	sections.push({ heading: share.sections.tile, lines: tileLines })

	// Result — reuse already-presented detail lines + hero
	const resultLines: string[] = [
		`${presented.heroHeading}: ${presented.heroValue} ${presented.heroUnit}`.trim(),
		...presented.details,
	]
	if (presented.pricePrinciple) {
		resultLines.push(presented.pricePrinciple)
	}
	sections.push({ heading: share.sections.result, lines: resultLines })

	if (presented.phaseNote) {
		sections.push({
			heading: share.sections.note,
			lines: [presented.phaseNote],
		})
	}

	return {
		title: share.reportTitle,
		sections,
		footerNote: share.footer,
	}
}
