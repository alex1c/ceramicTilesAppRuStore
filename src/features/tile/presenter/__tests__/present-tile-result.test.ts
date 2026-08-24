import { presentTileResult } from '../present-tile-result'
import { calculateTiles } from '@/domain/tile'
import { floorInput } from '@/domain/tile/fixtures/builders'

describe('presentTileResult', () => {
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
		expect(presented.details.some((line) => line.includes('37'))).toBe(true)
	})
})
