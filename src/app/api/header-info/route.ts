import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { contarItensCarrinho } from '@/lib/cart-queries'
import { obterUsuarioLoja } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

/**
 * Dados por-visitante do header (badge do carrinho + nome do comprador).
 * Buscados pelo CLIENTE depois do paint — tira as leituras de cookie e a
 * chamada ao Auth do caminho de renderização de TODAS as páginas.
 */
export async function GET() {
  const cookieStore = await cookies()
  const temSessao = cookieStore
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

  const [itens, usuario] = await Promise.all([
    contarItensCarrinho(),
    temSessao ? obterUsuarioLoja() : Promise.resolve(null),
  ])

  const nome = usuario
    ? ((usuario.user_metadata?.nome_completo as string | undefined) ??
      (usuario.user_metadata?.full_name as string | undefined) ??
      usuario.email ??
      null)
    : null

  return NextResponse.json(
    { itens, nome },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
