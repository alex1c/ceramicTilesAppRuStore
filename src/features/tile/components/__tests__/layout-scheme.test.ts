import { buildOffsetVerticalRatios } from '../layout-scheme-grid'

describe('layout scheme offset grid', () => {
	it('keeps even rows fixed and staggers only odd-row tile joints', () => {
		const joints = [0.25, 0.5, 0.75]

		expect(buildOffsetVerticalRatios(joints, 0, 0.5, 4)).toEqual(joints)
		expect(buildOffsetVerticalRatios(joints, 1, 0.5, 4)).toEqual([
			0.375,
			0.625,
			0.875,
		])
		expect(buildOffsetVerticalRatios(joints, 1, 1 / 3, 4)).toEqual([
			1 / 3,
			7 / 12,
			5 / 6,
		])
	})
})
