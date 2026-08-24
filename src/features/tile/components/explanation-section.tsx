import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { PresentedExplanationStep } from '@/features/tile/presenter/present-tile-result'
import { t } from '@/i18n'
import { colors, radii, spacing, typography } from '@/theme'

interface ExplanationSectionProps {
	expanded: boolean
	onToggle: () => void
	steps: PresentedExplanationStep[]
	phaseNote: string
}

/** Expandable "How we calculated" section built from presenter steps. */
export function ExplanationSection({
	expanded,
	onToggle,
	steps,
	phaseNote,
}: ExplanationSectionProps) {
	const strings = t()

	return (
		<View style={styles.container}>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded }}
				accessibilityHint={
					expanded
						? strings.calculator.explanation.toggleHintExpanded
						: strings.calculator.explanation.toggleHintCollapsed
				}
				onPress={onToggle}
				style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
			>
				<Text style={styles.toggleLabel}>{strings.calculator.explanation.toggleLabel}</Text>
				<Text style={styles.toggleIcon}>{expanded ? '▾' : '▸'}</Text>
			</Pressable>

			{expanded ? (
				<View style={styles.content}>
					{steps.map((step, index) => (
						<View key={`${step.title}-${index}`} style={styles.stepCard}>
							<Text style={styles.stepTitle}>
								{index + 1}. {step.title}
							</Text>
							<Text style={styles.stepBody}>{step.body}</Text>
						</View>
					))}
					<Text style={styles.phaseNote}>{phaseNote}</Text>
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		borderTopColor: colors.border,
		borderTopWidth: 1,
		marginTop: spacing.lg,
		paddingTop: spacing.md,
	},
	toggle: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		minHeight: 44,
	},
	togglePressed: {
		opacity: 0.85,
	},
	toggleLabel: {
		...typography.subtitle,
		color: colors.accent,
		flex: 1,
	},
	toggleIcon: {
		...typography.subtitle,
		color: colors.accent,
		marginLeft: spacing.sm,
	},
	content: {
		marginTop: spacing.sm,
	},
	stepCard: {
		backgroundColor: colors.background,
		borderRadius: radii.md,
		marginBottom: spacing.sm,
		padding: spacing.md,
	},
	stepTitle: {
		...typography.subtitle,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	stepBody: {
		...typography.body,
		color: colors.textSecondary,
	},
	phaseNote: {
		...typography.caption,
		color: colors.warning,
		marginTop: spacing.sm,
	},
})
