import { appConfig, type SupportedLocale } from '@/config/app-config'
import { en } from './locales/en'
import { ru } from './locales/ru'
import type { TranslationTree } from './types'

const catalogs: Record<SupportedLocale, TranslationTree> = {
	ru,
	en,
}

let activeLocale: SupportedLocale = appConfig.defaultLocale

export function t(): TranslationTree {
	return catalogs[activeLocale]
}

export function setLocale(locale: SupportedLocale): void {
	activeLocale = locale
}

export function getLocale(): SupportedLocale {
	return activeLocale
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
	const locale = activeLocale === 'ru' ? 'ru-RU' : 'en-US'
	return new Intl.NumberFormat(locale, options).format(value)
}

export function formatAreaM2(areaM2: number): string {
	return formatNumber(areaM2, {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0,
	})
}

export function formatMoney(amount: number): string {
	return formatNumber(amount, {
		maximumFractionDigits: 2,
		minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
	})
}

export type { TranslationTree }
