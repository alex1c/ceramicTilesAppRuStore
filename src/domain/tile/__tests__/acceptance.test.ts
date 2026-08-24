import { calculateTiles } from '../calculate'
import { RECOMMENDED_RESERVE_PERCENT } from '../defaults'
import { floorInput, wallsInput } from '../fixtures/builders'
import { parseUserDecimalNumber } from '@/units/parse-decimal-input'

describe('tile calculator acceptance cases', () => {
	it('case 1 — basic floor, 0% reserve', () => {
		const outcome = calculateTiles(floorInput({ reservePercent: 0 }))

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(outcome.result.effectiveAreaM2).toBeCloseTo(12, 10)
		expect(outcome.result.tileAreaM2).toBeCloseTo(0.36, 10)
		expect(outcome.result.rawTiles).toBeCloseTo(100 / 3, 10)
		expect(outcome.result.tilesWithReserve).toBe(34)
	})

	it('case 2 — floor + 10% reserve', () => {
		const outcome = calculateTiles(floorInput({ reservePercent: 10 }))

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.tilesWithReserve).toBe(37)
		}
	})

	it('case 3 — packaging 4 tiles per box', () => {
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

		expect(outcome.result.tilesWithReserve).toBe(37)
		expect(outcome.result.packaging?.boxes).toBe(10)
		expect(outcome.result.packaging?.purchasedTiles).toBe(40)
		expect(outcome.result.packaging?.remainingTiles).toBe(3)
	})

	it('case 4 — price per box', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 4 },
				pricing: { enabled: true, mode: 'per-box', amount: 1890, currencyCode: 'RUB' },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.price?.total).toBe(18900)
		}
	})

	it('case 5 — price per tile without packaging', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				pricing: { enabled: true, mode: 'per-tile', amount: 250, currencyCode: 'RUB' },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.tilesWithReserve).toBe(37)
			expect(outcome.result.price?.total).toBe(9250)
		}
	})

	it('case 6 — price per m² without packaging', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				pricing: { enabled: true, mode: 'per-m2', amount: 1500, currencyCode: 'RUB' },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.requiredAreaWithReserveM2).toBeCloseTo(13.2, 10)
			expect(outcome.result.price?.total).toBe(19800)
		}
	})

	it('case 7 — single wall area', () => {
		const outcome = calculateTiles(wallsInput([{ widthM: 3, heightM: 2.7 }]))

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(8.1, 10)
		}
	})

	it('case 8 — multiple walls', () => {
		const outcome = calculateTiles(
			wallsInput([
				{ widthM: 3, heightM: 2.7 },
				{ widthM: 4, heightM: 2.7 },
			]),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(18.9, 10)
		}
	})

	it('case 9 — wall + door', () => {
		const outcome = calculateTiles(
			wallsInput(
				[{ widthM: 4, heightM: 2.7 }],
				[{ kind: 'door', widthM: 0.9, heightM: 2.0 }],
			),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(9.0, 10)
		}
	})

	it('case 10 — walls + door + window', () => {
		const outcome = calculateTiles(
			wallsInput(
				[
					{ widthM: 3, heightM: 2.7 },
					{ widthM: 4, heightM: 2.7 },
				],
				[
					{ kind: 'door', widthM: 0.9, heightM: 2.0 },
					{ kind: 'window', widthM: 1.2, heightM: 1.4 },
				],
			),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(15.42, 10)
		}
	})

	it('case 11 — comma decimal input 4,5 × 3', () => {
		const length = parseUserDecimalNumber('4,5')
		const width = parseUserDecimalNumber('3')

		expect(length).toEqual({ ok: true, value: 4.5 })
		expect(width).toEqual({ ok: true, value: 3 })

		if (!length.ok || !width.ok) {
			return
		}

		const outcome = calculateTiles(floorInput({ lengthM: length.value, widthM: width.value }))

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(13.5, 10)
		}
	})

	it('case 12 — custom tile 25 × 40 cm', () => {
		const outcome = calculateTiles(
			floorInput({ tileWidthCm: 25, tileHeightCm: 40 }),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.tileAreaM2).toBeCloseTo(0.1, 10)
		}
	})

	it('case 13 — diagonal recommends 15% but manual 10% is used', () => {
		expect(RECOMMENDED_RESERVE_PERCENT.diagonal).toBe(15)

		const outcome = calculateTiles(
			floorInput({
				layoutPattern: 'diagonal',
				reservePercent: 10,
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.trace.reservePercent).toBe(10)
			expect(outcome.result.tilesWithReserve).toBe(37)
		}
	})

	it('case 14 — zero opening is ignored and does not crash', () => {
		const outcome = calculateTiles(
			wallsInput(
				[{ widthM: 3, heightM: 2.7 }],
				[{ kind: 'door', widthM: 0, heightM: 0 }],
			),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(8.1, 10)
			expect(outcome.result.trace.openingsAreaM2).toBe(0)
		}
	})

	it('case 15 — openings larger than walls are invalid', () => {
		const outcome = calculateTiles(
			wallsInput(
				[{ widthM: 2, heightM: 4 }],
				[{ kind: 'other', widthM: 5, heightM: 2 }],
			),
		)

		expect(outcome).toEqual({
			ok: false,
			error: { code: 'OPENINGS_EXCEED_WALLS' },
		})
	})

	it('case 16 — exact tile count without extra rounding', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 1.2,
				widthM: 3,
				reservePercent: 0,
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(3.6, 10)
			expect(outcome.result.rawTiles).toBeCloseTo(10, 10)
			expect(outcome.result.tilesWithReserve).toBe(10)
		}
	})

	it('case 17 — fractional boxes with 6 tiles per box', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 6 },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.packaging?.boxes).toBe(7)
			expect(outcome.result.packaging?.purchasedTiles).toBe(42)
			expect(outcome.result.packaging?.remainingTiles).toBe(5)
		}
	})

	it('case 18 — box area in m²', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'area-per-box', boxAreaM2: 1.44 },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.requiredAreaWithReserveM2).toBeCloseTo(13.2, 10)
			expect(outcome.result.packaging?.boxes).toBe(10)
			expect(outcome.result.packaging?.purchasedAreaM2).toBeCloseTo(14.4, 10)
		}
	})

	it('case 19 — very small area still requires at least one tile', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 0.2,
				widthM: 0.2,
				reservePercent: 0,
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(outcome.result.effectiveAreaM2).toBeCloseTo(0.04, 10)
			expect(outcome.result.tilesWithReserve).toBe(1)
		}
	})

	it('case 20 — large valid room completes without overflow', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 100,
				widthM: 100,
				reservePercent: 0,
			}),
		)

		expect(outcome.ok).toBe(true)
		if (outcome.ok) {
			expect(Number.isSafeInteger(outcome.result.tilesWithReserve)).toBe(true)
			expect(outcome.result.tilesWithReserve).toBeGreaterThan(0)
			expect(outcome.result.effectiveAreaM2).toBe(10_000)
		}
	})

	it('rejects zero packaging count and negative price without throwing', () => {
		expect(
			calculateTiles(
				floorInput({
					packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 0 },
				}),
			).ok,
		).toBe(false)

		expect(
			calculateTiles(
				floorInput({
					pricing: { enabled: true, mode: 'per-tile', amount: -1, currencyCode: 'RUB' },
				}),
			).ok,
		).toBe(false)
	})

	it('prices purchased quantities consistently for both packaging modes', () => {
		const tilesPerBox = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 4 },
				pricing: { enabled: true, mode: 'per-tile', amount: 250, currencyCode: 'RUB' },
			}),
		)
		const areaPerBox = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'area-per-box', boxAreaM2: 1.44 },
				pricing: { enabled: true, mode: 'per-tile', amount: 250, currencyCode: 'RUB' },
			}),
		)

		expect(tilesPerBox.ok && tilesPerBox.result.price?.total).toBe(10_000)
		expect(areaPerBox.ok && areaPerBox.result.price?.total).toBe(10_000)
	})

	it('keeps incomplete decimal drafts invalid instead of coercing them', () => {
		expect(parseUserDecimalNumber('4,')).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		expect(parseUserDecimalNumber('0,')).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		expect(parseUserDecimalNumber('')).toEqual({ ok: false, code: 'EMPTY' })
		expect(parseUserDecimalNumber('4.5')).toEqual({ ok: true, value: 4.5 })
	})
})
