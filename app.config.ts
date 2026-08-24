import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Expo app config — Continuous Native Generation entry.
 * Local development includes expo-dev-client; production builds can omit it later.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
	const isProduction = process.env.APP_VARIANT === 'production'

	const plugins: NonNullable<ExpoConfig['plugins']> = ['expo-router']

	if (!isProduction) {
		plugins.push('expo-dev-client')
	}

	return {
		...config,
		name: 'Калькулятор плитки',
		slug: 'tile-calculator',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/icon.png',
		userInterfaceStyle: 'light',
		scheme: 'tile-calculator',
		experiments: {
			typedRoutes: true,
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.calculatorplatform.tile',
		},
		android: {
			package: 'com.calculatorplatform.tile',
			versionCode: 1,
			adaptiveIcon: {
				backgroundColor: '#E8F5EE',
				foregroundImage: './assets/android-icon-foreground.png',
				backgroundImage: './assets/android-icon-background.png',
				monochromeImage: './assets/android-icon-monochrome.png',
			},
			predictiveBackGestureEnabled: false,
		},
		plugins,
		extra: {
			appVariant: isProduction ? 'production' : 'development',
		},
	}
}
