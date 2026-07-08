'use server'

import { z } from 'zod'

import { obterCarrinho } from '@/lib/cart-queries'
import { cotarFrete, type CotacaoFrete } from '@/lib/frete'

const CidadeSchema = z.number().int().positive()

export type FreteCarrinhoResultado =
  | { ok: true; grupos: { franquia: string | null; cotacao: CotacaoFrete }[] }
  | { ok: false; error: 'cidade_invalida' | 'carrinho_vazio' }

/** Cotação AEX do carrinho pra uma cidade (um frete por franquia/pedido). */
export async function cotarFreteCarrinho(
  cidadeId: number,
): Promise<FreteCarrinhoResultado> {
  const parsed = CidadeSchema.safeParse(cidadeId)
  if (!parsed.success) return { ok: false, error: 'cidade_invalida' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'carrinho_vazio' }

  return {
    ok: true,
    grupos: grupos.map((grupo) => ({
      franquia: grupo.franquia?.nome_fantasia ?? null,
      cotacao: cotarFrete(
        parsed.data,
        grupo.itens.map((i) => ({
          pesoGramas: i.pesoGramas,
          alturaCm: i.alturaCm,
          larguraCm: i.larguraCm,
          comprimentoCm: i.comprimentoCm,
          quantidade: i.quantidade,
        })),
      ),
    })),
  }
}
