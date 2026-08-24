import type { RefObject } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { getDecimalTextInputProps } from '@/features/tile/input/decimal-keyboard'
import { colors, radii, spacing, typography } from '@/theme'
import { filterDecimalInputText, filterIntegerInputText } from '@/units/decimal-input-text'

export type DimensionInputMode = 'decimal' | 'integer'

interface DimensionFieldProps {
	label: string
	unit: string
	value: string
	errorMessage?: string
	inputMode?: DimensionInputMode
	inputRef?: RefObject<TextInput | null>
	onChangeText: (value: string) => void
	onSubmitEditing?: () => void
	returnKeyType?: 'next' | 'done' | 'go'
}

/**
 * Labeled numeric input that stores raw editable text, not a JS Number.
 * Parsing happens in the form adapter, never while the user is mid-edit.
 */
export function DimensionField({
	label,
	unit,
	value,
	errorMessage,
	inputMode = 'decimal',
	inputRef,
	onChangeText,
	onSubmitEditing,
	returnKeyType = 'done',
}: DimensionFieldProps) {
	const hasError = Boolean(errorMessage)
	const decimalInputProps = inputMode === 'decimal' ? getDecimalTextInputProps() : null

	const handleChangeText = (raw: string) => {
		onChangeText(
			inputMode === 'integer' ? filterIntegerInputText(raw) : filterDecimalInputText(raw),
		)
	}

	return (
		<View style={styles.field}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<View style={[styles.inputRow, hasError && styles.inputRowError]}>
				<TextInput
					ref={inputRef}
					accessibilityLabel={label}
					accessibilityHint={errorMessage ? `${unit}. ${errorMessage}` : unit}
					autoCapitalize="none"
					autoCorrect={false}
					{...(inputMode === 'integer'
						? { keyboardType: 'number-pad' as const }
						: decimalInputProps)}
					onChangeText={handleChangeText}
					onSubmitEditing={onSubmitEditing}
					returnKeyType={returnKeyType}
					style={styles.input}
					value={value}
				/>
				<Text style={styles.unit}>{unit}</Text>
			</View>
			{hasError ? (
				<Text accessibilityRole="alert" style={styles.errorText}>
					{errorMessage}
				</Text>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	field: {
		flex: 1,
		marginBottom: spacing.md,
		minWidth: 140,
	},
	fieldLabel: {
		...typography.subtitle,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	inputRow: {
		alignItems: 'center',
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderRadius: radii.md,
		borderWidth: 1,
		flexDirection: 'row',
		minHeight: 48,
		paddingHorizontal: spacing.md,
	},
	inputRowError: {
		borderColor: colors.error,
	},
	input: {
		color: colors.textPrimary,
		flex: 1,
		...typography.body,
		paddingVertical: spacing.sm,
	},
	unit: {
		...typography.caption,
		color: colors.textSecondary,
		marginLeft: spacing.sm,
	},
	errorText: {
		...typography.caption,
		color: colors.error,
		marginTop: spacing.xs,
	},
})
