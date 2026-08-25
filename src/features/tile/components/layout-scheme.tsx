import { useMemo, useState } from 'react'
import {
	LayoutChangeEvent,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import type {
	LayoutCalculationSummary,
	LayoutPatternId,
	QuantityMode,
	SchemeOpening,
	SurfaceLayoutPanel,
} from '@/domain/tile'
import { formatNumber, t } from '@/i18n'
import { colors, radii, spacing, typography } from '@/theme'
import { buildOffsetVerticalRatios } from './layout-scheme-grid'

/** Cap schematic grid lines so large rooms stay cheap to render. */
const MAX_GRID_LINES = 12
/** Soft max height so elongated rooms stay compact. */
const MAX_SCHEME_HEIGHT = 220
const MIN_SCHEME_HEIGHT = 120
const MAX_PANELS = 2
/** Visible on-device while remaining subordinate to surface/opening outlines. */
const GRID_LINE_COLOR = '#B8C9C6'

export interface LayoutSchemeProps {
	layout: LayoutCalculationSummary
}

/**
 * Compact explanatory diagram driven by domain layout output.
 * Layer order (critical): surface → tile grid (may transform) → openings (fixed).
 * Openings must NEVER inherit diagonal/offset transforms.
 */
export function LayoutScheme({ layout }: LayoutSchemeProps) {
	const strings = t()
	const panels = layout.panels.slice(0, MAX_PANELS)
	const moreCount = layout.panels.length - panels.length
	const showCutLegend = layout.quantityMode === 'layout-straight'
	const [containerWidth, setContainerWidth] = useState(0)

	if (panels.length === 0) {
		return null
	}

	const handleLayout = (event: LayoutChangeEvent) => {
		const next = Math.floor(event.nativeEvent.layout.width)
		if (next > 0 && next !== containerWidth) {
			setContainerWidth(next)
		}
	}

	return (
		<View
			accessibilityRole="image"
			onLayout={handleLayout}
			style={styles.wrapper}
		>
			<Text style={styles.title}>{strings.calculator.result.schemeTitle}</Text>
			{panels.map((panel, index) => (
				<SchemePanel
					key={panel.id}
					panel={panel}
					layoutPattern={layout.layoutPattern}
					quantityMode={layout.quantityMode}
					openings={index === 0 ? layout.schemeOpenings : []}
					availableWidth={containerWidth}
				/>
			))}
			{moreCount > 0 ? <Text style={styles.note}>+{moreCount}</Text> : null}
			{showCutLegend ? (
				<View style={styles.legendRow}>
					<View style={styles.legendItem}>
						<View style={[styles.legendSwatch, styles.legendFull]} />
						<Text style={styles.legendText}>
							{strings.calculator.result.schemeLegendFull}
						</Text>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.legendSwatch, styles.legendCut]} />
						<Text style={styles.legendText}>
							{strings.calculator.result.schemeLegendCut}
						</Text>
					</View>
				</View>
			) : null}
			<Text style={styles.note}>{strings.calculator.result.schemeEstimateNote}</Text>
			{layout.openingsEstimated ? (
				<Text style={styles.note}>{strings.calculator.result.schemeOpeningsNote}</Text>
			) : null}
		</View>
	)
}

interface SchemePanelProps {
	panel: SurfaceLayoutPanel
	layoutPattern: LayoutPatternId
	quantityMode: QuantityMode
	openings: SchemeOpening[]
	availableWidth: number
}

