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
