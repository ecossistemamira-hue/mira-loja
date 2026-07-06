import type { ProdutoVitrine } from '@/lib/types'

type Moeda = 'BRL' | 'PYG'

const LOCALE_MOEDA: Record<Moeda, string> = {
  BRL: 'pt-BR',
  PYG: 'es-PY',
}

export function formatarPreco(valor: number, moeda: Moeda): string {
  return new Intl.NumberFormat(LOCALE_MOEDA[moeda], {
    style: 'currency',
    currency: moeda,
    // PYG não usa centavos.
    minimumFractionDigits: moeda === 'PYG' ? 0 : 2,
    maximumFractionDigits: moeda === 'PYG' ? 0 : 2,
  }).format(valor)
}

/**
 * Preço de exibição do produto. Prefere PYG (mercado principal, Paraguai) e cai
 * pra BRL. Retorna null se o produto não tem preço cadastrado.
 */
export function precoExibicao(
  p: Pick<ProdutoVitrine, 'preco_pyg' | 'preco_brl'>,
): { texto: string; moeda: Moeda } | null {
  if (p.preco_pyg != null) {
    return { texto: formatarPreco(Number(p.preco_pyg), 'PYG'), moeda: 'PYG' }
  }
  if (p.preco_brl != null) {
    return { texto: formatarPreco(Number(p.preco_brl), 'BRL'), moeda: 'BRL' }
  }
  return null
}

export function estoqueDisponivel(
  p: Pick<ProdutoVitrine, 'estoque' | 'estoque_reservado'>,
): number {
  return Math.max(0, (p.estoque ?? 0) - (p.estoque_reservado ?? 0))
}

type ItemPrecos = { precoPyg: number | null; precoBrl: number | null }

/**
 * Moeda de um grupo (franquia) do carrinho/checkout: a da franquia, mas cai pra
 * moeda em que os itens realmente têm preço (evita total zerado).
 */
export function moedaDoGrupo(
  itens: ItemPrecos[],
  franquiaMoeda: string | null | undefined,
): Moeda {
  const preferida: Moeda = franquiaMoeda === 'BRL' ? 'BRL' : 'PYG'
  const temPreco = (m: Moeda) =>
    itens.some((i) => (m === 'BRL' ? i.precoBrl : i.precoPyg) != null)
  if (temPreco(preferida)) return preferida
  const outra: Moeda = preferida === 'BRL' ? 'PYG' : 'BRL'
  return temPreco(outra) ? outra : preferida
}

export function precoNaMoeda(item: ItemPrecos, moeda: Moeda): number | null {
  const v = moeda === 'BRL' ? item.precoBrl : item.precoPyg
  return v != null ? Number(v) : null
}
