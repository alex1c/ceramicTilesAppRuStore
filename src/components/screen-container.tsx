import { PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '@/theme'

interface ScreenContainerProps extends PropsWithChildren {
	scroll?: boolean
	style?: ViewStyle
}

/** Shared screen wrapper with safe area and keyboard-friendly scrolling. */
export function ScreenContainer({ children, scroll = false, style }: ScreenContainerProps) {
	const content = scroll ? (
		<ScrollView
			contentContainerStyle={[styles.scrollContent, style]}
			keyboardShouldPersistTaps="handled"
			keyboardDismissMode="on-drag"
		>
			{children}
		</ScrollView>
	) : (
		<View style={[styles.content, style]}>{children}</View>
	)

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
			{content}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: colors.background,
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.xl,
		paddingVertical: spacing.md,
	},
})
