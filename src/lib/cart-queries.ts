import 'server-only'

import { lerCarrinhoId } from '@/lib/cart'
import { createLojaClient } from '@/lib/supabase'
import type {
  CarrinhoResolvido,
  FranquiaPublica,
  ItemCarrinho,
} from '@/lib/types'

const VAZIO: CarrinhoResolvido = { grupos: [], totalItens: 0 }

type ItemRow = {
  id: string
  quantidade: number
  produto_id: string
  produtos: {
    nome: string
    slug: string | null
    imagem_url: string | null
    preco_pyg: number | null
    estoque: number
    estoque_reservado: number
    franquia_id: string
    deleted_at: string | null
    publicado_loja: boolean
    status: string
    peso_gramas: number | null
    altura_cm: number | null
    largura_cm: number | null
    comprimento_cm: number | null
  } | null
}

/**
 * Lê o carrinho do cookie e resolve cada item com os dados atuais do produto,
 * agrupado por franquia (um pedido por franquia no checkout). Ignora itens de
 * produtos que saíram do ar.
 */
export async function obterCarrinho(): Promise<CarrinhoResolvido> {
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return VAZIO

  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('carrinho_itens')
    .select(
      'id, quantidade, produto_id, produtos(nome, slug, imagem_url, preco_pyg, estoque, estoque_reservado, franquia_id, deleted_at, publicado_loja, status, peso_gramas, altura_cm, largura_cm, comprimento_cm)',
    )
    .eq('carrinho_id', carrinhoId)
    .order('created_at', { ascending: true })

  if (error || !data) return VAZIO

  const itens: ItemCarrinho[] = []
  for (const rowRaw of data as unknown as ItemRow[]) {
    const p = rowRaw.produtos
    // Produto pode ter sido despublicado/removido depois de entrar no carrinho.
    if (!p || p.deleted_at || !p.publicado_loja || p.status !== 'aprovado') {
      continue
    }
    itens.push({
      itemId: rowRaw.id,
      produtoId: rowRaw.produto_id,
      franquiaId: p.franquia_id,
      nome: p.nome,
      slug: p.slug,
      imagemUrl: p.imagem_url,
      precoPyg: p.preco_pyg,
      disponivel: Math.max(0, (p.estoque ?? 0) - (p.estoque_reservado ?? 0)),
      quantidade: rowRaw.quantidade,
      pesoGramas: p.peso_gramas,
      alturaCm: p.altura_cm,
      larguraCm: p.largura_cm,
      comprimentoCm: p.comprimento_cm,
    })
  }

  if (itens.length === 0) return VAZIO

  // Busca dados públicos das franquias envolvidas (nome/moeda/cidade).
  const franquiaIds = [...new Set(itens.map((i) => i.franquiaId))]
  const { data: franquias } = await supabase
    .from('franquias_publicas')
    .select('id, nome_fantasia, cidade, pais, logo_url, moeda')
    .in('id', franquiaIds)
  const mapaFranquia = new Map<string, FranquiaPublica>(
    (franquias ?? []).map((f) => [f.id, f as FranquiaPublica]),
  )

  const grupos = franquiaIds.map((fid) => ({
    franquia: mapaFranquia.get(fid) ?? null,
    itens: itens.filter((i) => i.franquiaId === fid),
  }))

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0)
  return { grupos, totalItens }
}

/** Só a contagem de itens — pro badge do header (leve). */
export async function contarItensCarrinho(): Promise<number> {
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return 0
  const supabase = createLojaClient()
  const { data, error } = await supabase
    .from('carrinho_itens')
    .select('quantidade')
    .eq('carrinho_id', carrinhoId)
  if (error || !data) return 0
  return data.reduce((s, r) => s + (r.quantidade as number), 0)
}
