import type { ExportReport } from './types'

/**
 * Formats an export report as plain text for the OS share sheet.
 * All strings are already human-facing — no domain recalculation.
 */
export function formatExportTextReport(report: ExportReport): string {
	const blocks: string[] = [report.title, '']

	for (const section of report.sections) {
		if (section.heading) {
			blocks.push(section.heading)
		}
		for (const line of section.lines) {
			blocks.push(line)
		}
		blocks.push('')
	}

	if (report.footerNote) {
		blocks.push(report.footerNote)
	}

	return `${blocks.join('\n').trim()}\n`
}
