import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

/** Root navigation — the app opens directly on the calculator. */
export default function RootLayout() {
	return (
		<>
			<StatusBar style="dark" />
			<Stack
				screenOptions={{
					contentStyle: { backgroundColor: '#F4F7F5' },
					headerShown: false,
				}}
			/>
		</>
	)
}
