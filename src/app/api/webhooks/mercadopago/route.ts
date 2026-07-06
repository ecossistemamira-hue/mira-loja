import { NextResponse, type NextRequest } from 'next/server'

import { aprovarPagamento } from '@/lib/checkout'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Webhook do Mercado Pago (adaptador). ESQUELETO pronto pra ligar quando as
 * credenciais existirem — hoje o MP não está configurado.
 *
 * Fluxo quando ativo (plano §4.4):
 *  1. Validar a assinatura do MP (header x-signature) com MP_WEBHOOK_SECRET.
 *  2. NUNCA confiar no payload: consultar o pagamento na API do MP com
 *     MP_ACCESS_TOKEN (o MP reenvia eventos e envia fora de ordem).
 *  3. Achar o pedido pela external_reference (gravamos o código lá no checkout).
 *  4. Se aprovado → aprovarPagamento (idempotente).
 *
 * Sempre responde 200 rápido pra o MP não reenfileirar.
 */
export async function POST(request: NextRequest) {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    // MP ainda não configurado: aceita o ping de validação sem agir.
    console.warn('[webhook.mp] MP_ACCESS_TOKEN ausente — evento ignorado')
    return NextResponse.json({ ok: true, ignorado: true })
  }

  let evento: Record<string, unknown>
  try {
    evento = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    // TODO(mp): validar x-signature; buscar o pagamento em
    // https://api.mercadopago.com/v1/payments/{id} com Bearer token; extrair
    // status + external_reference (código do pedido).
    const data = evento.data as { id?: string } | undefined
    const paymentId = data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!resp.ok) return NextResponse.json({ ok: true })
    const pagamento = (await resp.json()) as {
      status?: string
      external_reference?: string
      payment_method_id?: string
    }

    if (pagamento.status === 'approved' && pagamento.external_reference) {
      const svc = createServiceClient()
      const { data: pedido } = await svc
        .from('pedidos')
        .select('id')
        .eq('codigo', pagamento.external_reference)
        .maybeSingle()
      if (pedido) {
        await aprovarPagamento(pedido.id, {
          gateway: 'mercadopago',
          gatewayPaymentId: String(paymentId),
          metodo: pagamento.payment_method_id,
          origem: 'webhook',
        })
      }
    }
  } catch (err) {
    console.error('[webhook.mp]', err)
  }

  return NextResponse.json({ ok: true })
}
