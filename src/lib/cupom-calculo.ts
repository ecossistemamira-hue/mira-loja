// Imports relativos: o vitest do projeto roda sem alias `@/`.
import { subtotalItens } from './format'
import type { GrupoCarrinho, ItemCarrinho } from './types'

// Cálculo PURO do desconto de cupom (testável sem Supabase).
// Regras (marketplace só-guarani, um pedido por franquia):
//   - cupom com franquia_id aplica só no grupo daquela franquia;
//     franquia_id NULL (rede toda) aplica em todos os grupos.
//   - ESCOPO (0104): 'tudo' = carrinho inteiro; 'produtos' = só os itens da
//     lista `produtosElegiveis`; 'categorias' = só os itens cuja categoria está
//     em `cupom.categorias`. O percentual incide sobre o subtotal ELEGÍVEL, não
//     sobre o carrinho todo.
//   - `vale_em_promocao = false` (0104) tira do cálculo os itens que já estão
//     com preço promocional.
//   - `valor_minimo` (0104) é conferido contra o subtotal ELEGÍVEL do carrinho
//     (soma de todos os grupos) — não vale a pena aplicar por grupo, o
//     comprador enxerga um carrinho só.
//   - percentual: % sobre o subtotal elegível de CADA grupo aplicável.
//   - valor_fixo: desconto único — vai pro grupo elegível de MAIOR subtotal,
//     limitado ao subtotal elegível (pedido nunca fica negativo).
//   - valor_fixo em moeda != PYG não se aplica (loja é só guarani).

export type CupomInfo = {
  franquia_id: string | null
  tipo: string
  valor: number
  moeda: string | null
  escopo_itens?: string | null
  categorias?: string[] | null
  valor_minimo?: number | null
  vale_em_promocao?: boolean | null
}

export type MotivoNaoAplicavel = 'nao_aplicavel' | 'minimo_nao_atingido'

export type ResultadoCalculo =
  | { ok: true; descontoPorFranquia: Record<string, number> }
  | { ok: false; motivo: MotivoNaoAplicavel; faltam?: number }

/** Normaliza categoria pra comparar sem sofrer com acento/caixa/espaco. */
function chaveCategoria(c: string | null | undefined): string {
  // NFD separa o acento em codepoint proprio (U+0300-U+036F); filtra fora.
  return (c ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((ch) => {
      const cp = ch.charCodeAt(0)
      return cp < 0x0300 || cp > 0x036f
    })
    .join('')
}

function itemEmPromocao(item: ItemCarrinho): boolean {
  return (
    item.precoPromocionalPyg != null &&
    item.precoPyg != null &&
    item.precoPromocionalPyg < item.precoPyg
  )
}

/** O item entra na conta do cupom? */
export function itemElegivel(
  cupom: CupomInfo,
  item: ItemCarrinho,
  produtosElegiveis: ReadonlySet<string>,
): boolean {
  if (cupom.vale_em_promocao === false && itemEmPromocao(item)) return false

  const escopo = cupom.escopo_itens ?? 'tudo'
  if (escopo === 'produtos') return produtosElegiveis.has(item.produtoId)
  if (escopo === 'categorias') {
    const alvo = (cupom.categorias ?? []).map(chaveCategoria).filter(Boolean)
    if (alvo.length === 0) return false
    return alvo.includes(chaveCategoria(item.categoria))
  }
  return true
}

/**
 * Desconto (Gs., inteiro) por franquia_id.
 * Devolve o motivo quando o cupom não cola, pra loja explicar ao comprador.
 */
export function calcularDescontoCupom(
  cupom: CupomInfo,
  grupos: GrupoCarrinho[],
  produtosElegiveis: ReadonlySet<string> = new Set(),
): ResultadoCalculo {
  if (cupom.tipo === 'valor_fixo' && cupom.moeda && cupom.moeda !== 'PYG') {
    return { ok: false, motivo: 'nao_aplicavel' }
  }
  const valor = Number(cupom.valor)
  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, motivo: 'nao_aplicavel' }
  }

  const aplicaveis = grupos
    .map((g) => {
      const franquiaId = g.itens[0]?.franquiaId
      const elegiveis = g.itens.filter((i) =>
        itemElegivel(cupom, i, produtosElegiveis),
      )
      return { franquiaId, subtotal: subtotalItens(elegiveis) }
    })
    .filter(
      (g): g is { franquiaId: string; subtotal: number } =>
        !!g.franquiaId &&
        g.subtotal > 0 &&
        (cupom.franquia_id == null || g.franquiaId === cupom.franquia_id),
    )
  if (aplicaveis.length === 0) return { ok: false, motivo: 'nao_aplicavel' }

  // Mínimo: sobre o subtotal elegível do carrinho inteiro.
  const minimo = Number(cupom.valor_minimo ?? 0)
  if (minimo > 0) {
    const totalElegivel = aplicaveis.reduce((s, g) => s + g.subtotal, 0)
    if (totalElegivel < minimo) {
      return {
        ok: false,
        motivo: 'minimo_nao_atingido',
        faltam: Math.round(minimo - totalElegivel),
      }
    }
  }

  const desconto: Record<string, number> = {}

  if (cupom.tipo === 'percentual') {
    const pct = Math.min(valor, 100)
    for (const g of aplicaveis) {
      desconto[g.franquiaId] = Math.round((g.subtotal * pct) / 100)
    }
    return { ok: true, descontoPorFranquia: desconto }
  }

  if (cupom.tipo === 'valor_fixo') {
    // Uma aplicação só: no grupo de maior subtotal elegível, sem passar dele.
    const alvo = aplicaveis.reduce((a, b) => (b.subtotal > a.subtotal ? b : a))
    desconto[alvo.franquiaId] = Math.min(Math.round(valor), alvo.subtotal)
    return { ok: true, descontoPorFranquia: desconto }
  }

  return { ok: false, motivo: 'nao_aplicavel' }
}

/** Subtotal (Gs.) dos itens de um grupo que o cupom cobre — usado nos testes. */
export function subtotalElegivel(
  cupom: CupomInfo,
  itens: ItemCarrinho[],
  produtosElegiveis: ReadonlySet<string> = new Set(),
): number {
  return subtotalItens(
    itens.filter((i) => itemElegivel(cupom, i, produtosElegiveis)),
  )
}
