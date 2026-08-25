import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * Expo app config — Continuous Native Generation entry.
 *
 * Production / RuStore:
 *   APP_VARIANT=production
 *   npm run prebuild:android:production
 *
 * Identity: launcher icon ≠ adaptive icon ≠ splash ≠ RuStore store icon.
 * Master artwork: assets/icon_gpt.png
 */
export default ({ config }: ConfigContext): ExpoConfig => {
	const isProduction = process.env.APP_VARIANT === 'production'

	const plugins: NonNullable<ExpoConfig['plugins']> = [
		'expo-router',
		'expo-sharing',
	]

	if (!isProduction) {
		plugins.splice(1, 0, 'expo-dev-client')
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
			// Expo CNG template + debug overlays inject SYSTEM_ALERT_WINDOW.
			// Block it in production release so RuStore AAB does not declare it.
			...(isProduction
				? {
						blockedPermissions: [
							'android.permission.SYSTEM_ALERT_WINDOW',
						],
					}
				: {}),
		},
		plugins,
		extra: {
			appVariant: isProduction ? 'production' : 'development',
			foundationVersion: '1.0.0',
			splashAsset: './assets/splash-icon.png',
		},
	}
}
