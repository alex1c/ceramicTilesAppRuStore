import { presentTileResult } from '../present-tile-result'
import { calculateTiles } from '@/domain/tile'
import { floorInput } from '@/domain/tile/fixtures/builders'
import { setLocale } from '@/i18n'

describe('presentTileResult', () => {
	beforeEach(() => {
		setLocale('ru')
	})

	it('uses packaging as the hero result when boxes are enabled', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 4 },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		expect(presented.heroValue).toBe('10')
		// Phase 3B: layout base 35 → reserve → 39 required tiles
		expect(presented.details.some((line) => line.includes('39'))).toBe(true)
		expect(presented.layout.baseLayoutTileCount).toBe(35)
		expect(presented.details[0]).toMatch(/^По раскладке:/)
	})

	it('does not repeat the tile total below a no-packaging hero', () => {
		const outcome = calculateTiles(floorInput({ reservePercent: 10 }))

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) return

		const presented = presentTileResult(outcome.result)
		expect(presented.heroValue).toBe('39')
		expect(presented.details[0]).toContain('35')
		expect(presented.details[1]).toContain('+4')
		expect(presented.details).not.toContainEqual(expect.stringContaining('39'))
	})

	it('keeps the required tile total when packaging is the hero', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 4 },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) return

		const presented = presentTileResult(outcome.result)
		expect(presented.heroValue).toBe('10')
		expect(presented.details.filter((line) => line.includes('39'))).toHaveLength(1)
	})
})
