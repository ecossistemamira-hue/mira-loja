import type { ProdutoVitrine } from '@/lib/types'

// Marketplace é 100% Paraguai: guarani (principal) e dólar. preco_brl é legado
// e a loja NÃO usa.
type Moeda = 'PYG' | 'USD'

export function formatarPreco(valor: number, moeda: Moeda): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: moeda,
    // PYG não usa centavos.
    minimumFractionDigits: moeda === 'PYG' ? 0 : 2,
    maximumFractionDigits: moeda === 'PYG' ? 0 : 2,
  }).format(valor)
}

/**
 * Preço de exibição do produto: guarani na frente e, quando o produto também
 * tem preço em dólar, o USD vem como secundário (padrão das lojas de CDE).
 * Retorna null se o produto não tem preço nenhum.
 */
export function precoExibicao(
  p: Pick<ProdutoVitrine, 'preco_pyg' | 'preco_usd'>,
): { texto: string; moeda: Moeda; textoSecundario: string | null } | null {
  const pyg = p.preco_pyg != null ? Number(p.preco_pyg) : null
  const usd = p.preco_usd != null ? Number(p.preco_usd) : null

  if (pyg != null) {
    return {
      texto: formatarPreco(pyg, 'PYG'),
      moeda: 'PYG',
      textoSecundario: usd != null ? formatarPreco(usd, 'USD') : null,
    }
  }
  if (usd != null) {
    return { texto: formatarPreco(usd, 'USD'), moeda: 'USD', textoSecundario: null }
  }
  return null
}

export function estoqueDisponivel(
  p: Pick<ProdutoVitrine, 'estoque' | 'estoque_reservado'>,
): number {
  return Math.max(0, (p.estoque ?? 0) - (p.estoque_reservado ?? 0))
}

type ItemPrecos = { precoPyg: number | null; precoUsd: number | null }

/**
 * Moeda de um grupo (franquia) do carrinho/checkout: guarani por padrão (é o
 * mercado), dólar se a franquia opera em USD ou se os itens só têm preço USD.
 */
export function moedaDoGrupo(
  itens: ItemPrecos[],
  franquiaMoeda: string | null | undefined,
): Moeda {
  const preferida: Moeda = franquiaMoeda === 'USD' ? 'USD' : 'PYG'
  const temPreco = (m: Moeda) =>
    itens.some((i) => (m === 'USD' ? i.precoUsd : i.precoPyg) != null)
  if (temPreco(preferida)) return preferida
  const outra: Moeda = preferida === 'USD' ? 'PYG' : 'USD'
  return temPreco(outra) ? outra : preferida
}

export function precoNaMoeda(item: ItemPrecos, moeda: Moeda): number | null {
  const v = moeda === 'USD' ? item.precoUsd : item.precoPyg
  return v != null ? Number(v) : null
}
