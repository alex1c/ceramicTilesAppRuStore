import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Switch,
	Text,
	View,
} from 'react-native'
import { ScreenContainer } from '@/components/screen-container'
import {
	RECOMMENDED_RESERVE_PERCENT,
	TILE_PRESETS_CM,
	TILES_PER_BOX_PRESETS,
	calculateTiles,
	type LayoutPatternId,
	type OpeningKind,
	type PackagingMode,
	type PriceMode,
	type SurfaceKind,
} from '@/domain/tile'
import { CalculationResult } from '@/features/tile/components/calculation-result'
import { ChipRow } from '@/features/tile/components/chip-row'
import { DimensionField } from '@/features/tile/components/dimension-field'
import {
	DEFAULT_TILE_FORM,
	applyTilePreset,
	parseTileForm,
	type FormFieldErrors,
	type OpeningFormRow,
	type TileFormValues,
	type TilePresetId,
} from '@/features/tile/input/parse-tile-form'
import {
	mapDomainError,
	mapFieldError,
	presentTileResult,
	type PresentedTileResult,
} from '@/features/tile/presenter/present-tile-result'
import { t } from '@/i18n'
import { getAnalyticsService } from '@/services/analytics'
import { colors, radii, spacing, typography } from '@/theme'

function createId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Main calculator screen. Formulas live in `src/domain/tile`; this file only
 * orchestrates input, presentation, and analytics events.
 */
