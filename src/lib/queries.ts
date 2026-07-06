import 'server-only'

import { createLojaClient } from '@/lib/supabase'
import type { ProdutoComFotos, ProdutoVitrine } from '@/lib/types'

const COLUNAS_VITRINE =
  'id, nome, slug, descricao, categoria, preco_brl, preco_pyg, imagem_url, estoque, estoque_reservado, permite_envio, permite_retirada, created_at'

type ListarParams = {
  busca?: string
  categoria?: string
  limite?: number
}

/**
 * Lista produtos da vitrine. A RLS `produtos_publico` já restringe a
 * aprovados + publicados + não deletados — não precisamos filtrar isso aqui.
 */
export async function listarProdutosVitrine(
  params: ListarParams = {},
): Promise<ProdutoVitrine[]> {
  const supabase = createLojaClient()
  let q = supabase
    .from('produtos')
    .select(COLUNAS_VITRINE)
    .order('created_at', { ascending: false })
    .limit(params.limite ?? 60)

  if (params.categoria) q = q.eq('categoria', params.categoria)
  if (params.busca && params.busca.trim()) {
    // Escapa curingas do LIKE pra busca literal.
    const termo = params.busca.trim().replace(/[%_\\]/g, (m) => `\\${m}`)
    q = q.ilike('nome', `%${termo}%`)
  }

  const { data, error } = await q
  if (error) {
    console.error('[loja.listarProdutosVitrine]', error)
    return []
  }
  return (data ?? []) as ProdutoVitrine[]
}

/** Categorias distintas dos produtos publicados (pros filtros da vitrine). */
export async function listarCategoriasVitrine(): Promise<string[]> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('categoria')
    .not('categoria', 'is', null)
    .limit(500)
  if (error) return []
  const set = new Set<string>()
  for (const row of data ?? []) {
    const c = (row as { categoria: string | null }).categoria
    if (c) set.add(c)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export async function obterProdutoPorSlug(
  slug: string,
): Promise<ProdutoComFotos | null> {
  const supabase = createLojaClient()
  const { data: produto, error } = await supabase
    .from('produtos')
    .select(COLUNAS_VITRINE)
    .eq('slug', slug)
    .maybeSingle()
  if (error || !produto) {
    if (error) console.error('[loja.obterProdutoPorSlug]', error)
    return null
  }

  const { data: fotos } = await supabase
    .from('produto_fotos')
    .select('id, url, ordem, alt')
    .eq('produto_id', (produto as ProdutoVitrine).id)
    .order('ordem', { ascending: true })

  return {
    ...(produto as ProdutoVitrine),
    fotos: fotos ?? [],
  }
}

/** Slugs de todos os produtos publicados — alimenta o sitemap. */
export async function listarSlugsVitrine(): Promise<
  { slug: string; created_at: string }[]
> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('slug, created_at')
    .not('slug', 'is', null)
    .limit(5000)
  if (error) return []
  return (data ?? []) as { slug: string; created_at: string }[]
}
