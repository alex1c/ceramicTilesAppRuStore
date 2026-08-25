import { calculateTiles, RECOMMENDED_RESERVE_PERCENT } from '@/domain/tile'
import { floorInput } from '@/domain/tile/fixtures/builders'

describe('phase-3b remaining certification matrix', () => {
	it('A — diagonal recommend 15, manual 10 used', () => {
		expect(RECOMMENDED_RESERVE_PERCENT.diagonal).toBe(15)
		const outcome = calculateTiles(
			floorInput({ layoutPattern: 'diagonal', reservePercent: 10 }),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) return
		expect(outcome.result.trace.reservePercent).toBe(10)
		expect(outcome.result.tilesWithReserve).toBe(38)
	})

	it('B — 30x60 orientations differ and mark economical', () => {
		const a = calculateTiles(
			floorInput({
				tileWidthCm: 30,
				tileHeightCm: 60,
				orientation: 'as-entered',
				reservePercent: 0,
			}),
		)
		const b = calculateTiles(
			floorInput({
				tileWidthCm: 30,
				tileHeightCm: 60,
				orientation: 'rotated',
				reservePercent: 0,
			}),
		)
		expect(a.ok && b.ok).toBe(true)
		if (!a.ok || !b.ok) return
		expect(a.result.baseLayoutTileCount).not.toBe(b.result.baseLayoutTileCount)
		expect(a.result.layout.orientationOptions.some((o) => o.isEconomical)).toBe(true)
		expect(a.result.layout.orientationOptions).toHaveLength(2)
	})

	it('C — packaging by area 1.44 ceil', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'area-per-box', boxAreaM2: 1.44 },
			}),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok || !outcome.result.packaging) return
		const expected = Math.ceil(outcome.result.requiredAreaWithReserveM2 / 1.44)
		expect(outcome.result.packaging.boxes).toBe(expected)
		expect(outcome.result.packaging.purchasedAreaM2).toBeCloseTo(expected * 1.44, 10)
	})

	it('D — price per tile = tilesWithReserve * amount', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				pricing: { enabled: true, mode: 'per-tile', amount: 250, currencyCode: 'RUB' },
			}),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok) return
		expect(outcome.result.price?.total).toBe(outcome.result.tilesWithReserve * 250)
	})

	it('E — price per package = boxes * amount', () => {
		const outcome = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 10 },
				pricing: { enabled: true, mode: 'per-box', amount: 500, currencyCode: 'RUB' },
			}),
		)
		expect(outcome.ok).toBe(true)
		if (!outcome.ok || !outcome.result.packaging) return
		expect(outcome.result.price?.total).toBe(outcome.result.packaging.boxes * 500)
	})

	it('F — per-m2 uses required area without pkg, purchased area with pkg', () => {
		const noPkg = calculateTiles(
			floorInput({
				reservePercent: 10,
				pricing: { enabled: true, mode: 'per-m2', amount: 1500, currencyCode: 'RUB' },
			}),
		)
		const withPkg = calculateTiles(
			floorInput({
				reservePercent: 10,
				packaging: { enabled: true, mode: 'area-per-box', boxAreaM2: 1.44 },
				pricing: { enabled: true, mode: 'per-m2', amount: 1500, currencyCode: 'RUB' },
			}),
		)
		expect(noPkg.ok && withPkg.ok).toBe(true)
		if (!noPkg.ok || !withPkg.ok || !withPkg.result.packaging) return
		expect(noPkg.result.price?.total).toBe(
			Math.round(noPkg.result.requiredAreaWithReserveM2 * 1500 * 100) / 100,
		)
		expect(withPkg.result.price?.total).toBe(
			Math.round(withPkg.result.packaging.purchasedAreaM2 * 1500 * 100) / 100,
		)
	})
})
