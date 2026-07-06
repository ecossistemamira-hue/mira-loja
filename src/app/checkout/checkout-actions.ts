'use server'

import { revalidatePath } from 'next/cache'

import { CheckoutSchema, type CheckoutInput } from '@/lib/checkout-schema'
import {
  aprovarPagamento,
  criarPedidosDoCarrinho,
  type PedidoCriado,
} from '@/lib/checkout'

type ResultadoFinalizar =
  | { ok: true; pedidos: PedidoCriado[] }
  | { ok: false; error: string }

export async function finalizarCheckout(
  input: CheckoutInput,
): Promise<ResultadoFinalizar> {
  const parsed = CheckoutSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'dados_invalidos' }
  }

  // Ano do pedido: server roda em Node, Date disponível normalmente.
  const ano = new Date().getFullYear()
  const r = await criarPedidosDoCarrinho(parsed.data, ano)
  if (!r.ok) return r

  revalidatePath('/carrinho')
  return { ok: true, pedidos: r.pedidos }
}

/** Pagamento de teste (sem gateway real). Some quando o Mercado Pago entrar. */
export async function pagarTeste(
  pedidoId: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await aprovarPagamento(pedidoId, { gateway: 'manual', origem: 'teste' })
  revalidatePath('/checkout/sucesso')
  return r
}
