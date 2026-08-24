import { parseUserDecimalNumber } from '../parse-decimal-input'

describe('parseUserDecimalNumber', () => {
	it('accepts integer, dot, and comma decimals', () => {
		expect(parseUserDecimalNumber('4')).toEqual({ ok: true, value: 4 })
		expect(parseUserDecimalNumber('4.5')).toEqual({ ok: true, value: 4.5 })
		expect(parseUserDecimalNumber('4,5')).toEqual({ ok: true, value: 4.5 })
		expect(parseUserDecimalNumber('0.5')).toEqual({ ok: true, value: 0.5 })
		expect(parseUserDecimalNumber('0,5')).toEqual({ ok: true, value: 0.5 })
	})

	it('rejects incomplete drafts instead of storing a JS Number mid-edit', () => {
		expect(parseUserDecimalNumber('4,')).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		expect(parseUserDecimalNumber('4.')).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		expect(parseUserDecimalNumber('0,')).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		expect(parseUserDecimalNumber('')).toEqual({ ok: false, code: 'EMPTY' })
	})

	it('rejects punctuation, signs, text, and repeated separators', () => {
		for (const draft of [',', '.', '-', 'abc', '1,,2', '1..2']) {
			expect(parseUserDecimalNumber(draft)).toEqual({ ok: false, code: 'INVALID_FORMAT' })
		}
	})

	it('rejects zero unless explicitly allowed', () => {
		expect(parseUserDecimalNumber('0')).toEqual({ ok: false, code: 'NOT_POSITIVE' })
		expect(parseUserDecimalNumber('0', { allowZero: true })).toEqual({ ok: true, value: 0 })
	})
})
