/**
 * Privacy-first product analytics taxonomy for Tile Calculator.
 *
 * Custom event parameters are categorical / boolean only.
 * Never attach exact dimensions, prices, or free text.
 */

/** Product screens tracked via `screen()`. */
export type AnalyticsScreenName = 'tile_calculator'

/** Baseline mode for ads / shared Share instrumentation. */
export type ModeAnalyticsValue = 'calculator'

export type AdPlacementAnalyticsValue =
	| 'result_banner'
	| 'footer_banner'
	| 'dev_rewarded_test'
	| 'future_pdf_reward'

export type AdFormatAnalyticsValue = 'banner' | 'rewarded'
export type AdErrorCategoryAnalyticsValue = 'load' | 'show' | 'sdk' | 'unavailable'

export type AnalyticsErrorCategory =
	| 'validation'
	| 'unsupported'
	| 'calculation'
	| 'technical'

export type ShareChannelAnalyticsValue = 'sheet' | 'text' | 'pdf'

/**
 * Typed event → params map.
 * Tile product events stay categorical; Share/PDF/ad events follow Foundation.
 */
export interface AnalyticsEventMap {
	app_open: undefined
	calculator_opened: undefined
	calculation_completed: undefined
	calculation_failed: {
		error_category: AnalyticsErrorCategory
	}
	explanation_opened: undefined
	result_shared: {
		channel: ShareChannelAnalyticsValue
	}
	report_exported: {
		format: 'pdf'
	}
	surface_floor: undefined
	surface_wall: undefined
	wall_added: undefined
	opening_added: undefined
	tile_preset_selected: undefined
	custom_tile_used: undefined
	layout_selected: undefined
	reserve_changed: undefined
	package_enabled: undefined
	package_mode_tiles: undefined
	package_mode_area: undefined
	price_enabled: undefined
	price_mode_tile: undefined
	price_mode_box: undefined
	price_mode_m2: undefined
	ad_banner_load_requested: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	ad_banner_loaded: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	ad_banner_failed: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
		error_category: AdErrorCategoryAnalyticsValue
	}
	ad_banner_impression: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	rewarded_load_requested: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	rewarded_loaded: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	rewarded_failed: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
		error_category: AdErrorCategoryAnalyticsValue
	}
	rewarded_opened: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	rewarded_reward_earned: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
	}
	rewarded_closed: {
		placement: AdPlacementAnalyticsValue
		format: AdFormatAnalyticsValue
		mode: ModeAnalyticsValue
		reward_granted: boolean
	}
}

export type AnalyticsEventName = keyof AnalyticsEventMap

export type AnalyticsPrimitive = string | number | boolean

export type AnalyticsParams = Record<string, AnalyticsPrimitive>
