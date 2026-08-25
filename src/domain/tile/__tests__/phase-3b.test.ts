import {
	calculateRectLayout,
	piecesPerSourceTile,
	sourceTilesForIdenticalPieces,
} from '../layout-rect'
import { calculateTiles } from '../calculate'
import { floorInput, wallsInput } from '../fixtures/builders'

describe('Phase 3B layout-rect primitives', () => {
	it('A — exact grid 300×270 cm / 10×10 cm → 810', () => {
		const layout = calculateRectLayout({
			surfaceWidthMm: 3000,
			surfaceHeightMm: 2700,
			tileWidthMm: 100,
			tileHeightMm: 100,
		})

		expect(layout.fullColumns).toBe(30)
		expect(layout.fullRows).toBe(27)
		expect(layout.remainderWidthMm).toBe(0)
		expect(layout.remainderHeightMm).toBe(0)
		expect(layout.baseLayoutTileCount).toBe(810)
	})

	it('B — reusable half cut 300×275 / 10×10 → 825', () => {
		const layout = calculateRectLayout({
			surfaceWidthMm: 3000,
			surfaceHeightMm: 2750,
			tileWidthMm: 100,
			tileHeightMm: 100,
		})

		expect(layout.fullTileCount).toBe(810)
		expect(layout.remainderHeightMm).toBe(50)
		expect(layout.horizontalEdge?.pieceCount).toBe(30)
		expect(layout.horizontalEdge?.piecesPerSourceTile).toBe(2)
		expect(layout.horizontalEdge?.sourceTileCount).toBe(15)
		expect(layout.baseLayoutTileCount).toBe(825)
	})

	it('C — non-reusable 40 cm edge from 60 cm tile', () => {
		expect(piecesPerSourceTile(600, 400)).toBe(1)
		expect(sourceTilesForIdenticalPieces(5, 1)).toBe(5)

		const layout = calculateRectLayout({
			surfaceWidthMm: 3400,
			surfaceHeightMm: 3000,
			tileWidthMm: 600,
			tileHeightMm: 600,
		})

		// remW = 400 → vertical edge pieces cannot yield 2 per tile
		expect(layout.remainderWidthMm).toBe(400)
		expect(layout.verticalEdge?.piecesPerSourceTile).toBe(1)
	})

	it('E — both remainders: 310×275 / 60×60 with conservative corner +1', () => {
		const layout = calculateRectLayout({
			surfaceWidthMm: 3100,
			surfaceHeightMm: 2750,
			tileWidthMm: 600,
			tileHeightMm: 600,
		})

		expect(layout.fullColumns).toBe(5)
		expect(layout.fullRows).toBe(4)
		expect(layout.remainderWidthMm).toBe(100)
		expect(layout.remainderHeightMm).toBe(350)
		expect(layout.fullTileCount).toBe(20)
		// Vertical rem 100 mm: floor(600/100)=6 pieces/tile → ceil(4/6)=1 source
		expect(layout.verticalEdge?.piecesPerSourceTile).toBe(6)
		expect(layout.verticalEdge?.sourceTileCount).toBe(1)
		expect(layout.horizontalEdge?.piecesPerSourceTile).toBe(1) // floor(600/350)=1
		expect(layout.horizontalEdge?.sourceTileCount).toBe(5)
		expect(layout.cornerSourceTiles).toBe(1)
		expect(layout.baseLayoutTileCount).toBe(27)
	})
})

