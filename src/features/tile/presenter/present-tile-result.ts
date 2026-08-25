import type {
	LayoutCalculationSummary,
	TileCalculationErrorCode,
	TileCalculationResult,
} from '@/domain/tile'
import { formatAreaM2, formatMoney, formatNumber, getLocale, t } from '@/i18n'
import { formatCountNoun, pluralizeRu } from '@/i18n/pluralize'
import type { ParseDecimalInputErrorCode } from '@/units/parse-decimal-input'

export interface PresentedExplanationStep {
	title: string
	body: string
}

export interface PresentedTileResult {
	resultKey: string
	heroHeading: string
	heroValue: string
	heroUnit: string
	details: string[]
	pricePrinciple: string | null
	explanationSteps: PresentedExplanationStep[]
	phaseNote: string
	/** Domain layout summary for the visual scheme — UI must not recalculate. */
	layout: LayoutCalculationSummary
}

export function mapFieldError(code: ParseDecimalInputErrorCode): string {
	return t().calculator.errors.field[
		code === 'EMPTY'
			? 'empty'
			: code === 'INVALID_FORMAT'
				? 'invalidFormat'
				: code === 'NOT_POSITIVE'
					? 'notPositive'
					: code === 'NEGATIVE'
						? 'negative'
						: code === 'TOO_LARGE'
							? 'tooLarge'
							: 'notFinite'
	]
}

export function mapDomainError(code: TileCalculationErrorCode): string {
	const errors = t().calculator.errors.domain
	switch (code) {
		case 'INVALID_DIMENSION':
			return errors.invalidDimension
		case 'INVALID_TILE_SIZE':
			return errors.invalidTileSize
		case 'INVALID_RESERVE':
			return errors.invalidReserve
		case 'OPENINGS_EXCEED_WALLS':
			return errors.openingsExceedWalls
		case 'INVALID_PACKAGING':
			return errors.invalidPackaging
		case 'INVALID_PRICE':
			return errors.invalidPrice
		case 'PRICE_BOX_REQUIRES_PACKAGING':
			return errors.priceBoxRequiresPackaging
		case 'NOT_FINITE':
			return errors.notFinite
		default:
			return errors.generic
	}
}

