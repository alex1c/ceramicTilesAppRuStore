/**
 * Shared export DTO for Share text and PDF.
 *
 * Built from already-presented calculator data — never recalculates domain math.
 */
export interface ExportReportSection {
	heading?: string
	lines: string[]
}

export interface ExportReport {
	title: string
	sections: ExportReportSection[]
	footerNote?: string
}