export function TileCalculatorScreen() {
	const strings = t()
	const [form, setForm] = useState<TileFormValues>(DEFAULT_TILE_FORM)
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({})
	const [domainError, setDomainError] = useState<string | null>(null)
	const [presented, setPresented] = useState<PresentedTileResult | null>(null)
	const [explanationExpanded, setExplanationExpanded] = useState(false)

	useEffect(() => {
		const analytics = getAnalyticsService()
		analytics.screen('tile_calculator')
		analytics.track('calculator_opened')
	}, [])

	const updateForm = useCallback((patch: Partial<TileFormValues>) => {
		setForm((current) => ({ ...current, ...patch }))
		setPresented(null)
		setDomainError(null)
	}, [])

	const tilePresetOptions = useMemo(
		() => [
			...TILE_PRESETS_CM.map((preset) => ({
				id: `${preset.widthCm}x${preset.heightCm}` as TilePresetId,
				label: `${preset.widthCm}×${preset.heightCm}`,
			})),
			{ id: 'custom' as const, label: strings.calculator.tile.custom },
		],
		[strings.calculator.tile.custom],
	)

	const handleCalculate = useCallback(() => {
		const parsed = parseTileForm(form)
		if (!parsed.ok) {
			setFieldErrors(parsed.errors)
			setPresented(null)
			return
		}

		setFieldErrors({})
		const outcome = calculateTiles(parsed.input)
		if (!outcome.ok) {
			setDomainError(mapDomainError(outcome.error.code))
			setPresented(null)
			return
		}

		setDomainError(null)
		setPresented(presentTileResult(outcome.result))
		getAnalyticsService().track('calculation_completed')
	}, [form])

	const handleLayoutSelect = (layoutPattern: LayoutPatternId) => {
		const recommended = RECOMMENDED_RESERVE_PERCENT[layoutPattern]
		updateForm({
			layoutPattern,
			reservePreset: String(recommended) as TileFormValues['reservePreset'],
			reserveCustom: String(recommended),
		})
		getAnalyticsService().track('layout_selected')
	}

	const fieldError = (key: string) =>
		fieldErrors[key] ? mapFieldError(fieldErrors[key]) : undefined

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.flex}
		>
			<ScreenContainer scroll>
				<Text style={styles.title}>{strings.app.title}</Text>
				<Text style={styles.subtitle}>{strings.app.subtitle}</Text>
				<Text style={styles.intro}>{strings.calculator.intro}</Text>

				<Text style={styles.section}>{strings.calculator.surface.title}</Text>
				<ChipRow
					options={[
						{ id: 'floor', label: strings.calculator.surface.floor },
						{ id: 'walls', label: strings.calculator.surface.walls },
					]}
					selectedId={form.surfaceKind}
					onSelect={(surfaceKind: SurfaceKind) => {
						updateForm({ surfaceKind })
						getAnalyticsService().track(
							surfaceKind === 'floor' ? 'surface_floor' : 'surface_wall',
						)
					}}
				/>

				{form.surfaceKind === 'floor' ? (
					<View style={styles.row}>
						<DimensionField
							label={strings.calculator.surface.length}
							unit={strings.calculator.units.meters}
							value={form.floorLength}
							errorMessage={fieldError('floorLength')}
							onChangeText={(floorLength) => updateForm({ floorLength })}
						/>
						<DimensionField
							label={strings.calculator.surface.width}
							unit={strings.calculator.units.meters}
							value={form.floorWidth}
							errorMessage={fieldError('floorWidth')}
							onChangeText={(floorWidth) => updateForm({ floorWidth })}
						/>
					</View>
				) : (
					<WallsEditor
						form={form}
						fieldError={fieldError}
						onChange={updateForm}
					/>
				)}

				<Text style={styles.section}>{strings.calculator.tile.title}</Text>
				<ChipRow
					options={tilePresetOptions}
					selectedId={form.tilePresetId}
					onSelect={(tilePresetId: TilePresetId) => {
						updateForm(applyTilePreset(tilePresetId))
						getAnalyticsService().track(
							tilePresetId === 'custom' ? 'custom_tile_used' : 'tile_preset_selected',
						)
					}}
				/>
				{form.tilePresetId === 'custom' ? (
					<View style={styles.row}>
						<DimensionField
							label={strings.calculator.tile.width}
							unit={strings.calculator.units.centimeters}
							value={form.tileWidth}
							errorMessage={fieldError('tileWidth')}
							onChangeText={(tileWidth) => updateForm({ tileWidth })}
						/>
						<DimensionField
							label={strings.calculator.tile.height}
							unit={strings.calculator.units.centimeters}
							value={form.tileHeight}
							errorMessage={fieldError('tileHeight')}
							onChangeText={(tileHeight) => updateForm({ tileHeight })}
						/>
					</View>
				) : null}

				<Text style={styles.section}>{strings.calculator.layout.title}</Text>
				<ChipRow
					options={[
						{ id: 'straight', label: strings.calculator.layout.straight },
						{ id: 'diagonal', label: strings.calculator.layout.diagonal },
						{ id: 'offset-half', label: strings.calculator.layout.offsetHalf },
						{ id: 'offset-third', label: strings.calculator.layout.offsetThird },
					]}
					selectedId={form.layoutPattern}
					onSelect={handleLayoutSelect}
				/>
				<Text style={styles.hint}>
					{strings.calculator.layout.reserveHint.replace(
						'{percent}',
						String(RECOMMENDED_RESERVE_PERCENT[form.layoutPattern]),
					)}
				</Text>

				<Text style={styles.section}>{strings.calculator.reserve.title}</Text>
				<ChipRow
					options={[
						{ id: '0', label: '0%' },
						{ id: '5', label: '5%' },
						{ id: '10', label: '10%' },
						{ id: '15', label: '15%' },
						{ id: 'custom', label: strings.calculator.reserve.custom },
					]}
					selectedId={form.reservePreset}
					onSelect={(reservePreset: TileFormValues['reservePreset']) => {
						updateForm({ reservePreset })
						getAnalyticsService().track('reserve_changed')
					}}
				/>
				{form.reservePreset === 'custom' ? (
					<DimensionField
						label={strings.calculator.reserve.custom}
						unit={strings.calculator.units.percent}
						value={form.reserveCustom}
						errorMessage={fieldError('reserveCustom')}
						onChangeText={(reserveCustom) => updateForm({ reserveCustom })}
					/>
				) : null}

				<OptionalSection
					title={strings.calculator.packaging.title}
					enabled={form.packagingEnabled}
					onToggle={(packagingEnabled) => {
						updateForm({ packagingEnabled })
						if (packagingEnabled) {
							getAnalyticsService().track('package_enabled')
						}
					}}
					enableLabel={strings.calculator.packaging.enable}
				>
					<ChipRow
						options={[
							{ id: 'tiles-per-box', label: strings.calculator.packaging.tilesPerBox },
							{ id: 'area-per-box', label: strings.calculator.packaging.areaPerBox },
						]}
						selectedId={form.packagingMode}
						onSelect={(packagingMode: PackagingMode) => {
							updateForm({ packagingMode })
							getAnalyticsService().track(
								packagingMode === 'tiles-per-box'
									? 'package_mode_tiles'
									: 'package_mode_area',
							)
						}}
					/>
					{form.packagingMode === 'tiles-per-box' ? (
						<>
							<ChipRow
								options={[
									...TILES_PER_BOX_PRESETS.map((count) => ({
										id: String(count) as TileFormValues['tilesPerBoxPreset'],
										label: String(count),
									})),
									{
										id: 'custom' as const,
										label: strings.calculator.packaging.otherCount,
									},
								]}
								selectedId={form.tilesPerBoxPreset}
								onSelect={(tilesPerBoxPreset: TileFormValues['tilesPerBoxPreset']) =>
									updateForm({ tilesPerBoxPreset })
								}
							/>
							{form.tilesPerBoxPreset === 'custom' ? (
								<DimensionField
									label={strings.calculator.packaging.tilesCount}
									unit=""
									inputMode="integer"
									value={form.tilesPerBoxCustom}
									errorMessage={fieldError('tilesPerBox')}
									onChangeText={(tilesPerBoxCustom) =>
										updateForm({ tilesPerBoxCustom })
									}
								/>
							) : null}
						</>
					) : (
						<DimensionField
							label={strings.calculator.packaging.boxArea}
							unit={strings.calculator.units.squareMeters}
							value={form.boxArea}
							errorMessage={fieldError('boxArea')}
							onChangeText={(boxArea) => updateForm({ boxArea })}
						/>
					)}
				</OptionalSection>

				<OptionalSection
					title={strings.calculator.price.title}
					enabled={form.priceEnabled}
					onToggle={(priceEnabled) => {
						updateForm({ priceEnabled })
						if (priceEnabled) {
							getAnalyticsService().track('price_enabled')
						}
					}}
					enableLabel={strings.calculator.price.enable}
				>
					<ChipRow
						options={[
							{ id: 'per-tile', label: strings.calculator.price.perTile },
							{ id: 'per-box', label: strings.calculator.price.perBox },
							{ id: 'per-m2', label: strings.calculator.price.perM2 },
						]}
						selectedId={form.priceMode}
						onSelect={(priceMode: PriceMode) => {
							updateForm({ priceMode })
							getAnalyticsService().track(
								priceMode === 'per-tile'
									? 'price_mode_tile'
									: priceMode === 'per-box'
										? 'price_mode_box'
										: 'price_mode_m2',
							)
						}}
					/>
					{form.priceMode === 'per-box' && !form.packagingEnabled ? (
						<Text style={styles.warning}>
							{strings.calculator.price.boxRequiresPackaging}
						</Text>
					) : (
						<DimensionField
							label={strings.calculator.price.amount}
							unit={strings.calculator.units.currency}
							value={form.priceAmount}
							errorMessage={fieldError('priceAmount')}
							onChangeText={(priceAmount) => updateForm({ priceAmount })}
						/>
					)}
				</OptionalSection>

				<Pressable
					accessibilityRole="button"
					onPress={handleCalculate}
					style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
				>
					<Text style={styles.buttonLabel}>{strings.calculator.calculate}</Text>
				</Pressable>

				{domainError ? (
					<Text accessibilityRole="alert" style={styles.error}>
						{domainError}
					</Text>
				) : null}

				{presented ? (
					<CalculationResult
						explanationExpanded={explanationExpanded}
						onToggleExplanation={() => setExplanationExpanded((value) => !value)}
						result={presented}
					/>
				) : null}
			</ScreenContainer>
		</KeyboardAvoidingView>
	)
}

