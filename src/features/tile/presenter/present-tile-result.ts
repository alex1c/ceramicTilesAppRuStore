import type { TileCalculationErrorCode, TileCalculationResult } from '@/domain/tile'
import { formatAreaM2, formatMoney, formatNumber, getLocale, t } from '@/i18n'
import { pluralizeRu } from '@/i18n/pluralize'
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

/**
 * Maps domain results to localized UI copy.
 * Does not recalculate tiles, boxes, or money.
 */
export function presentTileResult(result: TileCalculationResult): PresentedTileResult {
	const strings = t()
	const locale = getLocale()
	const details: string[] = []
	const rawFormatted = formatNumber(result.rawTiles, { maximumFractionDigits: 2 })
	const beforeFormatted = formatNumber(result.trace.tilesBeforeCeil, {
		maximumFractionDigits: 2,
	})

	let heroHeading = strings.calculator.result.needTiles
	let heroValue = String(result.tilesWithReserve)
	let heroUnit =
		locale === 'ru'
			? pluralizeRu(
					result.tilesWithReserve,
					strings.calculator.result.tileUnitOne,
					strings.calculator.result.tileUnitFew,
					strings.calculator.result.tileUnitMany,
				)
			: result.tilesWithReserve === 1
				? strings.calculator.result.tileUnitOne
				: strings.calculator.result.tileUnitMany

	if (result.packaging) {
		heroHeading = strings.calculator.result.buyBoxes
		heroValue = String(result.packaging.boxes)
		heroUnit =
			locale === 'ru'
				? pluralizeRu(
						result.packaging.boxes,
						strings.calculator.result.boxUnitOne,
						strings.calculator.result.boxUnitFew,
						strings.calculator.result.boxUnitMany,
					)
				: result.packaging.boxes === 1
					? strings.calculator.result.boxUnitOne
					: strings.calculator.result.boxUnitMany

		details.push(
			interpolate(strings.calculator.result.requiredTiles, {
				count: result.tilesWithReserve,
			}),
		)

		if (result.packaging.tilesPerBox !== null) {
			details.push(
				interpolate(strings.calculator.result.inBoxTiles, {
					count: result.packaging.tilesPerBox,
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
					count: result.packaging.purchasedTiles,
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
					count: result.packaging.remainingTiles,
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
			interpolate(strings.calculator.result.reserve, {
				percent: formatNumber(result.trace.reservePercent),
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
				width: formatNumber(result.trace.tileWidthCm, { maximumFractionDigits: 2 }),
				height: formatNumber(result.trace.tileHeightCm, { maximumFractionDigits: 2 }),
				area: formatAreaM2(result.tileAreaM2),
			}),
		},
		{
			title: strings.calculator.explanation.rawTitle,
			body: interpolate(strings.calculator.explanation.rawBody, {
				area: formatAreaM2(result.effectiveAreaM2),
				tile: formatAreaM2(result.tileAreaM2),
				raw: rawFormatted,
			}),
		},
		{
			title: strings.calculator.explanation.reserveTitle,
			body: interpolate(strings.calculator.explanation.reserveBody, {
				percent: formatNumber(result.trace.reservePercent),
				before: beforeFormatted,
				tiles: result.tilesWithReserve,
			}),
		},
	]

	if (result.trace.openingsAreaM2 > 0) {
		steps.splice(1, 0, {
			title: strings.calculator.explanation.openingsTitle,
			body: interpolate(strings.calculator.explanation.openingsBody, {
				openings: formatAreaM2(result.trace.openingsAreaM2),
				useful: formatAreaM2(result.effectiveAreaM2),
			}),
		})
	}

	if (result.packaging?.mode === 'tiles-per-box' && result.packaging.tilesPerBox) {
		const rawBoxes = result.tilesWithReserve / result.packaging.tilesPerBox
		steps.push({
			title: strings.calculator.explanation.packagingTitle,
			body: interpolate(strings.calculator.explanation.packagingTiles, {
				tiles: result.tilesWithReserve,
				perBox: result.packaging.tilesPerBox,
				rawBoxes: formatNumber(rawBoxes, { maximumFractionDigits: 2 }),
				boxes: result.packaging.boxes,
			}),
		})
		steps.push({
			title: strings.calculator.explanation.purchaseTitle,
			body: interpolate(strings.calculator.explanation.purchaseTiles, {
				purchased: result.packaging.purchasedTiles ?? 0,
				remaining: result.packaging.remainingTiles ?? 0,
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
				boxes: result.packaging.boxes,
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

	return {
		resultKey: `${result.tilesWithReserve}-${result.packaging?.boxes ?? 0}-${result.price?.total ?? 0}`,
		heroHeading,
		heroValue,
		heroUnit,
		details,
		pricePrinciple,
		explanationSteps: steps,
		phaseNote: strings.calculator.explanation.noFakePrecision,
	}
}