function SchemePanel({
	panel,
	layoutPattern,
	quantityMode,
	openings,
	availableWidth,
}: SchemePanelProps) {
	const strings = t()
	const { rect } = panel
	const isLayoutAware = quantityMode === 'layout-straight'
	const showCuts =
		isLayoutAware &&
		(rect.remainderWidthMm > 0 || rect.remainderHeightMm > 0)

	const aspect = Math.max(
		0.35,
		Math.min(2.8, rect.surfaceWidthMm / Math.max(1, rect.surfaceHeightMm)),
	)

	/*
	 * Prefer ~90% of result-card width; fall back until onLayout measures.
	 * Height is capped so tall/narrow rooms do not dominate the card.
	 */
	const targetWidth =
		availableWidth > 0
			? Math.max(160, Math.floor(availableWidth * 0.92))
			: 280
	const heightFromWidth = Math.round(targetWidth / aspect)
	const schemeHeight = Math.min(
		MAX_SCHEME_HEIGHT,
		Math.max(MIN_SCHEME_HEIGHT, heightFromWidth),
	)
	const schemeWidth = Math.min(targetWidth, Math.round(schemeHeight * aspect))

	const grid = useMemo(
		() =>
			buildGridLines(
				rect.fullColumns,
				rect.fullRows,
				rect.remainderWidthMm > 0,
				rect.remainderHeightMm > 0,
			),
		[
			rect.fullColumns,
			rect.fullRows,
			rect.remainderWidthMm,
			rect.remainderHeightMm,
		],
	)

	const offsetFraction =
		layoutPattern === 'offset-half'
			? 0.5
			: layoutPattern === 'offset-third'
				? 1 / 3
				: 0
	const isDiagonal = layoutPattern === 'diagonal'

	/*
	 * Opening boxes stay in surface (outer) coordinates — never inside the
	 * transformed grid layer.
	 */
	const openingBoxes = openings.map((opening, index) => {
		const refW = rect.surfaceWidthMm / 1000
		const refH = rect.surfaceHeightMm / 1000
		const wRatio = Math.min(0.55, opening.widthM / Math.max(refW, 0.01))
		const hRatio = Math.min(0.7, opening.heightM / Math.max(refH, 0.01))
		const left = 0.12 + (index % 2) * 0.28
		const bottom = opening.kind === 'door' ? 0 : 0.22
		return {
			key: `${opening.kind}-${index}`,
			wRatio,
			hRatio,
			left,
			bottom,
			kind: opening.kind,
		}
	})

	const surfaceWMeters = rect.surfaceWidthMm / 1000
	const surfaceHMeters = rect.surfaceHeightMm / 1000
	const tileWCm = rect.tileWidthMm / 10
	const tileHCm = rect.tileHeightMm / 10

	const dimsLabel =
		panel.labelKind === 'floor'
			? interpolate(strings.calculator.result.schemeLabelFloor, {
					length: formatRuMeters(surfaceWMeters),
					width: formatRuMeters(surfaceHMeters),
					tileW: formatRuCm(tileWCm),
					tileH: formatRuCm(tileHCm),
				})
			: interpolate(strings.calculator.result.schemeLabelWall, {
					number: String((panel.wallIndex ?? 0) + 1),
					width: formatRuMeters(surfaceWMeters),
					height: formatRuMeters(surfaceHMeters),
					tileW: formatRuCm(tileWCm),
					tileH: formatRuCm(tileHCm),
				})

	return (
		<View style={styles.panelBlock}>
			{/* Fixed surface boundary — never rotated. */}
			<View
				style={[
					styles.surfaceOuter,
					{ width: schemeWidth, height: schemeHeight },
				]}
			>
				{/*
				 * Tile grid layer only. Diagonal rotate/scale applies here.
				 * overflow:hidden on the parent clips lines to the surface.
				 */}
				<View style={styles.gridClip}>
					<View
						style={[
							styles.gridLayer,
							isDiagonal && styles.diagonalGridTransform,
						]}
					>
						<View
							style={[
								styles.fullRegion,
								showCuts && rect.remainderWidthMm > 0
									? { right: '12%' }
									: null,
								showCuts && rect.remainderHeightMm > 0
									? { bottom: '12%' }
									: null,
							]}
						>
							{offsetFraction === 0 ? grid.vertical.map((ratio) => (
								<View
									key={`v-${ratio}`}
									style={[styles.gridV, { left: `${ratio * 100}%` }]}
								/>
							)) : Array.from({ length: grid.rowSlots }, (_, rowIndex) => {
								const shiftedRatios = buildOffsetVerticalRatios(
									grid.vertical,
									rowIndex,
									offsetFraction,
									grid.colSlots,
								)
								return (
									<View
										key={`offset-row-${rowIndex}`}
										style={[
											styles.offsetGridRow,
											{
												top: `${(rowIndex / grid.rowSlots) * 100}%`,
												height: `${100 / grid.rowSlots}%`,
											},
										]}
									>
										{shiftedRatios.map((ratio) => (
											<View
												key={`v-${ratio}`}
												style={[
													styles.gridV,
													{ left: `${ratio * 100}%` },
												]}
											/>
										))}
									</View>
								)
							})}
							{grid.horizontal.map((ratio) => (
								<View
									key={`h-${ratio}`}
									style={[
										styles.gridH,
										{
											top: `${ratio * 100}%`,
											/*
											 * Offset shifts alternating rows of the GRID only —
											 * openings stay outside this layer.
											 */
										},
									]}
								/>
							))}
						</View>

						{showCuts && rect.remainderWidthMm > 0 ? (
							<View style={styles.edgeVertical} />
						) : null}
						{showCuts && rect.remainderHeightMm > 0 ? (
							<View style={styles.edgeHorizontal} />
						) : null}
						{showCuts &&
						rect.remainderWidthMm > 0 &&
						rect.remainderHeightMm > 0 ? (
							<View style={styles.corner} />
						) : null}
					</View>
				</View>

				{/*
				 * Openings: opaque mask + outline above the grid, surface coords.
				 * Axis-aligned for straight / diagonal / offset alike.
				 */}
				{openingBoxes.map((box) => (
					<View
						key={box.key}
						style={[
							styles.opening,
							{
								width: `${box.wRatio * 100}%`,
								height: `${box.hRatio * 100}%`,
								left: `${box.left * 100}%`,
								bottom: `${box.bottom * 100}%`,
							},
						]}
					/>
				))}
			</View>
			<Text style={styles.dims}>{dimsLabel}</Text>
		</View>
	)
}

