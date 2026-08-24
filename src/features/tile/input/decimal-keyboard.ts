import { Platform } from 'react-native'
import { getDecimalTextInputPropsForPlatform } from './decimal-text-input-props'

export function getDecimalTextInputProps() {
	return getDecimalTextInputPropsForPlatform(Platform.OS)
}
