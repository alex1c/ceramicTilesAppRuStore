import type { TextInputProps } from 'react-native'

export type DecimalTextInputProps = Pick<TextInputProps, 'keyboardType' | 'inputMode'>

export type DecimalInputPlatform = 'android' | 'ios' | 'windows' | 'macos' | 'web'

/**
 * Android must not use decimal-pad: it drops locale commas before onChangeText.
 * Use the default keyboard so "," and "." both survive typing and paste.
 */
export function getDecimalTextInputPropsForPlatform(
	os: DecimalInputPlatform,
): DecimalTextInputProps {
	if (os === 'android') {
		return {
			keyboardType: 'default',
			inputMode: 'text',
		}
	}

	return {
		inputMode: 'decimal',
		keyboardType: 'decimal-pad',
	}
}