describe('Phase 3B calculateTiles integration', () => {
	it('B — reserve separation on half-cut case', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 3,
				widthM: 2.75,
				tileWidthCm: 10,
				tileHeightCm: 10,
				reservePercent: 10,
			}),
		)

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(outcome.result.baseLayoutTileCount).toBe(825)
		expect(outcome.result.reserveTileCount).toBe(83)
		expect(outcome.result.tilesWithReserve).toBe(908)
	})

	it('D — rectangular orientations produce different bases', () => {
		// Chosen so 30×60 vs 60×30 yield different source counts on this floor.
		const asEntered = calculateTiles(
			floorInput({
				lengthM: 3.5,
				widthM: 2.2,
				tileWidthCm: 30,
				tileHeightCm: 60,
				orientation: 'as-entered',
				reservePercent: 0,
			}),
		)
		const rotated = calculateTiles(
			floorInput({
				lengthM: 3.5,
				widthM: 2.2,
				tileWidthCm: 30,
				tileHeightCm: 60,
				orientation: 'rotated',
				reservePercent: 0,
			}),
		)

		expect(asEntered.ok && rotated.ok).toBe(true)
		if (!asEntered.ok || !rotated.ok) {
			return
		}

		expect(asEntered.result.baseLayoutTileCount).not.toBe(
			rotated.result.baseLayoutTileCount,
		)
		expect(asEntered.result.layout.orientationOptions).toHaveLength(2)

		const cheaper = asEntered.result.layout.orientationOptions.find((o) => o.isEconomical)
		expect(cheaper).toBeDefined()
		expect(
			asEntered.result.layout.orientationOptions.filter((o) => o.isEconomical),
		).toHaveLength(1)
	})

	it('F — multiple walls calculated separately (no merge)', () => {
		// Different heights so a naive width-sum merge cannot equal the sum of panels.
		const separate = calculateTiles(
			wallsInput(
				[
					{ widthM: 3, heightM: 2.5 },
					{ widthM: 4, heightM: 2.7 },
				],
				[],
				{ reservePercent: 0 },
			),
		)
		const mergedFake = calculateRectLayout({
			surfaceWidthMm: 7000,
			surfaceHeightMm: 2700,
			tileWidthMm: 600,
			tileHeightMm: 600,
		})

		expect(separate.ok).toBe(true)
		if (!separate.ok) {
			return
		}

		expect(separate.result.layout.panels).toHaveLength(2)
		const sum = separate.result.layout.panels.reduce(
			(acc, p) => acc + p.rect.baseLayoutTileCount,
			0,
		)
		expect(separate.result.baseLayoutTileCount).toBe(sum)
		expect(sum).not.toBe(mergedFake.baseLayoutTileCount)
	})

	it('G — no hidden layout coefficient beyond explicit reserve', () => {
		const zero = calculateTiles(floorInput({ reservePercent: 0 }))
		const ten = calculateTiles(floorInput({ reservePercent: 10 }))

		expect(zero.ok && ten.ok).toBe(true)
		if (!zero.ok || !ten.ok) {
			return
		}

		expect(zero.result.baseLayoutTileCount).toBe(ten.result.baseLayoutTileCount)
		expect(ten.result.tilesWithReserve).toBe(
			Math.ceil(ten.result.baseLayoutTileCount * 1.1),
		)
	})

	it('H — packaging uses layout final quantity', () => {
		const outcome = calculateTiles(
			floorInput({
				lengthM: 3,
				widthM: 2.75,
				tileWidthCm: 10,
				tileHeightCm: 10,
				reservePercent: 10,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 10 },
			}),
		)

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(outcome.result.tilesWithReserve).toBe(908)
		expect(outcome.result.packaging?.boxes).toBe(91)
		expect(outcome.result.packaging?.purchasedTiles).toBe(910)
	})

	it('I — price modes after layout-aware quantity', () => {
		const base = {
			lengthM: 3,
			widthM: 2.7,
			tileWidthCm: 10,
			tileHeightCm: 10,
			reservePercent: 0,
		} as const

		const perTile = calculateTiles(
			floorInput({
				...base,
				pricing: { enabled: true, mode: 'per-tile', amount: 10, currencyCode: 'RUB' },
			}),
		)
		const perM2 = calculateTiles(
			floorInput({
				...base,
				pricing: { enabled: true, mode: 'per-m2', amount: 100, currencyCode: 'RUB' },
			}),
		)
		const perBox = calculateTiles(
			floorInput({
				...base,
				packaging: { enabled: true, mode: 'tiles-per-box', tilesPerBox: 10 },
				pricing: { enabled: true, mode: 'per-box', amount: 50, currencyCode: 'RUB' },
			}),
		)

		expect(perTile.ok && perM2.ok && perBox.ok).toBe(true)
		if (!perTile.ok || !perM2.ok || !perBox.ok) {
			return
		}

		expect(perTile.result.tilesWithReserve).toBe(810)
		expect(perTile.result.price?.total).toBe(8100)
		expect(perM2.result.requiredAreaWithReserveM2).toBeCloseTo(8.1, 10)
		expect(perM2.result.price?.total).toBe(810)
		expect(perBox.result.packaging?.boxes).toBe(81)
		expect(perBox.result.price?.total).toBe(4050)
	})

	it('J — square tile has no orientation options / duplication', () => {
		const outcome = calculateTiles(
			floorInput({
				tileWidthCm: 60,
				tileHeightCm: 60,
				orientation: 'rotated',
			}),
		)

		expect(outcome.ok).toBe(true)
		if (!outcome.ok) {
			return
		}

		expect(outcome.result.layout.isSquareTile).toBe(true)
		expect(outcome.result.layout.orientationOptions).toEqual([])
		expect(outcome.result.layout.orientation).toBe('as-entered')
	})
})
