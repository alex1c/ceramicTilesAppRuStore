import type { ExportReport, ExportReportSection } from './types'

/**
 * Builds print-friendly HTML for expo-print from ExportReport.
 * UTF-8 + system sans-serif for Cyrillic. No domain recalculation.
 */
export function formatExportPdfHtml(report: ExportReport): string {
	const sectionsHtml = report.sections.map((section) => renderSection(section)).join('\n')

	return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1A1D26;
      font-family: Roboto, "Noto Sans", "DejaVu Sans", Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.45;
    }
    h1 { font-size: 18pt; margin: 0 0 16pt; }
    h2 {
      font-size: 11pt;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #5C6370;
      margin: 0 0 8pt;
      border-bottom: 1px solid #E2E5EB;
      padding-bottom: 4pt;
    }
    .section { margin: 0 0 16pt; page-break-inside: avoid; }
    .line { margin: 0 0 4pt; }
    .footer {
      margin-top: 22pt;
      color: #5C6370;
      font-size: 10pt;
      border-top: 1px solid #E2E5EB;
      padding-top: 10pt;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  ${sectionsHtml}
  ${report.footerNote ? `<p class="footer">${escapeHtml(report.footerNote)}</p>` : ''}
</body>
</html>`
}

function renderSection(section: ExportReportSection): string {
	const heading = section.heading
		? `<h2>${escapeHtml(section.heading)}</h2>`
		: ''
	const lines = section.lines
		.map((line) => `<p class="line">${escapeHtml(line)}</p>`)
		.join('\n')

	return `<section class="section">${heading}${lines}</section>`
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}