function interpolate(
	template: string,
	values: Record<string, string | number>,
): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

function formatRuMeters(meters: number): string {
	return formatNumber(meters, { maximumFractionDigits: 2 })
}

function formatRuCm(cm: number): string {
	return formatNumber(cm, { maximumFractionDigits: 1 })
}

function buildGridLines(
	fullColumns: number,
	fullRows: number,
	hasVertEdge: boolean,
	hasHorizEdge: boolean,
): { vertical: number[]; horizontal: number[]; colSlots: number; rowSlots: number } {
	const colSlots = Math.min(
		MAX_GRID_LINES,
		Math.max(1, fullColumns + (hasVertEdge ? 1 : 0)),
	)
	const rowSlots = Math.min(
		MAX_GRID_LINES,
		Math.max(1, fullRows + (hasHorizEdge ? 1 : 0)),
	)

	const vertical: number[] = []
	for (let i = 1; i < colSlots; i += 1) {
		vertical.push(i / colSlots)
	}

	const horizontal: number[] = []
	for (let i = 1; i < rowSlots; i += 1) {
		horizontal.push(i / rowSlots)
	}

	return { vertical, horizontal, colSlots, rowSlots }
}

const styles = StyleSheet.create({
	wrapper: {
		alignSelf: 'stretch',
		marginBottom: spacing.md,
		marginTop: spacing.sm,
	},
	title: {
		...typography.caption,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	panelBlock: {
		marginBottom: spacing.sm,
	},
	surfaceOuter: {
		alignSelf: 'center',
		backgroundColor: colors.background,
		borderColor: colors.border,
		borderRadius: radii.md,
		borderWidth: 1,
		maxWidth: '100%',
		overflow: 'hidden',
		position: 'relative',
	},
	gridClip: {
		...StyleSheet.absoluteFill,
		overflow: 'hidden',
	},
	gridLayer: {
		...StyleSheet.absoluteFill,
	},
	/*
	 * Diagonal transform is isolated to the grid layer.
	 * Scale compensates so rotated lines still fill the clipped surface.
	 */
	diagonalGridTransform: {
		transform: [{ rotate: '-28deg' }, { scale: 1.55 }],
	},
	fullRegion: {
		backgroundColor: '#E8F5E9',
		bottom: 0,
		left: 0,
		position: 'absolute',
		right: 0,
		top: 0,
	},
	gridV: {
		backgroundColor: GRID_LINE_COLOR,
		bottom: 0,
		position: 'absolute',
		top: 0,
		width: 1,
	},
	gridH: {
		backgroundColor: GRID_LINE_COLOR,
		height: 1,
		left: 0,
		position: 'absolute',
		right: 0,
	},
	offsetGridRow: {
		left: 0,
		overflow: 'hidden',
		position: 'absolute',
		right: 0,
	},
	edgeVertical: {
		backgroundColor: '#FFF3E0',
		borderLeftColor: colors.warning,
		borderLeftWidth: 1,
		bottom: 0,
		position: 'absolute',
		right: 0,
		top: 0,
		width: '12%',
	},
	edgeHorizontal: {
		backgroundColor: '#FFF3E0',
		borderTopColor: colors.warning,
		borderTopWidth: 1,
		bottom: 0,
		height: '12%',
		left: 0,
		position: 'absolute',
		right: 0,
	},
	corner: {
		backgroundColor: '#FFE0B2',
		bottom: 0,
		height: '12%',
		position: 'absolute',
		right: 0,
		width: '12%',
	},
	opening: {
		backgroundColor: colors.surface,
		borderColor: colors.textPrimary,
		borderStyle: 'dashed',
		borderWidth: 1.5,
		position: 'absolute',
		zIndex: 2,
	},
	dims: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	note: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	legendRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.md,
		marginTop: spacing.xs,
	},
	legendItem: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: spacing.xs,
	},
	legendSwatch: {
		borderColor: colors.border,
		borderWidth: 1,
		height: 12,
		width: 16,
	},
	legendFull: {
		backgroundColor: '#E8F5E9',
	},
	legendCut: {
		backgroundColor: '#FFF3E0',
		borderStyle: 'dashed',
	},
	legendText: {
		...typography.caption,
		color: colors.textSecondary,
	},
})
