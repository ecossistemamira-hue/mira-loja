'use server'

import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase'

const RastreioSchema = z.object({
  codigo: z.string().min(5).max(30),
  email: z.string().email(),
})

export type PedidoRastreado = {
  codigo: string
  status: string
  created_at: string
  subtotal: number
  desconto: number
  frete: number
  total: number
  metodo_entrega: string
  itens: { nome: string; quantidade: number; preco: number }[]
  eventos: { status_para: string | null; created_at: string }[]
  vendedor: { nome_fantasia: string; cidade: string | null; pais: string } | null
}

export type ResultadoRastreio =
  | { ok: true; pedido: PedidoRastreado }
  | { ok: false }

/**
 * Rastreio público: código do pedido + e-mail do comprador. Os dois juntos são
 * a credencial (só código seria enumerável — MIRA-AAAA-N é sequencial). Roda
 * com service role porque anon não lê `pedidos` (e não deve); erro é sempre
 * genérico pra não confirmar existência de código.
 */
export async function rastrearPedido(input: {
  codigo: string
  email: string
}): Promise<ResultadoRastreio> {
  const parsed = RastreioSchema.safeParse(input)
  if (!parsed.success) return { ok: false }

  const svc = createServiceClient()
  const codigo = parsed.data.codigo.trim().toUpperCase()
  const email = parsed.data.email.trim().toLowerCase()

  const { data: pedido } = await svc
    .from('pedidos')
    .select(
      'id, codigo, status, created_at, subtotal, desconto, frete, total, metodo_entrega, comprador_email, franquia_id',
    )
    .eq('codigo', codigo)
    .is('deleted_at', null)
    .maybeSingle()

  if (!pedido || pedido.comprador_email.toLowerCase() !== email) {
    return { ok: false }
  }

  const [{ data: itens }, { data: eventos }, { data: vendedor }] =
    await Promise.all([
      svc
        .from('pedido_itens')
        .select('nome_snapshot, preco_snapshot, quantidade')
        .eq('pedido_id', pedido.id),
      svc
        .from('pedido_eventos')
        .select('status_para, created_at')
        .eq('pedido_id', pedido.id)
        .order('created_at', { ascending: false }),
      svc
        .from('franquias_publicas')
        .select('nome_fantasia, cidade, pais')
        .eq('id', pedido.franquia_id)
        .maybeSingle(),
    ])

  return {
    ok: true,
    pedido: {
      codigo: pedido.codigo,
      status: pedido.status,
      created_at: pedido.created_at,
      subtotal: Number(pedido.subtotal),
      desconto: Number(pedido.desconto),
      frete: Number(pedido.frete),
      total: Number(pedido.total),
      metodo_entrega: pedido.metodo_entrega,
      itens: (itens ?? []).map((i) => ({
        nome: i.nome_snapshot as string,
        quantidade: i.quantidade as number,
        preco: Number(i.preco_snapshot),
      })),
      eventos: (eventos ?? []).map((e) => ({
        status_para: e.status_para as string | null,
        created_at: e.created_at as string,
      })),
      vendedor:
        (vendedor as PedidoRastreado['vendedor']) ?? null,
    },
  }
}
