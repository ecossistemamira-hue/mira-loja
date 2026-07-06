import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase read-only pra vitrine pública. Usa a ANON key: as RLS
 * policies `produtos_publico` / `produto_fotos_publico` (migration 0081 do
 * mira-platform) garantem que só produtos aprovados + publicados aparecem.
 *
 * Não há auth de usuário na Fase 1 (sem carrinho/login) — por isso um client
 * simples, sem cookies/sessão, cacheável entre requests.
 */
export function createLojaClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
