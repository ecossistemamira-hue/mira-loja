import { NextResponse, type NextRequest } from 'next/server'

import { expirarPedidosVencidos } from '@/lib/checkout'

export const dynamic = 'force-dynamic'

/**
 * Cron (Vercel Cron): expira pedidos não pagos além do TTL e devolve a reserva
 * de estoque. Protegido por CRON_SECRET — o Vercel Cron envia
 * `Authorization: Bearer <CRON_SECRET>`; aceitamos também `?secret=` pra testes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'cron_nao_configurado' }, { status: 500 })
  }

  const auth = request.headers.get('authorization')
  const qsSecret = request.nextUrl.searchParams.get('secret')
  const autorizado = auth === `Bearer ${secret}` || qsSecret === secret
  if (!autorizado) {
    return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
  }

  try {
    const expirados = await expirarPedidosVencidos()
    return NextResponse.json({ ok: true, expirados })
  } catch (err) {
    console.error('[cron.expirar-pedidos]', err)
    return NextResponse.json({ error: 'falha' }, { status: 500 })
  }
}
