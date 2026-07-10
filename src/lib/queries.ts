import 'server-only'

import { pontuarBusca } from '@/lib/busca-fuzzy'
import { createLojaClient } from '@/lib/supabase'
import type {
  FranquiaPublica,
  ProdutoDetalhe,
  ProdutoVitrine,
} from '@/lib/types'

export const COLUNAS_VITRINE =
  'id, nome, slug, descricao, categoria, franquia_id, preco_pyg, preco_promocional_pyg, imagem_url, estoque, estoque_reservado, permite_envio, permite_retirada, created_at'

type ListarParams = {
  busca?: string
  categoria?: string
  /** Restringe à vitrine de uma franquia (página /f/[slug]). */
  franquiaId?: string
  limite?: number
}

/** Candidatos que a busca fuzzy rankeia em memória — teto do catálogo. */
const MAX_CANDIDATOS_BUSCA = 500

/**
 * Lista produtos da vitrine. A RLS `produtos_publico` já restringe a
 * aprovados + publicados + não deletados — não precisamos filtrar isso aqui.
 *
 * Busca com tolerância a typo: em vez de ILIKE (que exige acerto exato),
 * puxamos o catálogo filtrado (pequeno) e rankeamos em JS com `pontuarBusca`
 * — "cajxa" acha "Caixa", "asuncion" acha "Asunción".
 */
export async function listarProdutosVitrine(
  params: ListarParams = {},
): Promise<ProdutoVitrine[]> {
  const supabase = createLojaClient()
  const buscando = !!params.busca?.trim()

  let q = supabase
    .from('produtos')
    .select(COLUNAS_VITRINE)
    .order('created_at', { ascending: false })
    .limit(buscando ? MAX_CANDIDATOS_BUSCA : (params.limite ?? 60))

  if (params.categoria) q = q.eq('categoria', params.categoria)
  if (params.franquiaId) q = q.eq('franquia_id', params.franquiaId)

  const { data, error } = await q
  if (error) {
    console.error('[loja.listarProdutosVitrine]', error)
    return []
  }
  const produtos = (data ?? []) as ProdutoVitrine[]
  if (!buscando) return produtos

  const consulta = params.busca!.trim()
  return produtos
    .map((p) => ({ p, score: pontuarBusca(consulta, p.nome, p.categoria) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.p.created_at.localeCompare(a.p.created_at),
    )
    .slice(0, params.limite ?? 60)
    .map((r) => r.p)
}

/**
 * Ofertas: produtos com preço promocional VÁLIDO (promo < cheio), ordenados
 * pelo maior desconto. Alimenta a seção "Ofertas do dia" da home.
 */
export async function listarOfertasVitrine(
  limite = 12,
): Promise<ProdutoVitrine[]> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produtos')
    .select(COLUNAS_VITRINE)
    .not('preco_promocional_pyg', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) {
    console.error('[loja.listarOfertasVitrine]', error)
    return []
  }

  const desconto = (p: ProdutoVitrine) =>
    p.preco_pyg && p.preco_promocional_pyg
      ? 1 - Number(p.preco_promocional_pyg) / Number(p.preco_pyg)
      : 0

  return ((data ?? []) as ProdutoVitrine[])
    .filter((p) => desconto(p) > 0)
    .sort((a, b) => desconto(b) - desconto(a))
    .slice(0, limite)
}

/** Vendedor por produto: mapa franquia_id → {nome, slug} pros cards. */
export async function mapaFranquiasPublicas(
  ids: string[],
): Promise<Map<string, { nome: string; slug: string | null }>> {
  const unicos = [...new Set(ids)].filter(Boolean)
  if (unicos.length === 0) return new Map()

  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('franquias_publicas')
    .select('id, nome_fantasia, slug')
    .in('id', unicos)
  if (error || !data) return new Map()

  return new Map(
    (data as { id: string; nome_fantasia: string; slug: string | null }[]).map(
      (f) => [f.id, { nome: f.nome_fantasia, slug: f.slug }],
    ),
  )
}

/** Categorias com contagem de produtos publicados (página /categorias). */
export async function listarCategoriasComContagem(): Promise<
  { categoria: string; total: number }[]
> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('categoria')
    .not('categoria', 'is', null)
    .limit(2000)
  if (error) return []
  const contagem = new Map<string, number>()
  for (const row of data ?? []) {
    const c = (row as { categoria: string | null }).categoria
    if (c) contagem.set(c, (contagem.get(c) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria))
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

const COLUNAS_DETALHE = `${COLUNAS_VITRINE}, peso_gramas, altura_cm, largura_cm, comprimento_cm, selos`

export async function obterProdutoPorSlug(
  slug: string,
): Promise<ProdutoDetalhe | null> {
  const supabase = createLojaClient()
  const { data: produto, error } = await supabase
    .from('produtos')
    .select(COLUNAS_DETALHE)
    .eq('slug', slug)
    .maybeSingle()
  if (error || !produto) {
    if (error) console.error('[loja.obterProdutoPorSlug]', error)
    return null
  }

  const base = produto as Omit<ProdutoDetalhe, 'fotos' | 'vendedor'>

  const [{ data: fotos }, { data: vendedor }] = await Promise.all([
    supabase
      .from('produto_fotos')
      .select('id, url, ordem, alt')
      .eq('produto_id', base.id)
      .order('ordem', { ascending: true }),
    supabase
      .from('franquias_publicas')
      .select('id, nome_fantasia, slug, cidade, pais, logo_url, moeda')
      .eq('id', base.franquia_id)
      .maybeSingle(),
  ])

  return {
    ...base,
    fotos: fotos ?? [],
    vendedor: (vendedor as FranquiaPublica | null) ?? null,
  }
}

/** Franquia (vendedora) pelo slug — página pública /f/[slug]. */
export async function obterFranquiaPorSlug(
  slug: string,
): Promise<FranquiaPublica | null> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('franquias_publicas')
    .select('id, nome_fantasia, slug, cidade, pais, logo_url, moeda')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) {
    if (error) console.error('[loja.obterFranquiaPorSlug]', error)
    return null
  }
  return data as FranquiaPublica
}

/** Slugs das franquias ativas — sitemap das páginas /f/[slug]. */
export async function listarSlugsFranquias(): Promise<string[]> {
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('franquias_publicas')
    .select('slug')
    .not('slug', 'is', null)
    .limit(500)
  if (error) return []
  return (data ?? [])
    .map((f) => (f as { slug: string | null }).slug)
    .filter((s): s is string => !!s)
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
