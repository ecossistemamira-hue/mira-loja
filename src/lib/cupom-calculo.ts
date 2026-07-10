// Imports relativos: o vitest do projeto roda sem alias `@/`.
import { subtotalItens } from './format'
import type { GrupoCarrinho } from './types'

// Cálculo PURO do desconto de cupom (testável sem Supabase).
// Regras (marketplace só-guarani, um pedido por franquia):
//   - cupom com franquia_id aplica só no grupo daquela franquia;
//     franquia_id NULL (rede toda) aplica em todos os grupos.
//   - percentual: % sobre o subtotal de CADA grupo aplicável.
//   - valor_fixo: desconto único — vai pro grupo aplicável de MAIOR subtotal,
//     limitado ao subtotal (pedido nunca fica negativo).
//   - valor_fixo em moeda != PYG não se aplica (loja é só guarani).

export type CupomInfo = {
  franquia_id: string | null
  tipo: string
  valor: number
  moeda: string | null
}

/**
 * Desconto (Gs., inteiro) por franquia_id, ou null se o cupom não se aplica a
 * nenhum grupo do carrinho.
 */
export function calcularDescontoCupom(
  cupom: CupomInfo,
  grupos: GrupoCarrinho[],
): Record<string, number> | null {
  if (cupom.tipo === 'valor_fixo' && cupom.moeda && cupom.moeda !== 'PYG') {
    return null
  }
  const valor = Number(cupom.valor)
  if (!Number.isFinite(valor) || valor <= 0) return null

  const aplicaveis = grupos
    .map((g) => ({
      franquiaId: g.itens[0]?.franquiaId,
      subtotal: subtotalItens(g.itens),
    }))
    .filter(
      (g): g is { franquiaId: string; subtotal: number } =>
        !!g.franquiaId &&
        g.subtotal > 0 &&
        (cupom.franquia_id == null || g.franquiaId === cupom.franquia_id),
    )
  if (aplicaveis.length === 0) return null

  const desconto: Record<string, number> = {}

  if (cupom.tipo === 'percentual') {
    const pct = Math.min(valor, 100)
    for (const g of aplicaveis) {
      desconto[g.franquiaId] = Math.round((g.subtotal * pct) / 100)
    }
    return desconto
  }

  if (cupom.tipo === 'valor_fixo') {
    // Uma aplicação só: no grupo de maior subtotal, sem passar do subtotal.
    const alvo = aplicaveis.reduce((a, b) =>
      b.subtotal > a.subtotal ? b : a,
    )
    desconto[alvo.franquiaId] = Math.min(Math.round(valor), alvo.subtotal)
    return desconto
  }

  return null
}
