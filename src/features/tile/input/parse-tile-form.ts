import {
	DEFAULT_CURRENCY_CODE,
	RECOMMENDED_RESERVE_PERCENT,
	type LayoutPatternId,
	type OpeningKind,
	type PackagingMode,
	type PriceMode,
	type SurfaceKind,
	type TileCalculationInput,
	type TileOrientationId,
} from '@/domain/tile'
import {
	parseUserDecimalNumber,
	type ParseDecimalInputErrorCode,
} from '@/units/parse-decimal-input'

export type TilePresetId = 'custom' | `${number}x${number}`

export interface WallFormRow {
	id: string
	width: string
	height: string
}

export interface OpeningFormRow {
	id: string
	kind: OpeningKind
	width: string
	height: string
}

export interface TileFormValues {
	surfaceKind: SurfaceKind
	floorLength: string
	floorWidth: string
	walls: WallFormRow[]
	openings: OpeningFormRow[]
	tilePresetId: TilePresetId
	tileWidth: string
	tileHeight: string
	orientation: TileOrientationId
	layoutPattern: LayoutPatternId
	reservePreset: '0' | '5' | '10' | '15' | 'custom'
	reserveCustom: string
	packagingEnabled: boolean
	packagingMode: PackagingMode
	tilesPerBoxPreset: '4' | '6' | '8' | '10' | '12' | 'custom'
	tilesPerBoxCustom: string
	boxArea: string
	priceEnabled: boolean
	priceMode: PriceMode
	priceAmount: string
}

export type FormFieldErrors = Record<string, ParseDecimalInputErrorCode>

export const DEFAULT_TILE_FORM: TileFormValues = {
	surfaceKind: 'floor',
	floorLength: '4',
	floorWidth: '3',
	walls: [{ id: 'wall-1', width: '3', height: '2,7' }],
	openings: [],
	tilePresetId: '60x60',
	tileWidth: '60',
	tileHeight: '60',
	orientation: 'as-entered',
	layoutPattern: 'straight',
	reservePreset: '10',
	reserveCustom: '10',
	packagingEnabled: false,
	packagingMode: 'tiles-per-box',
	tilesPerBoxPreset: '4',
	tilesPerBoxCustom: '4',
	boxArea: '1,44',
	priceEnabled: false,
	priceMode: 'per-m2',
	priceAmount: '',
}

export type ParseFormResult =
	| { ok: true; input: TileCalculationInput }
	| { ok: false; errors: FormFieldErrors }

function parsePositive(raw: string, key: string, errors: FormFieldErrors): number | null {
	const parsed = parseUserDecimalNumber(raw)

	if (!parsed.ok) {
		errors[key] = parsed.code
		return null
	}

	return parsed.value
}

function parseNonNegativeMoney(raw: string, key: string, errors: FormFieldErrors): number | null {
	const parsed = parseUserDecimalNumber(raw, { allowZero: true })

	if (!parsed.ok) {
		errors[key] = parsed.code
		return null
	}

	return parsed.value
}

function parseIntegerCount(raw: string, key: string, errors: FormFieldErrors): number | null {
	const parsed = parseUserDecimalNumber(raw)

	if (!parsed.ok) {
		errors[key] = parsed.code
		return null
	}

	if (!Number.isInteger(parsed.value)) {
		errors[key] = 'INVALID_FORMAT'
		return null
	}

	return parsed.value
}

/**
 * Converts editable form strings into canonical domain input.
 * Incomplete openings (empty or zero) are omitted instead of failing the whole form.
 */
