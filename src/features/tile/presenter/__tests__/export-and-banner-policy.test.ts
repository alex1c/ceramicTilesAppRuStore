import { calculateTiles } from '@/domain/tile'
import { floorInput } from '@/domain/tile/fixtures/builders'
import { formatExportPdfHtml, formatExportTextReport } from '@/export'
import { buildTileExportReport } from '@/features/tile/presenter/build-tile-export-report'
import { presentTileResult } from '@/features/tile/presenter/present-tile-result'
import { setLocale } from '@/i18n'
import {
	isBannerPlacementEnabled,
	TILE_V1_ACTIVE_BANNER_PLACEMENT,
} from '@/config/ads-config'

describe('tile export + single-banner policy', () => {
	beforeEach(() => {
		setLocale('ru')
	})

	it('builds ExportReport from domain+presenter without recalculation', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 10 },
			}),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		const report = buildTileExportReport(outcome.result, presented)
		const text = formatExportTextReport(report)
		const html = formatExportPdfHtml(report)

		expect(report.title).toContain('плитки')
		expect(text).toContain(presented.heroValue)
		expect(text).toContain('По раскладке')
		expect(html).toContain(report.title)
		expect(html).not.toContain('<script')
	})

	it('clears disabled packaging/price sections by omitting absent data', () => {
		const outcome = calculateTiles(floorInput({ reservePercent: 0 }))
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}
		const presented = presentTileResult(outcome.result)
		const report = buildTileExportReport(outcome.result, presented)
		const text = formatExportTextReport(report)
		expect(text).not.toContain('упаков')
		expect(text).not.toContain('Стоимость')
	})

	it('enforces Tile v1 one-banner placement policy', () => {
		expect(TILE_V1_ACTIVE_BANNER_PLACEMENT).toBe('result_banner')
		expect(isBannerPlacementEnabled('result_banner')).toBe(true)
		expect(isBannerPlacementEnabled('footer_banner')).toBe(false)
	})
})
