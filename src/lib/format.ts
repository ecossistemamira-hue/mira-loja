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

type PrecosProduto = Pick<ProdutoVitrine, 'preco_pyg' | 'preco_promocional_pyg'>

/** Promo vale quando existe e é menor que o preço cheio. */
function promoValida(p: PrecosProduto): boolean {
  return (
    p.preco_promocional_pyg != null &&
    p.preco_pyg != null &&
    Number(p.preco_promocional_pyg) < Number(p.preco_pyg)
  )
}

/** Preço que o comprador PAGA (promocional quando válido). */
export function precoVenda(p: PrecosProduto): number | null {
  if (p.preco_pyg == null) return null
  return promoValida(p) ? Number(p.preco_promocional_pyg) : Number(p.preco_pyg)
}

/**
 * Preço de exibição: texto do preço de venda + (quando em promoção) o preço
 * antigo riscado e o % de desconto pro badge.
 */
export function precoExibicao(p: PrecosProduto): {
  texto: string
  textoAntigo: string | null
  descontoPct: number | null
} | null {
  const venda = precoVenda(p)
  if (venda == null) return null
  if (!promoValida(p)) {
    return { texto: formatarPreco(venda), textoAntigo: null, descontoPct: null }
  }
  const cheio = Number(p.preco_pyg)
  return {
    texto: formatarPreco(venda),
    textoAntigo: formatarPreco(cheio),
    descontoPct: Math.round((1 - venda / cheio) * 100),
  }
}

export function estoqueDisponivel(
  p: Pick<ProdutoVitrine, 'estoque' | 'estoque_reservado'>,
): number {
  return Math.max(0, (p.estoque ?? 0) - (p.estoque_reservado ?? 0))
}

type ItemPrecos = { precoPyg: number | null; precoPromocionalPyg: number | null }

/** Preço unitário (Gs.) cobrado por um item do carrinho (promo quando válida). */
export function precoDoItem(item: ItemPrecos): number | null {
  return precoVenda({
    preco_pyg: item.precoPyg,
    preco_promocional_pyg: item.precoPromocionalPyg,
  })
}

/** Subtotal (Gs.) de uma lista de itens do carrinho. */
export function subtotalItens(
  itens: (ItemPrecos & { quantidade: number })[],
): number {
  return itens.reduce((soma, i) => {
    const p = precoDoItem(i)
    return soma + (p != null ? p * i.quantidade : 0)
  }, 0)
}
