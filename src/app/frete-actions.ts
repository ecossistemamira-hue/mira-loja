'use server'

import { z } from 'zod'

import { obterCarrinho } from '@/lib/cart-queries'
import { moedaDoGrupo, precoNaMoeda } from '@/lib/format'
import { calcularFrete, type MoedaFrete, type OpcaoFrete } from '@/lib/frete'
import { createLojaClient } from '@/lib/supabase'

const CepSchema = z.string().min(4).max(20)

export type FreteProdutoResultado =
  | { ok: true; moeda: MoedaFrete; opcoes: OpcaoFrete[] }
  | { ok: false; error: 'cep_invalido' | 'produto_nao_encontrado' | 'sem_envio' }

/** Cotação de frete na página do produto (1 unidade). */
export async function cotarFreteProduto(
  produtoId: string,
  cep: string,
): Promise<FreteProdutoResultado> {
  const cepParsed = CepSchema.safeParse(cep.trim())
  if (!cepParsed.success) return { ok: false, error: 'cep_invalido' }

  const supabase = createLojaClient()
  const { data: p } = await supabase
    .from('produtos')
    .select(
      'preco_brl, preco_pyg, peso_gramas, altura_cm, largura_cm, comprimento_cm, permite_envio',
    )
    .eq('id', produtoId)
    .maybeSingle()
  if (!p) return { ok: false, error: 'produto_nao_encontrado' }
  if (!p.permite_envio) return { ok: false, error: 'sem_envio' }

  // Mesma preferência de moeda da vitrine (PYG primeiro).
  const moeda: MoedaFrete = p.preco_pyg != null ? 'PYG' : 'BRL'
  const subtotal = Number((moeda === 'PYG' ? p.preco_pyg : p.preco_brl) ?? 0)

  const opcoes = calcularFrete({
    cep: cepParsed.data,
    itens: [
      {
        pesoGramas: p.peso_gramas,
        alturaCm: p.altura_cm,
        larguraCm: p.largura_cm,
        comprimentoCm: p.comprimento_cm,
        quantidade: 1,
      },
    ],
    moeda,
    subtotal,
  })
  if (!opcoes) return { ok: false, error: 'cep_invalido' }
  return { ok: true, moeda, opcoes }
}

export type FreteCarrinhoResultado =
  | {
      ok: true
      grupos: { franquia: string | null; moeda: MoedaFrete; opcoes: OpcaoFrete[] }[]
    }
  | { ok: false; error: 'cep_invalido' | 'carrinho_vazio' }

/** Cotação de frete do carrinho inteiro (um valor por franquia/pedido). */
export async function cotarFreteCarrinho(
  cep: string,
): Promise<FreteCarrinhoResultado> {
  const cepParsed = CepSchema.safeParse(cep.trim())
  if (!cepParsed.success) return { ok: false, error: 'cep_invalido' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'carrinho_vazio' }

  const resultado: {
    franquia: string | null
    moeda: MoedaFrete
    opcoes: OpcaoFrete[]
  }[] = []

  for (const grupo of grupos) {
    const moeda = moedaDoGrupo(grupo.itens, grupo.franquia?.moeda)
    const subtotal = grupo.itens.reduce((s, i) => {
      const p = precoNaMoeda(i, moeda)
      return s + (p != null ? p * i.quantidade : 0)
    }, 0)
    const opcoes = calcularFrete({
      cep: cepParsed.data,
      itens: grupo.itens.map((i) => ({
        pesoGramas: i.pesoGramas,
        alturaCm: i.alturaCm,
        larguraCm: i.larguraCm,
        comprimentoCm: i.comprimentoCm,
        quantidade: i.quantidade,
      })),
      moeda,
      subtotal,
    })
    if (!opcoes) return { ok: false, error: 'cep_invalido' }
    resultado.push({
      franquia: grupo.franquia?.nome_fantasia ?? null,
      moeda,
      opcoes,
    })
  }

  return { ok: true, grupos: resultado }
}
