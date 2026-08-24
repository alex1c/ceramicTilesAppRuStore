import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing, typography } from '@/theme'

interface ChipOption<T extends string> {
	id: T
	label: string
}

interface ChipRowProps<T extends string> {
	options: ChipOption<T>[]
	selectedId: T
	onSelect: (id: T) => void
}

/** Horizontal wrap of selectable chips with 44dp minimum touch targets. */
export function ChipRow<T extends string>({
	options,
	selectedId,
	onSelect,
}: ChipRowProps<T>) {
	return (
		<View style={styles.wrap}>
			{options.map((option) => {
				const selected = option.id === selectedId

				return (
					<Pressable
						key={option.id}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						onPress={() => onSelect(option.id)}
						style={({ pressed }) => [
							styles.chip,
							selected && styles.chipSelected,
							pressed && styles.chipPressed,
						]}
					>
						<Text style={[styles.label, selected && styles.labelSelected]}>
							{option.label}
						</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.sm,
		marginBottom: spacing.md,
	},
	chip: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderRadius: radii.md,
		borderWidth: 1,
		minHeight: 44,
		justifyContent: 'center',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	chipSelected: {
		backgroundColor: colors.chip,
		borderColor: colors.accent,
	},
	chipPressed: {
		opacity: 0.85,
	},
	label: {
		...typography.caption,
		color: colors.textPrimary,
		fontWeight: '600',
	},
	labelSelected: {
		color: colors.accent,
	},
})
