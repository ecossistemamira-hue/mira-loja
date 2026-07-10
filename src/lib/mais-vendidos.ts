import 'server-only'

import { COLUNAS_VITRINE } from '@/lib/queries'
import { createLojaClient, createServiceClient } from '@/lib/supabase'
import type { ProdutoVitrine } from '@/lib/types'

// Pedido conta como venda a partir do pagamento (inclui os já em logística).
const STATUS_VENDIDO = [
  'pago',
  'em_separacao',
  'enviado',
  'pronto_retirada',
  'entregue',
]

/**
 * Produtos mais vendidos: agrega quantidades de `pedido_itens` de pedidos
 * pagos e devolve os produtos AINDA publicados, na ordem do ranking.
 *
 * Usa service role SÓ na leitura do agregado (RLS de pedidos/pedido_itens não
 * tem policy anon — e não deve ter, são dados de compra). Nenhum dado do
 * pedido vaza: daqui só saem ids/quantidades, e os produtos em si voltam a
 * passar pela RLS pública `produtos_publico` via anon.
 */
export async function listarMaisVendidos(
  limite = 12,
): Promise<ProdutoVitrine[]> {
  const svc = createServiceClient()
  const { data, error } = await svc
    .from('pedido_itens')
    .select('produto_id, quantidade, pedidos!inner(status)')
    .in('pedidos.status', STATUS_VENDIDO)
    .limit(2000)

  if (error || !data) {
    if (error) console.error('[loja.listarMaisVendidos]', error)
    return []
  }

  const vendidos = new Map<string, number>()
  for (const row of data as unknown as {
    produto_id: string | null
    quantidade: number
  }[]) {
    if (!row.produto_id) continue
    vendidos.set(
      row.produto_id,
      (vendidos.get(row.produto_id) ?? 0) + row.quantidade,
    )
  }
  if (vendidos.size === 0) return []

  const ranking = [...vendidos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([id]) => id)

  // Volta pro anon: só produtos publicados/aprovados aparecem (RLS 0081).
  const anon = createLojaClient()
  const { data: produtos, error: errProdutos } = await anon
    .from('produtos')
    .select(COLUNAS_VITRINE)
    .in('id', ranking)
  if (errProdutos || !produtos) return []

  const porId = new Map(
    (produtos as ProdutoVitrine[]).map((p) => [p.id, p]),
  )
  return ranking
    .map((id) => porId.get(id))
    .filter((p): p is ProdutoVitrine => !!p)
}