export function parseTileForm(values: TileFormValues): ParseFormResult {
	const errors: FormFieldErrors = {}
	let surface: TileCalculationInput['surface']

	if (values.surfaceKind === 'floor') {
		const lengthM = parsePositive(values.floorLength, 'floorLength', errors)
		const widthM = parsePositive(values.floorWidth, 'floorWidth', errors)

		if (lengthM === null || widthM === null) {
			return { ok: false, errors }
		}

		surface = { kind: 'floor', lengthM, widthM }
	} else {
		const walls = values.walls.map((wall) => {
			const widthM = parsePositive(wall.width, `wall-${wall.id}-width`, errors)
			const heightM = parsePositive(wall.height, `wall-${wall.id}-height`, errors)
			return widthM !== null && heightM !== null ? { widthM, heightM } : null
		})

		if (walls.some((wall) => wall === null) || walls.length < 1) {
			return { ok: false, errors }
		}

		const openings = values.openings.flatMap((opening) => {
			const widthRaw = opening.width.trim()
			const heightRaw = opening.height.trim()

			if (widthRaw.length === 0 && heightRaw.length === 0) {
				return []
			}

			const width = parseUserDecimalNumber(widthRaw, { allowZero: true })
			const height = parseUserDecimalNumber(heightRaw, { allowZero: true })

			if (!width.ok) {
				errors[`opening-${opening.id}-width`] = width.code
				return []
			}

			if (!height.ok) {
				errors[`opening-${opening.id}-height`] = height.code
				return []
			}

			if (width.value === 0 || height.value === 0) {
				return []
			}

			return [{ kind: opening.kind, widthM: width.value, heightM: height.value }]
		})

		if (Object.keys(errors).length > 0) {
			return { ok: false, errors }
		}

		surface = {
			kind: 'walls',
			walls: walls as { widthM: number; heightM: number }[],
			openings,
		}
	}

	const tileWidthCm = parsePositive(values.tileWidth, 'tileWidth', errors)
	const tileHeightCm = parsePositive(values.tileHeight, 'tileHeight', errors)
	const reservePercent = resolveReserve(values, errors)

	let packaging: TileCalculationInput['packaging'] = { enabled: false }

	if (values.packagingEnabled) {
		if (values.packagingMode === 'tiles-per-box') {
			const tilesPerBox = parseIntegerCount(resolveTilesPerBox(values), 'tilesPerBox', errors)
			if (tilesPerBox !== null) {
				packaging = { enabled: true, mode: 'tiles-per-box', tilesPerBox }
			}
		} else {
			const boxAreaM2 = parsePositive(values.boxArea, 'boxArea', errors)
			if (boxAreaM2 !== null) {
				packaging = { enabled: true, mode: 'area-per-box', boxAreaM2 }
			}
		}
	}

	let pricing: TileCalculationInput['pricing'] = { enabled: false }

	if (values.priceEnabled) {
		const amount = parseNonNegativeMoney(values.priceAmount, 'priceAmount', errors)
		if (amount !== null) {
			pricing = {
				enabled: true,
				mode: values.priceMode,
				amount,
				currencyCode: DEFAULT_CURRENCY_CODE,
			}
		}
	}

	if (Object.keys(errors).length > 0 || tileWidthCm === null || tileHeightCm === null) {
		return { ok: false, errors }
	}

	return {
		ok: true,
		input: {
			surface,
			tileWidthCm,
			tileHeightCm,
			orientation: values.orientation,
			layoutPattern: values.layoutPattern,
			reservePercent: reservePercent ?? RECOMMENDED_RESERVE_PERCENT[values.layoutPattern],
			packaging,
			pricing,
		},
	}
}

function resolveReserve(values: TileFormValues, errors: FormFieldErrors): number | null {
	if (values.reservePreset !== 'custom') {
		return Number(values.reservePreset)
	}

	return parseNonNegativeMoney(values.reserveCustom, 'reserveCustom', errors)
}

function resolveTilesPerBox(values: TileFormValues): string {
	return values.tilesPerBoxPreset === 'custom'
		? values.tilesPerBoxCustom
		: values.tilesPerBoxPreset
}

export function applyTilePreset(presetId: TilePresetId): Pick<TileFormValues, 'tileWidth' | 'tileHeight' | 'tilePresetId'> {
	if (presetId === 'custom') {
		return { tilePresetId: 'custom', tileWidth: '', tileHeight: '' }
	}

	const [width, height] = presetId.split('x')
	return { tilePresetId: presetId, tileWidth: width, tileHeight: height }
}
