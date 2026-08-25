import type { ShareService } from '@/services/sharing'

describe('ShareService contract', () => {
	it('treats share sheet cancel as cancelled, not completed', async () => {
		const service: ShareService = {
			shareText: async () => ({ status: 'cancelled' }),
			generatePdfFromHtml: async () => ({
				status: 'ok',
				uri: 'file:///tmp/test.pdf',
				mimeType: 'application/pdf',
			}),
			sharePdf: async () => ({ status: 'cancelled' }),
		}

		const text = await service.shareText('hello')
		const pdf = await service.sharePdf('file:///tmp/test.pdf')

		expect(text.status).toBe('cancelled')
		expect(pdf.status).toBe('cancelled')
		expect(text).not.toEqual(expect.objectContaining({ status: 'shared' }))
	})

	it('keeps PDF generation failures separate from calculation state', async () => {
		const service: ShareService = {
			shareText: async () => ({ status: 'shared' }),
			generatePdfFromHtml: async () => ({
				status: 'failed',
				message: 'printer_error',
			}),
			sharePdf: async () => ({ status: 'shared' }),
		}

		const result = await service.generatePdfFromHtml('<html></html>', 'test')
		expect(result.status).toBe('failed')
		// Calculation state lives outside ShareService — failure must not throw.
		expect(result).toEqual({
			status: 'failed',
			message: 'printer_error',
		})
	})
})
