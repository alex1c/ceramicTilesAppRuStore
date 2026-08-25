import { useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import {
	formatExportPdfHtml,
	formatExportTextReport,
	type ExportReport,
} from '@/export'
import { t } from '@/i18n'
import { getAnalyticsService, getShareService } from '@/services'
import { colors, radii, spacing, typography } from '@/theme'

export interface ShareExportSheetProps {
	visible: boolean
	report: ExportReport | null
	onClose: () => void
}

/**
 * Human-first share chooser: text result or PDF via system Share Sheet.
 * Consumes ExportReport only — never recalculates domain math.
 */
export function ShareExportSheet({
	visible,
	report,
	onClose,
}: ShareExportSheetProps) {
	const strings = t().calculator.share
	const [busy, setBusy] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	const handleClose = () => {
		if (busy) {
			return
		}
		setErrorMessage(null)
		onClose()
	}

	const handleShareText = async () => {
		if (!report || busy) {
			return
		}

		setErrorMessage(null)
		setBusy(true)

		try {
			const message = formatExportTextReport(report)
			const outcome = await getShareService().shareText(message)
			if (outcome.status === 'failed') {
				setErrorMessage(strings.errors.generic)
				return
			}
			if (outcome.status === 'unavailable') {
				setErrorMessage(strings.errors.unavailable)
				return
			}

			getAnalyticsService().track('result_shared', {
				channel: 'text',
			})
			onClose()
		} catch {
			setErrorMessage(strings.errors.generic)
		} finally {
			setBusy(false)
		}
	}

	const handleSharePdf = async () => {
		if (!report || busy) {
			return
		}

		setErrorMessage(null)
		setBusy(true)

		const analytics = getAnalyticsService()
		analytics.track('report_exported', { format: 'pdf' })

		// Close Modal first — expo-print WebView can hang under another Modal.
		onClose()
		await new Promise((resolve) => setTimeout(resolve, 350))

		let generationCompleted = false
		try {
			const html = formatExportPdfHtml(report)
			const fileName = buildPdfFileName()
			const generated = await getShareService().generatePdfFromHtml(
				html,
				fileName,
			)

			if (generated.status !== 'ok') {
				analytics.track('calculation_failed', {
					error_category: 'technical',
				})
				Alert.alert(strings.sheetTitle, strings.errors.pdfFailed)
				return
			}

			generationCompleted = true

			const outcome = await getShareService().sharePdf(generated.uri)
			if (outcome.status === 'failed') {
				Alert.alert(strings.sheetTitle, strings.errors.generic)
				return
			}
			if (outcome.status === 'unavailable') {
				Alert.alert(strings.sheetTitle, strings.errors.unavailable)
				return
			}

			analytics.track('result_shared', { channel: 'pdf' })
		} catch {
			if (!generationCompleted) {
				analytics.track('calculation_failed', {
					error_category: 'technical',
				})
			}
			Alert.alert(
				strings.sheetTitle,
				generationCompleted
					? strings.errors.generic
					: strings.errors.pdfFailed,
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Modal
			animationType="slide"
			onRequestClose={handleClose}
			transparent
			visible={visible}
		>
			<View style={styles.backdrop}>
				<Pressable
					accessibilityRole="button"
					onPress={handleClose}
					style={StyleSheet.absoluteFill}
				/>
				<View style={styles.sheet}>
					<Text accessibilityRole="header" style={styles.title}>
						{strings.sheetTitle}
					</Text>

					<Pressable
						accessibilityRole="button"
						disabled={busy || !report}
						onPress={() => {
							void handleShareText()
						}}
						style={({ pressed }) => [
							styles.action,
							pressed && styles.pressed,
							busy && styles.disabled,
						]}
					>
						<Text style={styles.actionTitle}>{strings.textAction}</Text>
						<Text style={styles.actionHint}>{strings.textActionHint}</Text>
					</Pressable>

					<Pressable
						accessibilityRole="button"
						disabled={busy || !report}
						onPress={() => {
							void handleSharePdf()
						}}
						style={({ pressed }) => [
							styles.action,
							pressed && styles.pressed,
							busy && styles.disabled,
						]}
					>
						<Text style={styles.actionTitle}>{strings.pdfAction}</Text>
						<Text style={styles.actionHint}>{strings.pdfActionHint}</Text>
					</Pressable>

					{busy ? (
						<View style={styles.busyRow}>
							<ActivityIndicator color={colors.accent} />
							<Text style={styles.busyLabel}>
								{strings.status.generatingPdf}
							</Text>
						</View>
					) : null}

					{errorMessage ? (
						<Text style={styles.error}>{errorMessage}</Text>
					) : null}

					<Pressable
						accessibilityRole="button"
						disabled={busy}
						onPress={handleClose}
						style={({ pressed }) => [
							styles.cancel,
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.cancelLabel}>{strings.cancel}</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	)
}

function buildPdfFileName(): string {
	const now = new Date()
	const yyyy = now.getFullYear()
	const mm = String(now.getMonth() + 1).padStart(2, '0')
	const dd = String(now.getDate()).padStart(2, '0')
	return `calculator-report-${yyyy}-${mm}-${dd}`
}

const styles = StyleSheet.create({
	backdrop: {
		backgroundColor: 'rgba(26, 29, 38, 0.45)',
		flex: 1,
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: radii.lg,
		borderTopRightRadius: radii.lg,
		paddingBottom: spacing.xl,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
	},
	title: {
		...typography.subtitle,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	action: {
		backgroundColor: colors.background,
		borderColor: colors.border,
		borderRadius: radii.md,
		borderWidth: 1,
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
	},
	actionTitle: {
		...typography.subtitle,
		color: colors.textPrimary,
	},
	actionHint: {
		...typography.caption,
		color: colors.textSecondary,
		marginTop: spacing.xs,
	},
	cancel: {
		alignItems: 'center',
		marginTop: spacing.sm,
		paddingVertical: spacing.md,
	},
	cancelLabel: {
		...typography.body,
		color: colors.textSecondary,
	},
	busyRow: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: spacing.sm,
		marginTop: spacing.sm,
	},
	busyLabel: {
		...typography.caption,
		color: colors.textSecondary,
	},
	error: {
		...typography.caption,
		color: colors.error,
		marginTop: spacing.sm,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.6,
	},
})
