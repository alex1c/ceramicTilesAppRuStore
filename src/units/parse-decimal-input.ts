import type { Millimeters } from './length'

/** Matches domain `MAX_LENGTH_MM` — kept here to avoid units → domain imports. */
const MAX_INPUT_LENGTH_MM = 1_000_000

/** UI-layer parse failure codes — mapped to i18n in the feature presenter. */
export type ParseDecimalInputErrorCode =
	| 'EMPTY'
	| 'INVALID_FORMAT'
	| 'NOT_POSITIVE'
	| 'NOT_FINITE'
	| 'NEGATIVE'
	| 'TOO_LARGE'

export type ParseDecimalInputResult =
	| { ok: true; valueMm: Millimeters }
	| { ok: false; code: ParseDecimalInputErrorCode }

export type ParseDecimalNumberResult =
	| { ok: true; value: number }
	| { ok: false; code: ParseDecimalInputErrorCode }

/**
 * Normalizes locale decimal text: trims whitespace, converts comma to dot.
 * Does not invent a number from incomplete drafts such as `4,`.
 */
export function normalizeDecimalInput(raw: string): string {
	return raw.trim().replace(',', '.')
}

/**
 * Parses a user decimal string to a finite number.
 * Accepts `4`, `4.5`, `4,5`. Rejects empty, `4,`, NaN, Infinity, and junk.
 */
export function parseUserDecimalNumber(
	raw: string,
	options: { allowZero?: boolean } = {},
): ParseDecimalNumberResult {
	const trimmed = raw.trim()

	if (trimmed.length === 0) {
		return { ok: false, code: 'EMPTY' }
	}

	const normalized = normalizeDecimalInput(trimmed)

	if (!/^\d+(\.\d+)?$/.test(normalized)) {
		return { ok: false, code: 'INVALID_FORMAT' }
	}

	const value = Number(normalized)

	if (!Number.isFinite(value)) {
		return { ok: false, code: 'NOT_FINITE' }
	}

	if (value < 0) {
		return { ok: false, code: 'NEGATIVE' }
	}

	if (!options.allowZero && value === 0) {
		return { ok: false, code: 'NOT_POSITIVE' }
	}

	return { ok: true, value }
}

/** Parses meters and converts to canonical integer millimeters. Zero is rejected. */
export function parseMetersInputToMillimeters(raw: string): ParseDecimalInputResult {
	return parseLengthToMillimeters(raw, 1000, { allowZero: false })
}

/**
 * Parses meters including zero. Used for incomplete openings that the UI may
 * still hold as `0` / `0,0` before they are dropped by normalization.
 */
export function parseMetersInputAllowZeroToMillimeters(
	raw: string,
): ParseDecimalInputResult {
	return parseLengthToMillimeters(raw, 1000, { allowZero: true })
}

/** Parses centimeters and converts to canonical integer millimeters. */
export function parseCentimetersInputToMillimeters(raw: string): ParseDecimalInputResult {
	return parseLengthToMillimeters(raw, 10, { allowZero: false })
}

function parseLengthToMillimeters(
	raw: string,
	factor: number,
	options: { allowZero: boolean },
): ParseDecimalInputResult {
	const parsed = parseUserDecimalNumber(raw, { allowZero: options.allowZero })

	if (!parsed.ok) {
		return parsed
	}

	const valueMm = Math.round(parsed.value * factor) as Millimeters

	if (!options.allowZero && valueMm <= 0) {
		return { ok: false, code: 'NOT_POSITIVE' }
	}

	if (valueMm < 0 || valueMm > MAX_INPUT_LENGTH_MM) {
		return { ok: false, code: 'TOO_LARGE' }
	}

	return { ok: true, valueMm }
}
