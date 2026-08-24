/**
 * Keeps editable decimal text exactly as entered or pasted.
 * Validation and normalization happen on submit, so drafts such as `4,` stay visible.
 */
export function filterDecimalInputText(raw: string): string {
	return raw
}

/** Integer-only filter reserved for count fields (tiles per box). */
export function filterIntegerInputText(raw: string): string {
	return raw
}
