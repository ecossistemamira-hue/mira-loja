import { NextResponse, type NextRequest } from 'next/server'

import { aprovarPagamento, obterIdPorCodigo } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

/**
 * Webhook de pagamento genérico (fonte da verdade do status). Protegido por
 * WEBHOOK_SECRET no header `x-webhook-secret`. É o alvo interno que o adaptador
 * do Mercado Pago (ou o teste) chama quando um pagamento é aprovado.
 *
 * IDEMPOTENTE: `aprovarPagamento` só age se o pedido ainda está aguardando —
 * reentregas do gateway não duplicam baixa de estoque nem e-mail.
 *
 * Body: { codigo?|pedido_id?, status, gateway?, gateway_payment_id?, metodo? }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'webhook_nao_configurado' }, { status: 500 })
  }
  if (request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'payload_invalido' }, { status: 400 })
  }

  const codigo = typeof body.codigo === 'string' ? body.codigo : null
  const pedidoIdBody = typeof body.pedido_id === 'string' ? body.pedido_id : null
  const status = typeof body.status === 'string' ? body.status : null

  const pedidoId = pedidoIdBody ?? (codigo ? await obterIdPorCodigo(codigo) : null)
  if (!pedidoId) {
    return NextResponse.json({ error: 'pedido_nao_encontrado' }, { status: 404 })
  }

  // Só a aprovação altera estado hoje; outros status ficam registrados no
  // gateway e o pedido expira sozinho pelo cron se nunca for pago.
  if (status === 'approved' || status === 'pago') {
    const r = await aprovarPagamento(pedidoId, {
      gateway: typeof body.gateway === 'string' ? body.gateway : undefined,
      gatewayPaymentId:
        typeof body.gateway_payment_id === 'string'
          ? body.gateway_payment_id
          : undefined,
      metodo: typeof body.metodo === 'string' ? body.metodo : undefined,
      origem: 'webhook',
    })
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
