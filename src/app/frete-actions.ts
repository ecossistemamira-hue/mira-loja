'use server'

import { z } from 'zod'

import { obterCarrinho } from '@/lib/cart-queries'
import { moedaDoGrupo, precoNaMoeda } from '@/lib/format'
import {
  calcularFrete,
  ZONAS_ENTREGA,
  type MoedaLoja,
  type OpcaoFrete,
  type ZonaEntrega,
} from '@/lib/frete'

const ZonaSchema = z.enum(ZONAS_ENTREGA as [ZonaEntrega, ...ZonaEntrega[]])

export type FreteCarrinhoResultado =
  | {
      ok: true
      grupos: { franquia: string | null; moeda: MoedaLoja; opcao: OpcaoFrete }[]
    }
  | { ok: false; error: 'zona_invalida' | 'carrinho_vazio' }

/** Cotação do carrinho pra uma zona de entrega (um frete por franquia/pedido). */
export async function cotarFreteCarrinho(
  zona: string,
): Promise<FreteCarrinhoResultado> {
  const zonaParsed = ZonaSchema.safeParse(zona)
  if (!zonaParsed.success) return { ok: false, error: 'zona_invalida' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'carrinho_vazio' }

  const resultado = grupos.map((grupo) => {
    const moeda = moedaDoGrupo(grupo.itens, grupo.franquia?.moeda)
    const subtotal = grupo.itens.reduce((s, i) => {
      const p = precoNaMoeda(i, moeda)
      return s + (p != null ? p * i.quantidade : 0)
    }, 0)
    const opcao = calcularFrete({
      zona: zonaParsed.data,
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
    return { franquia: grupo.franquia?.nome_fantasia ?? null, moeda, opcao }
  })

  return { ok: true, grupos: resultado }
}
