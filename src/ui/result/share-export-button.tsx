import { Pressable, StyleSheet, Text } from 'react-native'
import { t } from '@/i18n'
import { colors, radii, spacing, typography } from '@/theme'

interface ShareExportButtonProps {
	onPress: () => void
}

/** Secondary CTA shown only after a successful calculation. */
export function ShareExportButton({ onPress }: ShareExportButtonProps) {
	const label = t().calculator.share.button

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			style={({ pressed }) => [styles.button, pressed && styles.pressed]}
		>
			<Text style={styles.label}>{label}</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		backgroundColor: colors.surface,
		borderColor: colors.accent,
		borderRadius: radii.md,
		borderWidth: 1.5,
		marginTop: spacing.md,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	label: {
		...typography.subtitle,
		color: colors.accent,
	},
	pressed: {
		opacity: 0.85,
	},
})