interface WallsEditorProps {
	form: TileFormValues
	fieldError: (key: string) => string | undefined
	onChange: (patch: Partial<TileFormValues>) => void
}

function WallsEditor({ form, fieldError, onChange }: WallsEditorProps) {
	const strings = t()

	const updateWall = (id: string, patch: Partial<{ width: string; height: string }>) => {
		onChange({
			walls: form.walls.map((wall) => (wall.id === id ? { ...wall, ...patch } : wall)),
		})
	}

	const updateOpening = (
		id: string,
		patch: Partial<Pick<OpeningFormRow, 'width' | 'height'>>,
	) => {
		onChange({
			openings: form.openings.map((opening) =>
				opening.id === id ? { ...opening, ...patch } : opening,
			),
		})
	}

	const addOpening = (kind: OpeningKind) => {
		onChange({
			openings: [...form.openings, { id: createId(kind), kind, width: '', height: '' }],
		})
		getAnalyticsService().track('opening_added')
	}

	return (
		<View>
			{form.walls.map((wall, index) => (
				<View key={wall.id} style={styles.card}>
					<View style={styles.cardHeader}>
						<Text style={styles.cardTitle}>
							{strings.calculator.surface.wallTitle.replace(
								'{number}',
								String(index + 1),
							)}
						</Text>
						{form.walls.length > 1 ? (
							<Pressable
								accessibilityRole="button"
								onPress={() =>
									onChange({ walls: form.walls.filter((item) => item.id !== wall.id) })
								}
							>
								<Text style={styles.remove}>{strings.calculator.surface.removeWall}</Text>
							</Pressable>
						) : null}
					</View>
					<View style={styles.row}>
						<DimensionField
							label={strings.calculator.surface.width}
							unit={strings.calculator.units.meters}
							value={wall.width}
							errorMessage={fieldError(`wall-${wall.id}-width`)}
							onChangeText={(width) => updateWall(wall.id, { width })}
						/>
						<DimensionField
							label={strings.calculator.surface.height}
							unit={strings.calculator.units.meters}
							value={wall.height}
							errorMessage={fieldError(`wall-${wall.id}-height`)}
							onChangeText={(height) => updateWall(wall.id, { height })}
						/>
					</View>
				</View>
			))}

			<Pressable
				accessibilityRole="button"
				onPress={() => {
					onChange({
						walls: [...form.walls, { id: createId('wall'), width: '', height: '' }],
					})
					getAnalyticsService().track('wall_added')
				}}
				style={styles.linkButton}
			>
				<Text style={styles.linkLabel}>{strings.calculator.surface.addWall}</Text>
			</Pressable>

			<Text style={styles.section}>{strings.calculator.openings.title}</Text>
			{form.openings.length === 0 ? (
				<Text style={styles.hint}>{strings.calculator.openings.empty}</Text>
			) : null}
			{form.openings.map((opening) => (
				<View key={opening.id} style={styles.card}>
					<View style={styles.cardHeader}>
						<Text style={styles.cardTitle}>
							{opening.kind === 'door'
								? strings.calculator.openings.door
								: opening.kind === 'window'
									? strings.calculator.openings.window
									: strings.calculator.openings.other}
						</Text>
						<Pressable
							accessibilityRole="button"
							onPress={() =>
								onChange({
									openings: form.openings.filter((item) => item.id !== opening.id),
								})
							}
						>
							<Text style={styles.remove}>{strings.calculator.openings.remove}</Text>
						</Pressable>
					</View>
					<View style={styles.row}>
						<DimensionField
							label={strings.calculator.surface.width}
							unit={strings.calculator.units.meters}
							value={opening.width}
							errorMessage={fieldError(`opening-${opening.id}-width`)}
							onChangeText={(width) => updateOpening(opening.id, { width })}
						/>
						<DimensionField
							label={strings.calculator.surface.height}
							unit={strings.calculator.units.meters}
							value={opening.height}
							errorMessage={fieldError(`opening-${opening.id}-height`)}
							onChangeText={(height) => updateOpening(opening.id, { height })}
						/>
					</View>
				</View>
			))}
			<View style={styles.rowWrap}>
				<Pressable onPress={() => addOpening('door')} style={styles.linkButton}>
					<Text style={styles.linkLabel}>{strings.calculator.openings.addDoor}</Text>
				</Pressable>
				<Pressable onPress={() => addOpening('window')} style={styles.linkButton}>
					<Text style={styles.linkLabel}>{strings.calculator.openings.addWindow}</Text>
				</Pressable>
				<Pressable onPress={() => addOpening('other')} style={styles.linkButton}>
					<Text style={styles.linkLabel}>{strings.calculator.openings.addOther}</Text>
				</Pressable>
			</View>
		</View>
	)
}

