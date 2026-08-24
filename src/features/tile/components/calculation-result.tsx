import { StyleSheet, Text, View } from 'react-native'
import type { PresentedTileResult } from '@/features/tile/presenter/present-tile-result'
import { colors, radii, spacing, typography } from '@/theme'
import { ExplanationSection } from './explanation-section'

interface CalculationResultProps {
	result: PresentedTileResult
	explanationExpanded: boolean
	onToggleExplanation: () => void
}

/** Primary result card — packaging/tile hero plus expandable explanation. */
export function CalculationResult({
	result,
	explanationExpanded,
	onToggleExplanation,
}: CalculationResultProps) {
	return (
		<View
			key={result.resultKey}
			accessibilityLiveRegion="polite"
			style={styles.container}
		>
			<Text style={styles.heading}>{result.heroHeading}</Text>
			<View style={styles.heroRow}>
				<Text
					accessibilityLabel={`${result.heroHeading} ${result.heroValue} ${result.heroUnit}`}
					style={styles.heroValue}
				>
					{result.heroValue}
				</Text>
				<Text style={styles.heroUnit}>{result.heroUnit}</Text>
			</View>
			{result.details.map((line) => (
				<Text key={line} style={styles.meta}>
					{line}
				</Text>
			))}
			{result.pricePrinciple ? (
				<Text style={styles.principle}>{result.pricePrinciple}</Text>
			) : null}
			<ExplanationSection
				expanded={explanationExpanded}
				onToggle={onToggleExplanation}
				phaseNote={result.phaseNote}
				steps={result.explanationSteps}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderRadius: radii.lg,
		borderWidth: 1,
		marginTop: spacing.lg,
		padding: spacing.lg,
	},
	heading: {
		...typography.subtitle,
		color: colors.textSecondary,
	},
	heroRow: {
		alignItems: 'baseline',
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		marginBottom: spacing.sm,
		marginTop: spacing.xs,
	},
	heroValue: {
		...typography.title,
		color: colors.success,
		fontSize: 40,
		lineHeight: 48,
	},
	heroUnit: {
		...typography.subtitle,
		color: colors.textPrimary,
		flexShrink: 1,
	},
	meta: {
		...typography.body,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	principle: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: spacing.sm,
	},
})
