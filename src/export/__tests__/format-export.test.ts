import {
	formatExportPdfHtml,
	formatExportTextReport,
	type ExportReport,
} from '@/export'

const sampleReport: ExportReport = {
	title: 'Тестовый расчёт',
	sections: [
		{ heading: 'Входные данные', lines: ['A: 4', 'B: 2,5'] },
		{ heading: 'Результат', lines: ['Сумма: 6,5'] },
	],
	footerNote: 'Шаблон ForestMusic',
}

describe('export formatters', () => {
	it('formats plain text without recalculating', () => {
		const text = formatExportTextReport(sampleReport)
		expect(text).toContain('Тестовый расчёт')
		expect(text).toContain('A: 4')
		expect(text).toContain('Сумма: 6,5')
		expect(text).toContain('Шаблон ForestMusic')
	})

	it('formats HTML with escaped content', () => {
		const html = formatExportPdfHtml({
			title: 'A < B & C',
			sections: [{ lines: ['1 < 2'] }],
		})
		expect(html).toContain('A &lt; B &amp; C')
		expect(html).toContain('1 &lt; 2')
		expect(html).not.toContain('A < B')
	})
})
