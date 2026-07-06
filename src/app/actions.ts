'use server'

import { cookies } from 'next/headers'

import { LOCALE_COOKIE, isLocale } from '@/i18n/request'

/** Troca o idioma da vitrine gravando o cookie de locale (1 ano). */
export async function definirLocale(valor: string): Promise<void> {
  if (!isLocale(valor)) return
  const store = await cookies()
  store.set(LOCALE_COOKIE, valor, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
