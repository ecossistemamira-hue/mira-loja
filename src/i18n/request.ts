import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

// O locale vem da URL (segmento [locale], via src/i18n/routing.ts) — sem
// cookie, as páginas públicas podem ser estáticas/ISR.
export const LOCALES = routing.locales
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = routing.defaultLocale

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
