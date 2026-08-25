import type { ShareService } from './types'

/** Silent share adapter for Jest — never touches native modules. */
export class NoopShareService implements ShareService {
	async shareText(): Promise<{ status: 'unavailable' }> {
		return { status: 'unavailable' }
	}

	async generatePdfFromHtml(): Promise<{ status: 'failed'; message: string }> {
		return { status: 'failed', message: 'noop' }
	}

	async sharePdf(): Promise<{ status: 'unavailable' }> {
		return { status: 'unavailable' }
	}
}
