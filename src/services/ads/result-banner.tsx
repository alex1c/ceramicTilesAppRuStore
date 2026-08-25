import { useEffect, useMemo, useState } from 'react'
import {
	Dimensions,
	StyleSheet,
	View,
	type LayoutChangeEvent,
	type StyleProp,
	type ViewStyle,
} from 'react-native'
import {
	RESULT_BANNER_MAX_HEIGHT_DP,
	type BannerPlacementId,
} from '@/config/ads-config'
import { getAnalyticsService, type ModeAnalyticsValue } from '@/services/analytics'
import { getAdService } from './ad-registry'
import type { ResultBannerContext } from './types'

interface ResultBannerProps {
	/** When false, nothing renders and no load is attempted. */
	visible: boolean
	mode: ModeAnalyticsValue
	/** Remount key from the presented calculation result. */
	resultKey: string
	/** Logical placement for analytics — keep instances distinct. */
	placement?: BannerPlacementId
	/** Optional outer slot style (e.g. footer bottom spacing). */
	style?: StyleProp<ViewStyle>
}

type YandexSdk = typeof import('yandex-mobile-ads')
type BannerAdSizeInstance = Awaited<ReturnType<YandexSdk['BannerAdSize']['inlineSize']>>
type BannerViewComponent = YandexSdk['BannerView']

/**
 * Product banner slot for Phase 5C placements (`result_banner`, `footer_banner`).
 *
 * Isolates `yandex-mobile-ads` so calculator screens never import the SDK.
 * Fail-open: load errors collapse the slot; calculator UX continues.
 * Each instance keeps its own lifecycle keyed by placement + resultKey.
 */
export function ResultBanner({
	visible,
	mode,
	resultKey,
	placement = 'result_banner',
	style,
}: ResultBannerProps) {
	const ads = getAdService()
	const adUnitId = ads.shouldShowBanner(placement)
		? ads.getBannerAdUnitId(placement)
		: null

	const [containerWidth, setContainerWidth] = useState(
		() => Dimensions.get('window').width,
	)
	const [adSize, setAdSize] = useState<BannerAdSizeInstance | null>(null)
	const [loadFailed, setLoadFailed] = useState(false)
	const [loaded, setLoaded] = useState(false)
	const [BannerView, setBannerView] = useState<BannerViewComponent | null>(null)

	const context: ResultBannerContext | null = useMemo(() => {
		if (!visible || !adUnitId) {
			return null
		}
		return { placement, mode, resultKey }
	}, [visible, adUnitId, placement, mode, resultKey])

	useEffect(() => {
		if (!context || !adUnitId) {
			return
		}

		let cancelled = false

		async function prepare() {
			const activeContext = context
			if (!activeContext || !adUnitId) {
				return
			}

			try {
				await ads.initialize()
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const sdk = require('yandex-mobile-ads') as YandexSdk
				const size = await sdk.BannerAdSize.inlineSize(
					containerWidth,
					RESULT_BANNER_MAX_HEIGHT_DP,
				)
				if (cancelled) {
					return
				}
				setBannerView(() => sdk.BannerView)
				setAdSize(size)
				getAnalyticsService().track('ad_banner_load_requested', {
					placement: activeContext.placement,
					format: 'banner',
					mode: activeContext.mode,
				})
			} catch {
				if (!cancelled) {
					setLoadFailed(true)
					getAnalyticsService().track('ad_banner_failed', {
						placement,
						format: 'banner',
						mode,
						error_category: 'sdk',
					})
				}
			}
		}

		void prepare()

		return () => {
			cancelled = true
		}
	}, [context, adUnitId, containerWidth, ads, placement, mode])

	if (!visible || !adUnitId || loadFailed || !context) {
		return null
	}

	const handleLayout = (event: LayoutChangeEvent) => {
		const nextWidth = Math.floor(event.nativeEvent.layout.width)
		if (nextWidth > 0 && nextWidth !== containerWidth) {
			setContainerWidth(nextWidth)
		}
	}

	return (
		<View
			accessibilityElementsHidden={!loaded}
			importantForAccessibility={loaded ? 'yes' : 'no-hide-descendants'}
			onLayout={handleLayout}
			style={[
				styles.slot,
				adSize
					? { minHeight: adSize.height }
					: { minHeight: RESULT_BANNER_MAX_HEIGHT_DP },
				style,
			]}
		>
			{BannerView && adSize ? (
				<BannerView
					adRequest={{ adUnitId }}
					key={`${placement}:${resultKey}:${adUnitId}:${adSize.width}`}
					onAdFailedToLoad={() => {
						setLoadFailed(true)
						getAnalyticsService().track('ad_banner_failed', {
							placement,
							format: 'banner',
							mode,
							error_category: 'load',
						})
					}}
					onAdImpression={() => {
						getAnalyticsService().track('ad_banner_impression', {
							placement,
							format: 'banner',
							mode,
						})
					}}
					onAdLoaded={() => {
						setLoaded(true)
						getAnalyticsService().track('ad_banner_loaded', {
							placement,
							format: 'banner',
							mode,
						})
					}}
					size={adSize}
					style={{
						alignSelf: 'center',
						height: adSize.height,
						width: adSize.width,
					}}
				/>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	slot: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		overflow: 'hidden',
		width: '100%',
	},
})
