import { NextResponse, type NextRequest } from 'next/server'

import { precoExibicao } from '@/lib/format'
import { listarProdutosVitrine } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export type SugestaoBusca = {
  id: string
  slug: string | null
  nome: string
  categoria: string | null
  imagemUrl: string | null
  precoTexto: string | null
}

/**
 * Autocomplete da busca do header. Lê via anon key (RLS `produtos_publico`),
 * então só devolve produtos publicados — sem dado sensível aqui.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json({ sugestoes: [] as SugestaoBusca[] })
  }

  const produtos = await listarProdutosVitrine({ busca: q, limite: 6 })
  const sugestoes: SugestaoBusca[] = produtos.map((p) => ({
    id: p.id,
    slug: p.slug,
    nome: p.nome,
    categoria: p.categoria,
    imagemUrl: p.imagem_url,
    precoTexto: precoExibicao(p)?.texto ?? null,
  }))

  return NextResponse.json(
    { sugestoes },
    { headers: { 'Cache-Control': 'public, max-age=30' } },
  )
}
