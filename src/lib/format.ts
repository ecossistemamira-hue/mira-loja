import type { ProdutoVitrine } from '@/lib/types'

// Marketplace é 100% Paraguai e vende SÓ em guarani (decisão 2026-07-08).
// preco_brl/preco_usd existem no banco como legado — a loja não lê.

export function formatarPreco(valor: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    // PYG não usa centavos.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/** Preço de exibição do produto (Gs.), ou null se não precificado. */
export function precoExibicao(
  p: Pick<ProdutoVitrine, 'preco_pyg'>,
): { texto: string } | null {
  if (p.preco_pyg == null) return null
  return { texto: formatarPreco(Number(p.preco_pyg)) }
}

export function estoqueDisponivel(
  p: Pick<ProdutoVitrine, 'estoque' | 'estoque_reservado'>,
): number {
  return Math.max(0, (p.estoque ?? 0) - (p.estoque_reservado ?? 0))
}

/** Preço unitário (Gs.) de um item do carrinho. */
export function precoDoItem(item: { precoPyg: number | null }): number | null {
  return item.precoPyg != null ? Number(item.precoPyg) : null
}

/** Subtotal (Gs.) de uma lista de itens do carrinho. */
export function subtotalItens(
  itens: { precoPyg: number | null; quantidade: number }[],
): number {
  return itens.reduce((soma, i) => {
    const p = precoDoItem(i)
    return soma + (p != null ? p * i.quantidade : 0)
  }, 0)
}
