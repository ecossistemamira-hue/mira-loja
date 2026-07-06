import 'server-only'

import { lerCarrinhoId } from '@/lib/cart'
import { obterCarrinho } from '@/lib/cart-queries'
import type { CheckoutInput } from '@/lib/checkout-schema'
import { moedaDoGrupo, precoNaMoeda } from '@/lib/format'
import { createServiceClient } from '@/lib/supabase'

export type PedidoCriado = {
  id: string
  codigo: string
  total: number
  moeda: 'BRL' | 'PYG'
  franquia: string | null
}

export type ResultadoCheckout =
  | { ok: true; pedidos: PedidoCriado[] }
  | { ok: false; error: string }

// TTL da reserva: pedido não pago expira e devolve o estoque (cron da Fase 2).
const TTL_MINUTOS = 60

type Svc = ReturnType<typeof createServiceClient>

async function liberarReservas(
  svc: Svc,
  reservas: { produtoId: string; qtd: number }[],
) {
  for (const r of reservas) {
    try {
      await svc.rpc('liberar_reserva_estoque', {
        p_produto_id: r.produtoId,
        p_qtd: r.qtd,
      })
    } catch {
      // best-effort: liberar reserva não pode derrubar o fluxo de erro.
    }
  }
}

/**
 * Cria um pedido por franquia a partir do carrinho (§2.3). Reserva o estoque
 * atomicamente ANTES de criar; se faltar estoque de qualquer item, libera tudo
 * que já reservou e aborta. Pedidos nascem em `aguardando_pagamento`.
 *
 * Roda com service role (RLS não deixa anon escrever em pedidos/compradores).
 */
export async function criarPedidosDoCarrinho(
  dados: CheckoutInput,
  ano: number,
): Promise<ResultadoCheckout> {
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return { ok: false, error: 'carrinho_vazio' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'carrinho_vazio' }

  const svc = createServiceClient()

  // ── Fase 1: reserva atômica de todos os itens ────────────────────────────
  const reservas: { produtoId: string; qtd: number }[] = []
  for (const grupo of grupos) {
    for (const item of grupo.itens) {
      const { data: ok, error } = await svc.rpc('reservar_estoque', {
        p_produto_id: item.produtoId,
        p_qtd: item.quantidade,
      })
      if (error || ok !== true) {
        await liberarReservas(svc, reservas)
        return { ok: false, error: `sem_estoque:${item.nome}` }
      }
      reservas.push({ produtoId: item.produtoId, qtd: item.quantidade })
    }
  }

  // ── Fase 2: comprador (reusa por email se já existe como convidado) ───────
  const emailNorm = dados.email.trim().toLowerCase()
  let compradorId: string | null = null
  const { data: existente } = await svc
    .from('compradores')
    .select('id')
    .eq('email', emailNorm)
    .is('auth_user_id', null)
    .maybeSingle()
  if (existente) {
    compradorId = existente.id
  } else {
    const { data: novo, error } = await svc
      .from('compradores')
      .insert({
        nome: dados.nome.trim(),
        email: emailNorm,
        telefone: dados.telefone || null,
        documento: dados.documento || null,
        pais: dados.endereco?.pais ?? 'BR',
      })
      .select('id')
      .single()
    if (error || !novo) {
      await liberarReservas(svc, reservas)
      return { ok: false, error: 'falha_comprador' }
    }
    compradorId = novo.id
  }

  // ── Fase 3: um pedido por franquia ────────────────────────────────────────
  const expiraEm = new Date(Date.now() + TTL_MINUTOS * 60_000).toISOString()
  const enderecoSnapshot =
    dados.metodoEntrega === 'envio' && dados.endereco ? dados.endereco : null
  const criados: PedidoCriado[] = []

  for (const grupo of grupos) {
    const moeda = moedaDoGrupo(grupo.itens, grupo.franquia?.moeda)
    const franquiaId = grupo.itens[0]?.franquiaId
    const subtotal = grupo.itens.reduce((s, i) => {
      const p = precoNaMoeda(i, moeda)
      return s + (p != null ? p * i.quantidade : 0)
    }, 0)

    const { data: codigo } = await svc.rpc('gerar_codigo_pedido', {
      p_ano: ano,
    })

    const { data: pedido, error: errPedido } = await svc
      .from('pedidos')
      .insert({
        codigo: codigo ?? `MIRA-${ano}-${Date.now()}`,
        franquia_id: franquiaId,
        comprador_id: compradorId,
        status: 'aguardando_pagamento',
        moeda,
        subtotal,
        desconto: 0,
        frete: 0, // frete real chega na Fase 3 (Melhor Envio)
        total: subtotal,
        metodo_entrega: dados.metodoEntrega,
        endereco_entrega: enderecoSnapshot,
        comprador_nome: dados.nome.trim(),
        comprador_email: emailNorm,
        comprador_telefone: dados.telefone || null,
        comprador_documento: dados.documento || null,
        expira_em: expiraEm,
      })
      .select('id, codigo, total')
      .single()

    if (errPedido || !pedido) {
      await liberarReservas(svc, reservas)
      return { ok: false, error: 'falha_pedido' }
    }

    const itensPayload = grupo.itens.map((i) => ({
      pedido_id: pedido.id,
      produto_id: i.produtoId,
      nome_snapshot: i.nome,
      preco_snapshot: precoNaMoeda(i, moeda) ?? 0,
      quantidade: i.quantidade,
    }))
    await svc.from('pedido_itens').insert(itensPayload)

    await svc.from('pedido_eventos').insert({
      pedido_id: pedido.id,
      status_para: 'aguardando_pagamento',
      origem: 'checkout',
    })

    await svc.from('pagamentos').insert({
      pedido_id: pedido.id,
      gateway: 'manual',
      status: 'pending',
      valor: subtotal,
    })

    criados.push({
      id: pedido.id,
      codigo: pedido.codigo,
      total: Number(pedido.total),
      moeda,
      franquia: grupo.franquia?.nome_fantasia ?? null,
    })
  }

  // ── Fase 4: esvazia o carrinho ────────────────────────────────────────────
  await svc.from('carrinho_itens').delete().eq('carrinho_id', carrinhoId)

  return { ok: true, pedidos: criados }
}

