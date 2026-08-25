/**
 * Share service — system Share Sheet only (no vendor chat SDKs).
 */

export type ShareOutcome =
	| { status: 'shared' }
	| { status: 'cancelled' }
	| { status: 'unavailable' }
	| { status: 'failed'; message: string }

export type PdfGenerationOutcome =
	| { status: 'ok'; uri: string; mimeType: 'application/pdf' }
	| { status: 'failed'; message: string }

export interface ShareService {
	/** Opens the OS share sheet with plain text. */
	shareText: (message: string) => Promise<ShareOutcome>
	/** Builds a PDF file in app cache from HTML. */
	generatePdfFromHtml: (html: string, fileNameBase: string) => Promise<PdfGenerationOutcome>
	/** Opens the OS share sheet for a local PDF file URI. */
	sharePdf: (uri: string) => Promise<ShareOutcome>
}
