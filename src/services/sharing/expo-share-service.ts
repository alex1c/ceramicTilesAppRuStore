import { Platform, Share } from 'react-native'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import {
	cacheDirectory,
	deleteAsync,
	moveAsync,
} from 'expo-file-system/legacy'
import type {
	PdfGenerationOutcome,
	ShareOutcome,
	ShareService,
} from './types'

/**
 * Expo/React Native share adapter.
 * Text uses RN Share; PDF uses expo-print + expo-sharing (ACTION_SEND).
 */
export class ExpoShareService implements ShareService {
	async shareText(message: string): Promise<ShareOutcome> {
		try {
			const result = await Share.share(
				Platform.OS === 'android'
					? { message }
					: { message, title: 'Calculation report' },
			)

			if (result.action === Share.dismissedAction) {
				return { status: 'cancelled' }
			}

			// iOS may report shared; Android often cannot confirm destination completion.
			return { status: 'shared' }
		} catch (error) {
			return {
				status: 'failed',
				message: error instanceof Error ? error.message : 'share_failed',
			}
		}
	}

	async generatePdfFromHtml(
		html: string,
		fileNameBase: string,
	): Promise<PdfGenerationOutcome> {
		try {
			const printed = await Print.printToFileAsync({
				html,
				// A4-ish points at 72 PPI
				width: 595,
				height: 842,
			})

			const safeBase = sanitizeFileName(fileNameBase)
			const targetUri = `${cacheDirectory ?? ''}${safeBase}.pdf`

			if (cacheDirectory && printed.uri !== targetUri) {
				try {
					await deleteAsync(targetUri, { idempotent: true })
					await moveAsync({ from: printed.uri, to: targetUri })
					return {
						status: 'ok',
						uri: targetUri,
						mimeType: 'application/pdf',
					}
				} catch {
					// Fall back to the print cache URI if rename fails.
				}
			}

			return {
				status: 'ok',
				uri: printed.uri,
				mimeType: 'application/pdf',
			}
		} catch (error) {
			return {
				status: 'failed',
				message: error instanceof Error ? error.message : 'pdf_failed',
			}
		}
	}

	async sharePdf(uri: string): Promise<ShareOutcome> {
		try {
			const available = await Sharing.isAvailableAsync()
			if (!available) {
				return { status: 'unavailable' }
			}

			await Sharing.shareAsync(uri, {
				mimeType: 'application/pdf',
				dialogTitle: 'Share PDF',
				UTI: 'com.adobe.pdf',
			})

			// Opening the sheet is not proof the user completed sending.
			return { status: 'shared' }
		} catch (error) {
			const message = error instanceof Error ? error.message : 'share_failed'
			if (/cancel|dismiss|abort/i.test(message)) {
				return { status: 'cancelled' }
			}

			return { status: 'failed', message }
		}
	}
}

function sanitizeFileName(value: string): string {
	const cleaned = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')

	return cleaned.length > 0 ? cleaned.slice(0, 80) : 'calculator-report'
}
