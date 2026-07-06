import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

// 'es' primeiro: espanhol é o idioma oficial (foco no Paraguai). pt-BR é a
// tradução secundária, trocável pelo seletor de idioma. Mesmo padrão do
// mira-platform (locale por cookie, sem prefixo de rota).
export const LOCALES = ['es', 'pt-BR'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'
export const LOCALE_COOKIE = 'mira_locale'

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
}

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
