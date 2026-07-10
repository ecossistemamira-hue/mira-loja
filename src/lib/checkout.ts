import 'server-only'

import { lerCarrinhoId } from '@/lib/cart'
import { obterCarrinho } from '@/lib/cart-queries'
import type { CheckoutInput } from '@/lib/checkout-schema'
import { validarCupomParaCarrinho, type CupomAplicado } from '@/lib/cupom'
import {
  emailPagamentoConfirmado,
  emailPedidoRecebido,
} from '@/lib/email'
import { precoDoItem, subtotalItens } from '@/lib/format'
import { cotarFrete } from '@/lib/frete'
import { createServiceClient } from '@/lib/supabase'

export type PedidoCriado = {
  id: string
  codigo: string
  total: number
  moeda: 'PYG'
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
  /** auth.uid() do comprador logado — vincula o pedido à conta dele. */
  authUserId?: string | null,
): Promise<ResultadoCheckout> {
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return { ok: false, error: 'carrinho_vazio' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'carrinho_vazio' }

  const svc = createServiceClient()

  // ── Fase 0: cupom (validação; o consumo atômico vem depois da reserva) ────
  let cupom: CupomAplicado | null = null
  if (dados.cupom) {
    const r = await validarCupomParaCarrinho(dados.cupom, grupos)
    if (!r.ok) return { ok: false, error: `cupom:${r.error}` }
    cupom = r.cupom
  }

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

  // ── Fase 2: comprador ─────────────────────────────────────────────────────
  // Logado: usa/cria o comprador da conta (auth_user_id). Convidado: reusa
  // por e-mail (sem conta) ou cria um novo.
  const emailNorm = dados.email.trim().toLowerCase()
  let compradorId: string | null = null

  if (authUserId) {
    const { data: daConta } = await svc
      .from('compradores')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
    if (daConta) {
      compradorId = daConta.id
      // Completa dados que o comprador preencheu agora no checkout.
      await svc
        .from('compradores')
        .update({
          telefone: dados.telefone || null,
          documento: dados.documento || null,
        })
        .eq('id', daConta.id)
    }
  }

  if (!compradorId) {
    const { data: existente } = await svc
      .from('compradores')
      .select('id')
      .eq('email', emailNorm)
      .is('auth_user_id', null)
      .maybeSingle()
    if (existente) {
      compradorId = existente.id
      if (authUserId) {
        // Comprador convidado com o mesmo e-mail vira o comprador da conta.
        await svc
          .from('compradores')
          .update({ auth_user_id: authUserId })
          .eq('id', existente.id)
      }
    } else {
      const { data: novo, error } = await svc
        .from('compradores')
        .insert({
          auth_user_id: authUserId ?? null,
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
  }

  // ── Fase 2.5: consome 1 uso do cupom (atômico — protege o último uso) ─────
  if (cupom) {
    const { data: consumiu, error: errCupom } = await svc.rpc('usar_cupom', {
      p_cupom_id: cupom.cupomId,
    })
    if (errCupom || consumiu !== true) {
      await liberarReservas(svc, reservas)
      return { ok: false, error: 'cupom:esgotado' }
    }
  }

  // ── Fase 3: um pedido por franquia ────────────────────────────────────────
  const expiraEm = new Date(Date.now() + TTL_MINUTOS * 60_000).toISOString()
  const enderecoSnapshot =
    dados.metodoEntrega === 'envio' && dados.endereco
      ? { ...dados.endereco, cidade_aex_id: dados.cidadeEntregaId ?? null }
      : null
  const criados: PedidoCriado[] = []

  for (const grupo of grupos) {
    const moeda = 'PYG' as const // marketplace vende só em guarani
    const franquiaId = grupo.itens[0]?.franquiaId
    const subtotal = subtotalItens(grupo.itens)

    // Frete recalculado AQUI (nunca confiar em valor vindo do cliente):
    // tabela oficial da AEX pela cidade de destino + peso.
    let frete = 0
    if (dados.metodoEntrega === 'envio' && dados.cidadeEntregaId != null) {
      const cotacao = cotarFrete(
        dados.cidadeEntregaId,
        grupo.itens.map((i) => ({
          pesoGramas: i.pesoGramas,
          alturaCm: i.alturaCm,
          larguraCm: i.larguraCm,
          comprimentoCm: i.comprimentoCm,
          quantidade: i.quantidade,
        })),
      )
      if (!cotacao.ok) {
        await liberarReservas(svc, reservas)
        return { ok: false, error: `frete:${cotacao.error}` }
      }
      frete = cotacao.valor
    }

    const { data: codigo } = await svc.rpc('gerar_codigo_pedido', {
      p_ano: ano,
    })

    // Desconto do cupom pra ESTA franquia (0 quando não se aplica ao grupo).
    const desconto = franquiaId
      ? (cupom?.descontoPorFranquia[franquiaId] ?? 0)
      : 0
    const total = Math.max(0, subtotal - desconto) + frete

    const { data: pedido, error: errPedido } = await svc
      .from('pedidos')
      .insert({
        codigo: codigo ?? `MIRA-${ano}-${Date.now()}`,
        franquia_id: franquiaId,
        comprador_id: compradorId,
        status: 'aguardando_pagamento',
        moeda,
        subtotal,
        desconto,
        cupom_id: desconto > 0 ? cupom?.cupomId : null,
        frete,
        total,
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
      preco_snapshot: precoDoItem(i) ?? 0,
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
      valor: total,
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

  // E-mail de "pedido recebido" (best-effort; não bloqueia o checkout).
  await emailPedidoRecebido(
    emailNorm,
    dados.nome.trim(),
    criados.map((p) => ({ codigo: p.codigo, total: p.total })),
  ).catch(() => null)

  return { ok: true, pedidos: criados }
}

export type DadosPagamento = {
  gateway?: string
  gatewayPaymentId?: string
  metodo?: string
  origem?: string
}

/**
 * Aprova o pagamento de um pedido: baixa o estoque definitivamente, marca `pago`,
 * atualiza a linha de pagamento e envia o e-mail de confirmação. Chamado tanto
 * pelo botão de pagamento de teste quanto pelo webhook do gateway.
 *
 * IDEMPOTENTE: se o pedido não está mais em `aguardando_pagamento`, não faz nada
 * (protege contra reentrega de webhook, que o Mercado Pago faz com frequência).
 */
export async function aprovarPagamento(
  pedidoId: string,
  dados: DadosPagamento = {},
): Promise<{ ok: boolean; error?: string }> {
  const svc = createServiceClient()

  const { data: pedido } = await svc
    .from('pedidos')
    .select(
      'id, status, codigo, total, moeda, comprador_email, comprador_nome',
    )
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
  await svc
    .from('pagamentos')
    .update({
      status: 'approved',
      gateway: dados.gateway ?? undefined,
      gateway_payment_id: dados.gatewayPaymentId ?? undefined,
      metodo: dados.metodo ?? undefined,
    })
    .eq('pedido_id', pedidoId)
  await svc.from('pedido_eventos').insert({
    pedido_id: pedidoId,
    status_de: 'aguardando_pagamento',
    status_para: 'pago',
    origem: dados.origem ?? 'webhook',
  })

  await emailPagamentoConfirmado(pedido.comprador_email, pedido.comprador_nome, {
    codigo: pedido.codigo,
    total: Number(pedido.total),
  }).catch(() => null)

  return { ok: true }
}

/**
 * Expira pedidos não pagos além do TTL e devolve a reserva de estoque.
 * Chamado pelo cron (Vercel Cron). Retorna quantos expiraram.
 */
export async function expirarPedidosVencidos(): Promise<number> {
  const svc = createServiceClient()

  const agora = new Date().toISOString()
  const { data: vencidos } = await svc
    .from('pedidos')
    .select('id')
    .eq('status', 'aguardando_pagamento')
    .not('expira_em', 'is', null)
    .lt('expira_em', agora)
    .limit(500)

  if (!vencidos || vencidos.length === 0) return 0

  for (const p of vencidos) {
    const { data: itens } = await svc
      .from('pedido_itens')
      .select('produto_id, quantidade')
      .eq('pedido_id', p.id)
    for (const it of itens ?? []) {
      if (it.produto_id) {
        await svc.rpc('liberar_reserva_estoque', {
          p_produto_id: it.produto_id,
          p_qtd: it.quantidade,
        })
      }
    }
    await svc.from('pedidos').update({ status: 'expirado' }).eq('id', p.id)
    await svc.from('pedido_eventos').insert({
      pedido_id: p.id,
      status_de: 'aguardando_pagamento',
      status_para: 'expirado',
      origem: 'cron',
    })
  }

  return vencidos.length
}

/** Busca um pedido por código pra o webhook resolver o id. */
export async function obterIdPorCodigo(codigo: string): Promise<string | null> {
  const svc = createServiceClient()
  const { data } = await svc
    .from('pedidos')
    .select('id')
    .eq('codigo', codigo)
    .maybeSingle()
  return data?.id ?? null
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
