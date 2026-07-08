import 'server-only'

import { createLojaClient } from '@/lib/supabase'

export type Avaliacao = {
  id: string
  nota: number
  titulo: string | null
  comentario: string | null
  nome_exibicao: string
  compra_verificada: boolean
  created_at: string
}

export type ResumoAvaliacoes = {
  total: number
  media: number
  /** Contagem por nota (índice 1..5). */
  distribuicao: Record<1 | 2 | 3 | 4 | 5, number>
  avaliacoes: Avaliacao[]
}

const RESUMO_VAZIO: ResumoAvaliacoes = {
  total: 0,
  media: 0,
  distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  avaliacoes: [],
}

/**
 * Avaliações públicas de um produto + agregados (média/distribuição). RLS
 * `produto_avaliacoes_publico` já filtra as removidas.
 */
export async function listarAvaliacoes(
  produtoId: string,
): Promise<ResumoAvaliacoes> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produto_avaliacoes')
    .select('id, nota, titulo, comentario, nome_exibicao, compra_verificada, created_at')
    .eq('produto_id', produtoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) {
    if (error) console.error('[loja.listarAvaliacoes]', error)
    return RESUMO_VAZIO
  }

  const avaliacoes = data as Avaliacao[]
  if (avaliacoes.length === 0) return RESUMO_VAZIO

  const distribuicao: ResumoAvaliacoes['distribuicao'] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
  let soma = 0
  for (const a of avaliacoes) {
    const nota = Math.min(5, Math.max(1, a.nota)) as 1 | 2 | 3 | 4 | 5
    distribuicao[nota] += 1
    soma += nota
  }

  return {
    total: avaliacoes.length,
    media: Math.round((soma / avaliacoes.length) * 10) / 10,
    distribuicao,
    avaliacoes,
  }
}

/** Média/total de avaliações pra um lote de produtos (estrelas nos cards). */
export async function listarMediasAvaliacoes(
  produtoIds: string[],
): Promise<Map<string, { media: number; total: number }>> {
  const mapa = new Map<string, { media: number; total: number }>()
  if (produtoIds.length === 0) return mapa

  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produto_avaliacoes')
    .select('produto_id, nota')
    .in('produto_id', produtoIds)
    .limit(2000)
  if (error || !data) return mapa

  const somas = new Map<string, { soma: number; n: number }>()
  for (const row of data as { produto_id: string; nota: number }[]) {
    const s = somas.get(row.produto_id) ?? { soma: 0, n: 0 }
    s.soma += row.nota
    s.n += 1
    somas.set(row.produto_id, s)
  }
  for (const [id, s] of somas) {
    mapa.set(id, { media: Math.round((s.soma / s.n) * 10) / 10, total: s.n })
  }
  return mapa
}
