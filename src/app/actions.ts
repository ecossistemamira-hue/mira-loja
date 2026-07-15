'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase'

/**
 * Inscreve um e-mail na newsletter (loja_newsletter, migration 0087).
 * Service role justificado: a tabela não tem policy anon de propósito —
 * a única porta de escrita é esta action, que valida o formato.
 */
export async function inscreverNewsletter(
  email: string,
): Promise<{ ok: boolean }> {
  const parsed = z.string().email().max(200).safeParse(email.trim().toLowerCase())
  if (!parsed.success) return { ok: false }

  const locale = await getLocale()
  const svc = createServiceClient()
  const { error } = await svc
    .from('loja_newsletter')
    .upsert(
      { email: parsed.data, locale },
      { onConflict: 'email', ignoreDuplicates: true },
    )
  if (error) {
    console.error('[loja.newsletter]', error)
    return { ok: false }
  }
  return { ok: true }
}
