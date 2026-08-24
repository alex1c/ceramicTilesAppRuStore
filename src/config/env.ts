/**
 * Typed access to public environment variables.
 * Production keys stay out of git.
 */
export const env = {
	analyticsDevMode:
		process.env.EXPO_PUBLIC_ANALYTICS_DEV_MODE === 'true' || __DEV__,
	appMetricaApiKey: process.env.EXPO_PUBLIC_APPMETRICA_API_KEY ?? '',
} as const