function interpolate(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

/** Nominative count+noun for result details (Итого: 41 плитка). */
function tileNom(count: number): string {
	const strings = t()
	return formatCountNoun(
		count,
		strings.calculator.result.tileNomOne,
		strings.calculator.result.tileNomFew,
		strings.calculator.result.tileNomMany,
		getLocale(),
	)
}

function boxNom(count: number): string {
	const strings = t()
	return formatCountNoun(
		count,
		strings.calculator.result.boxNomOne,
		strings.calculator.result.boxNomFew,
		strings.calculator.result.boxNomMany,
		getLocale(),
	)
}

/** Accusative noun only for hero (Нужно … плитку). */
function tileAccUnit(count: number): string {
	const strings = t()
	const locale = getLocale()
	if (locale === 'ru') {
		return pluralizeRu(
			count,
			strings.calculator.result.tileUnitOne,
			strings.calculator.result.tileUnitFew,
			strings.calculator.result.tileUnitMany,
		)
	}
	return count === 1
		? strings.calculator.result.tileUnitOne
		: strings.calculator.result.tileUnitMany
}

function boxAccUnit(count: number): string {
	const strings = t()
	const locale = getLocale()
	if (locale === 'ru') {
		return pluralizeRu(
			count,
			strings.calculator.result.boxUnitOne,
			strings.calculator.result.boxUnitFew,
			strings.calculator.result.boxUnitMany,
		)
	}
	return count === 1
		? strings.calculator.result.boxUnitOne
		: strings.calculator.result.boxUnitMany
}

/**
 * Maps domain results to localized UI copy.
 * Does not recalculate tiles, boxes, or money.
 * Quantity-mode labels come from `result.layout.quantityMode`.
 */
export function presentTileResult(result: TileCalculationResult): PresentedTileResult {
	const strings = t()
	const details: string[] = []
	const rawFormatted = formatNumber(result.rawTiles, { maximumFractionDigits: 2 })
	const beforeFormatted = formatNumber(result.trace.tilesBeforeCeil, {
		maximumFractionDigits: 2,
	})
	const isLayout = result.layout.quantityMode === 'layout-straight'

	let heroHeading = strings.calculator.result.needTiles
	let heroValue = String(result.tilesWithReserve)
	let heroUnit = tileAccUnit(result.tilesWithReserve)

	/*
	 * Base / reserve / total — label reflects actual domain quantity mode.
	 * Do not say «По раскладке» for area-estimate fallbacks.
	 */
	const baseTemplate = isLayout
		? strings.calculator.result.layoutBase
		: strings.calculator.result.areaBase

	details.push(
		interpolate(baseTemplate, {
			countNoun: tileNom(result.baseLayoutTileCount),
		}),
		interpolate(strings.calculator.result.reserveAdded, {
			percent: formatNumber(result.trace.reservePercent),
			countNoun: tileNom(result.reserveTileCount),
		}),
	)

	if (result.packaging) {
		heroHeading = strings.calculator.result.buyBoxes
		heroValue = String(result.packaging.boxes)
		heroUnit = boxAccUnit(result.packaging.boxes)
		details.push(
			interpolate(strings.calculator.result.totalTiles, {
				countNoun: tileNom(result.tilesWithReserve),
			}),
		)

		// Intentionally omit duplicate «Требуется плиток» — Итого already covers it.

		if (result.packaging.tilesPerBox !== null) {
			details.push(
				interpolate(strings.calculator.result.inBoxTiles, {
					countNoun: tileNom(result.packaging.tilesPerBox),
				}),
			)
		}

		if (result.packaging.boxAreaM2 !== null) {
			details.push(
				interpolate(strings.calculator.result.inBoxArea, {
					area: formatAreaM2(result.packaging.boxAreaM2),
				}),
			)
		}

		if (result.packaging.purchasedTiles !== null) {
			details.push(
				interpolate(strings.calculator.result.purchasedTiles, {
					countNoun: tileNom(result.packaging.purchasedTiles),
				}),
			)
		}

		details.push(
			interpolate(strings.calculator.result.purchasedArea, {
				area: formatAreaM2(result.packaging.purchasedAreaM2),
			}),
		)

		if (result.packaging.remainingTiles !== null) {
			details.push(
				interpolate(strings.calculator.result.remainingTiles, {
					countNoun: tileNom(result.packaging.remainingTiles),
				}),
			)
		} else {
			details.push(
				interpolate(strings.calculator.result.remainingArea, {
					area: formatAreaM2(result.packaging.remainingAreaM2),
				}),
			)
		}
	} else {
		details.push(
			interpolate(strings.calculator.result.surfaceArea, {
				area: formatAreaM2(result.effectiveAreaM2),
			}),
			interpolate(strings.calculator.result.tileArea, {
				area: formatAreaM2(result.tileAreaM2),
			}),
			interpolate(strings.calculator.result.requiredArea, {
				area: formatAreaM2(result.requiredAreaWithReserveM2),
			}),
		)
	}

	let pricePrinciple: string | null = null

	if (result.price) {
		details.push(
			interpolate(strings.calculator.result.cost, {
				amount: formatMoney(result.price.total),
			}),
		)

		if (result.price.mode === 'per-tile') {
			pricePrinciple = strings.calculator.result.pricePrincipleTile
		} else if (result.price.mode === 'per-box') {
			pricePrinciple = strings.calculator.result.pricePrincipleBox
		} else if (result.packaging) {
			pricePrinciple = strings.calculator.result.pricePrincipleM2Purchased
		} else {
			pricePrinciple = strings.calculator.result.pricePrincipleM2Required
		}
	}

	const surfaceBody =
		result.trace.surfaceKind === 'floor' &&
		result.trace.floorLengthM !== null &&
		result.trace.floorWidthM !== null
			? interpolate(strings.calculator.explanation.surfaceFloor, {
					length: formatNumber(result.trace.floorLengthM, { maximumFractionDigits: 2 }),
					width: formatNumber(result.trace.floorWidthM, { maximumFractionDigits: 2 }),
					area: formatAreaM2(result.trace.surfaceAreaM2),
				})
			: interpolate(strings.calculator.explanation.surfaceWalls, {
					area: formatAreaM2(result.trace.surfaceAreaM2),
				})

	const steps: PresentedExplanationStep[] = [
		{
			title: strings.calculator.explanation.surfaceTitle,
			body: surfaceBody,
		},
		{
			title: strings.calculator.explanation.tileTitle,
			body: interpolate(strings.calculator.explanation.tileBody, {
				width: formatNumber(result.layout.orientedTileWidthMm / 10, {
					maximumFractionDigits: 2,
				}),
				height: formatNumber(result.layout.orientedTileHeightMm / 10, {
					maximumFractionDigits: 2,
				}),
				area: formatAreaM2(result.tileAreaM2),
			}),
		},
	]

	if (isLayout) {
		let layoutBody = interpolate(strings.calculator.explanation.layoutBody, {
			baseNoun: tileNom(result.baseLayoutTileCount),
		})

		const reusePieces = findReusableEdgePieces(result.layout)
		if (reusePieces !== null && reusePieces >= 2) {
			layoutBody = [
				layoutBody,
				interpolate(strings.calculator.explanation.layoutReuseBody, {
					pieces: reusePieces,
				}),
			].join(' ')
		}

		steps.push({
			title: strings.calculator.explanation.layoutTitle,
			body: layoutBody,
		})
		steps.push({
			title: strings.calculator.explanation.reserveTitle,
			body: interpolate(strings.calculator.explanation.reserveBodyLayout, {
				baseNoun: tileNom(result.baseLayoutTileCount),
				percent: formatNumber(result.trace.reservePercent),
				tilesNoun: tileNom(result.tilesWithReserve),
				reserveNoun: tileNom(result.reserveTileCount),
			}),
		})
	} else {
		steps.push({
			title: strings.calculator.explanation.rawTitle,
			body: interpolate(strings.calculator.explanation.rawBody, {
				area: formatAreaM2(result.effectiveAreaM2),
				tile: formatAreaM2(result.tileAreaM2),
				raw: rawFormatted,
			}),
		})
		steps.push({
			title: strings.calculator.explanation.estimateTitle,
			body: interpolate(strings.calculator.explanation.estimateBody, {
				baseNoun: tileNom(result.baseLayoutTileCount),
			}),
		})
		steps.push({
			title: strings.calculator.explanation.reserveTitle,
			body: interpolate(strings.calculator.explanation.reserveBody, {
				percent: formatNumber(result.trace.reservePercent),
				before: beforeFormatted,
				tilesNoun: tileNom(result.tilesWithReserve),
			}),
		})
	}

	if (result.trace.openingsAreaM2 > 0) {
		steps.splice(1, 0, {
			title: strings.calculator.explanation.openingsTitle,
			body: [
				interpolate(strings.calculator.explanation.openingsBody, {
					openings: formatAreaM2(result.trace.openingsAreaM2),
					useful: formatAreaM2(result.effectiveAreaM2),
				}),
				strings.calculator.explanation.openingsEstimateNote,
			].join(' '),
		})
	}

	if (result.packaging?.mode === 'tiles-per-box' && result.packaging.tilesPerBox) {
		const rawBoxes = result.tilesWithReserve / result.packaging.tilesPerBox
		steps.push({
			title: strings.calculator.explanation.packagingTitle,
			body: interpolate(strings.calculator.explanation.packagingTiles, {
				tilesNoun: tileNom(result.tilesWithReserve),
				perBox: result.packaging.tilesPerBox,
				rawBoxes: formatNumber(rawBoxes, { maximumFractionDigits: 2 }),
				boxesNoun: boxNom(result.packaging.boxes),
			}),
		})
		steps.push({
			title: strings.calculator.explanation.purchaseTitle,
			body: interpolate(strings.calculator.explanation.purchaseTiles, {
				purchasedNoun: tileNom(result.packaging.purchasedTiles ?? 0),
				remainingNoun: tileNom(result.packaging.remainingTiles ?? 0),
			}),
		})
	}

	if (result.packaging?.mode === 'area-per-box' && result.packaging.boxAreaM2) {
		const rawBoxes = result.requiredAreaWithReserveM2 / result.packaging.boxAreaM2
		steps.push({
			title: strings.calculator.explanation.packagingTitle,
			body: interpolate(strings.calculator.explanation.packagingArea, {
				required: formatAreaM2(result.requiredAreaWithReserveM2),
				boxArea: formatAreaM2(result.packaging.boxAreaM2),
				rawBoxes: formatNumber(rawBoxes, { maximumFractionDigits: 2 }),
				boxesNoun: boxNom(result.packaging.boxes),
			}),
		})
		steps.push({
			title: strings.calculator.explanation.purchaseTitle,
			body: interpolate(strings.calculator.explanation.purchaseArea, {
				purchased: formatAreaM2(result.packaging.purchasedAreaM2),
				remaining: formatAreaM2(result.packaging.remainingAreaM2),
			}),
		})
	}

	const phaseNote = isLayout
		? strings.calculator.explanation.noFakePrecisionLayout
		: strings.calculator.explanation.noFakePrecisionEstimate

	return {
		resultKey: `${result.tilesWithReserve}-${result.packaging?.boxes ?? 0}-${result.price?.total ?? 0}-${result.layout.orientation}-${result.layout.quantityMode}`,
		heroHeading,
		heroValue,
		heroUnit,
		details,
		pricePrinciple,
		explanationSteps: steps,
		phaseNote,
		layout: result.layout,
	}
}

/**
 * Returns pieces-per-source-tile when a layout-aware edge actually reuses cuts.
 * Null when no 1D reuse ≥ 2 occurred (avoid claiming reuse that did not happen).
 */
function findReusableEdgePieces(layout: LayoutCalculationSummary): number | null {
	let best: number | null = null

	for (const panel of layout.panels) {
		const edges = [panel.rect.verticalEdge, panel.rect.horizontalEdge]
		for (const edge of edges) {
			if (edge && edge.piecesPerSourceTile >= 2) {
				best = best === null
					? edge.piecesPerSourceTile
					: Math.max(best, edge.piecesPerSourceTile)
			}
		}
	}

	return best
}
