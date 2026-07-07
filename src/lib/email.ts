import 'server-only'

import { Resend } from 'resend'

import { formatarPreco } from '@/lib/format'

// Resend lazy: só instancia quando precisa enviar (build/typecheck não exigem a
// env). Se RESEND_API_KEY faltar, os envios viram no-op — não quebram o fluxo.
let cliente: Resend | null = null

function obterCliente(): Resend | null {
  if (cliente) return cliente
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY ausente — e-mails serão skipados')
    return null
  }
  cliente = new Resend(apiKey)
  return cliente
}

const FROM =
  process.env.RESEND_FROM_EMAIL || 'Mira Shop <no-reply@mirafranquicia.com>'

type Moeda = 'BRL' | 'PYG'

async function enviar(to: string, subject: string, html: string) {
  const resend = obterCliente()
  if (!resend) return
  try {
    const r = await resend.emails.send({ from: FROM, to, subject, html })
    if (r.error) console.error('[email] erro Resend:', r.error)
  } catch (err) {
    console.error('[email] exceção Resend:', err)
  }
}

function layout(titulo: string, corpo: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111827">
    <div style="background:#a02237;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:18px;font-weight:800">Mira Shop</div>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${titulo}</h1>
      ${corpo}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">Rede de franquias Mira</p>
  </div>`
}

function linhaPedido(codigo: string, total: number, moeda: Moeda): string {
  return `<div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:8px;padding:12px 16px;margin:8px 0;display:flex;justify-content:space-between">
    <span style="font-family:monospace;font-weight:600;color:#7d1a2b">${codigo}</span>
    <span style="font-weight:700">${formatarPreco(total, moeda)}</span>
  </div>`
}

export type ResumoPedidoEmail = {
  codigo: string
  total: number
  moeda: Moeda
}

/** Pedido(s) recebido(s) — aguardando pagamento. */
export async function emailPedidoRecebido(
  to: string,
  nome: string,
  pedidos: ResumoPedidoEmail[],
) {
  const linhas = pedidos
    .map((p) => linhaPedido(p.codigo, p.total, p.moeda))
    .join('')
  const html = layout(
    `¡Gracias por tu compra, ${nome}!`,
    `<p style="font-size:14px;color:#374151;line-height:1.6">Recibimos tu pedido. Te avisamos apenas se confirme el pago.</p>${linhas}`,
  )
  await enviar(to, 'Recibimos tu pedido · Mira Shop', html)
}

/** Pagamento confirmado de um pedido. */
export async function emailPagamentoConfirmado(
  to: string,
  nome: string,
  pedido: ResumoPedidoEmail,
) {
  const html = layout(
    `¡Pago confirmado, ${nome}!`,
    `<p style="font-size:14px;color:#374151;line-height:1.6">La franquicia ya puede preparar tu pedido.</p>${linhaPedido(pedido.codigo, pedido.total, pedido.moeda)}`,
  )
  await enviar(to, `Pago confirmado · ${pedido.codigo}`, html)
}