/**
 * Pagamento de TESTE (sem Mercado Pago): aprova o pedido e baixa o estoque.
 * Em produção, isto será feito pelo webhook do gateway. Idempotente por status.
 */
export async function simularPagamentoAprovado(
  pedidoId: string,
): Promise<{ ok: boolean; error?: string }> {
  const svc = createServiceClient()

  const { data: pedido } = await svc
    .from('pedidos')
    .select('id, status')
    .eq('id', pedidoId)
    .maybeSingle()
  if (!pedido) return { ok: false, error: 'pedido_nao_encontrado' }
  if (pedido.status !== 'aguardando_pagamento') {
    return { ok: true } // já processado (idempotente)
  }

  const { data: itens } = await svc
    .from('pedido_itens')
    .select('produto_id, quantidade')
    .eq('pedido_id', pedidoId)

  // Baixa definitiva do estoque (estoque -= qtd; reservado -= qtd).
  for (const it of itens ?? []) {
    if (it.produto_id) {
      await svc.rpc('baixar_estoque', {
        p_produto_id: it.produto_id,
        p_qtd: it.quantidade,
      })
    }
  }

  await svc.from('pedidos').update({ status: 'pago' }).eq('id', pedidoId)
  await svc.from('pagamentos').update({ status: 'approved' }).eq('pedido_id', pedidoId)
  await svc.from('pedido_eventos').insert({
    pedido_id: pedidoId,
    status_de: 'aguardando_pagamento',
    status_para: 'pago',
    origem: 'teste',
    payload: { nota: 'pagamento simulado (sem gateway real)' },
  })

  return { ok: true }
}

// Consulta um pedido pelo código (página de sucesso). Via service pra não
// depender de auth do comprador convidado — o código do pedido é o "segredo".
export async function obterPedidoPorCodigo(codigo: string) {
  const svc = createServiceClient()
  const { data } = await svc
    .from('pedidos')
    .select('id, codigo, status, moeda, total, franquia_id, metodo_entrega')
    .eq('codigo', codigo)
    .maybeSingle()
  return data
}
