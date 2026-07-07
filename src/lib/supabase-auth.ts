import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

/**
 * Cliente Supabase com a SESSÃO DO COMPRADOR (cookies) — RLS roda como o
 * usuário logado (policies *_self / *_comprador de 0082/0087). Usar em
 * páginas e server actions da conta; a vitrine continua no createLojaClient.
 */
export async function createAuthClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component não pode escrever cookie — o proxy renova a sessão.
        }
      },
    },
  })
}

/** Usuário auth logado (ou null). */
export async function obterUsuarioLoja(): Promise<User | null> {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
