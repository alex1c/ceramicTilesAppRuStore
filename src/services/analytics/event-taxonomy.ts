export type AnalyticsEventName =
	| 'app_open'
	| 'calculator_opened'
	| 'calculation_completed'
	| 'surface_floor'
	| 'surface_wall'
	| 'wall_added'
	| 'opening_added'
	| 'tile_preset_selected'
	| 'custom_tile_used'
	| 'layout_selected'
	| 'reserve_changed'
	| 'package_enabled'
	| 'package_mode_tiles'
	| 'package_mode_area'
	| 'price_enabled'
	| 'price_mode_tile'
	| 'price_mode_box'
	| 'price_mode_m2'

export type AnalyticsScreenName = 'tile_calculator'

export type AnalyticsEventMap = {
	[K in AnalyticsEventName]: undefined
}
