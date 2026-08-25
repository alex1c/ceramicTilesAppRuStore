import { pluralizeRu, formatCountNoun } from '../pluralize'
import { presentTileResult } from '../../features/tile/presenter/present-tile-result'
import { calculateTiles } from '@/domain/tile'
import { floorInput, wallsInput } from '@/domain/tile/fixtures/builders'
import { setLocale } from '@/i18n'

describe('pluralizeRu', () => {
	const cases: [number, string][] = [
		[1, 'плитка'],
		[2, 'плитки'],
		[3, 'плитки'],
		[4, 'плитки'],
		[5, 'плиток'],
		[11, 'плиток'],
		[12, 'плиток'],
		[13, 'плиток'],
		[14, 'плиток'],
		[21, 'плитка'],
		[22, 'плитки'],
		[24, 'плитки'],
		[25, 'плиток'],
		[31, 'плитка'],
		[41, 'плитка'],
		[101, 'плитка'],
		[111, 'плиток'],
		[112, 'плиток'],
	]

	it.each(cases)('tiles: %i → %s', (count, expected) => {
		expect(pluralizeRu(count, 'плитка', 'плитки', 'плиток')).toBe(expected)
	})

	const boxCases: [number, string][] = [
		[1, 'упаковка'],
		[2, 'упаковки'],
		[4, 'упаковки'],
		[5, 'упаковок'],
		[11, 'упаковок'],
		[21, 'упаковка'],
		[22, 'упаковки'],
		[25, 'упаковок'],
	]

	it.each(boxCases)('boxes: %i → %s', (count, expected) => {
		expect(pluralizeRu(count, 'упаковка', 'упаковки', 'упаковок')).toBe(expected)
	})

	it('formatCountNoun joins number and form', () => {
		expect(formatCountNoun(41, 'плитка', 'плитки', 'плиток', 'ru')).toBe('41 плитка')
		expect(formatCountNoun(11, 'упаковка', 'упаковки', 'упаковок', 'ru')).toBe(
			'11 упаковок',
		)
	})
})

describe('presentTileResult quantity-mode labels', () => {
	beforeEach(() => {
		setLocale('ru')
	})

	it('straight floor → По раскладке', () => {
		const outcome = calculateTiles(floorInput({ reservePercent: 10 }))
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		expect(outcome.result.layout.quantityMode).toBe('layout-straight')
		expect(presented.details[0]).toMatch(/^По раскладке:/)
		expect(presented.details[0]).toContain('35')
		expect(presented.details.some((line) => line.startsWith('Итого:'))).toBe(false)
		expect(presented.details.some((line) => line.includes('Требуется'))).toBe(false)
		expect(presented.heroUnit).toBe('плиток') // 39 accusative many
	})

	it('opening → По площади', () => {
		const outcome = calculateTiles(
			wallsInput(
				[{ widthM: 3, heightM: 2.7 }],
				[{ kind: 'door', widthM: 0.8, heightM: 2 }],
				{ tileWidthCm: 60, tileHeightCm: 30, reservePercent: 10 },
			),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		expect(outcome.result.layout.quantityMode).toBe('area-estimate')
		expect(presented.details[0]).toMatch(/^По площади:/)
	})

	it('diagonal → По площади', () => {
		const outcome = calculateTiles(
			floorInput({ layoutPattern: 'diagonal', reservePercent: 15 }),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		expect(presented.details[0]).toMatch(/^По площади:/)
	})

	it('offset-half → По площади', () => {
		const outcome = calculateTiles(
			floorInput({ layoutPattern: 'offset-half', reservePercent: 10 }),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(presentTileResult(outcome.result).details[0]).toMatch(/^По площади:/)
	})

	it('offset-third → По площади', () => {
		const outcome = calculateTiles(
			floorInput({ layoutPattern: 'offset-third', reservePercent: 10 }),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(presentTileResult(outcome.result).details[0]).toMatch(/^По площади:/)
	})

	it('does not duplicate the no-package hero in details', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 3,
				widthM: 2.75,
				tileWidthCm: 10,
				tileHeightCm: 10,
				reservePercent: 0,
			}),
		)
		// 825 tiles — many form
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		const presented = presentTileResult(outcome.result)
		expect(presented.details.some((l) => l.startsWith('Итого:'))).toBe(false)
	})

	it('packaging hero uses correct box plural and omits duplicate required line', () => {
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
		expect(presented.heroUnit).toBe('упаковок')
		expect(presented.details.some((line) => line.includes('Требуется'))).toBe(false)
		expect(presented.details.some((line) => line.startsWith('Итого:'))).toBe(true)
	})
})
