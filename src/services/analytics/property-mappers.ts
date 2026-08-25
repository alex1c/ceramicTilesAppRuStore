/**
 * Analytics helpers shared across ForestMusic calculator apps.
 * Keep params categorical — never send exact dimensions or free text.
 */

/**
 * Asserts analytics params contain no dimension-like keys.
 * Used in tests — not a runtime firewall for production SDK payloads.
 */
export function assertNoRawDimensionParams(
	params: Record<string, unknown> | undefined,
): void {
	if (!params) {
		return
	}

	const forbidden = [
		'length',
		'width',
		'height',
		'offset',
		'mm',
		'meters',
		'dimension',
		'room',
		'ad_unit',
		'creative',
		'click_url',
		'target_url',
		'gaid',
		'oaid',
		'android_id',
	]

	for (const key of Object.keys(params)) {
		const normalized = key.toLowerCase()
		for (const fragment of forbidden) {
			if (normalized.includes(fragment)) {
				throw new Error(`Unsafe analytics param key: ${key}`)
			}
		}
	}
}