interface OptionalSectionProps {
	title: string
	enableLabel: string
	enabled: boolean
	onToggle: (enabled: boolean) => void
	children: ReactNode
}

function OptionalSection({
	title,
	enableLabel,
	enabled,
	onToggle,
	children,
}: OptionalSectionProps) {
	return (
		<View style={styles.optional}>
			<View style={styles.cardHeader}>
				<Text style={styles.section}>{title}</Text>
				<Switch
					accessibilityLabel={enableLabel}
					onValueChange={onToggle}
					value={enabled}
				/>
			</View>
			<Text style={styles.hint}>{enableLabel}</Text>
			{enabled ? children : null}
		</View>
	)
}

const styles = StyleSheet.create({
	flex: {
		flex: 1,
	},
	title: {
		...typography.title,
		color: colors.textPrimary,
	},
	subtitle: {
		...typography.body,
		color: colors.textSecondary,
		marginBottom: spacing.sm,
		marginTop: spacing.xs,
	},
	intro: {
		...typography.caption,
		color: colors.textSecondary,
		marginBottom: spacing.lg,
	},
	section: {
		...typography.subtitle,
		color: colors.textPrimary,
		marginBottom: spacing.sm,
		marginTop: spacing.md,
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
	},
	rowWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
	},
	hint: {
		...typography.caption,
		color: colors.textSecondary,
		marginBottom: spacing.md,
	},
	card: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderRadius: radii.md,
		borderWidth: 1,
		marginBottom: spacing.md,
		padding: spacing.md,
	},
	cardHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
	},
	cardTitle: {
		...typography.subtitle,
		color: colors.textPrimary,
	},
	remove: {
		...typography.caption,
		color: colors.error,
		minHeight: 44,
		paddingTop: spacing.sm,
	},
	linkButton: {
		minHeight: 44,
		justifyContent: 'center',
		marginBottom: spacing.sm,
	},
	linkLabel: {
		...typography.subtitle,
		color: colors.accent,
	},
	optional: {
		marginTop: spacing.sm,
	},
	warning: {
		...typography.caption,
		color: colors.warning,
		marginBottom: spacing.md,
	},
	button: {
		alignItems: 'center',
		backgroundColor: colors.accent,
		borderRadius: radii.md,
		justifyContent: 'center',
		marginTop: spacing.lg,
		minHeight: 52,
		paddingHorizontal: spacing.lg,
	},
	buttonPressed: {
		backgroundColor: colors.accentPressed,
	},
	buttonLabel: {
		...typography.subtitle,
		color: colors.surface,
	},
	error: {
		...typography.body,
		color: colors.error,
		marginTop: spacing.md,
	},
})
