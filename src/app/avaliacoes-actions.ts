'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase'
import { obterUsuarioLoja } from '@/lib/supabase-auth'

const AvaliacaoSchema = z.object({
  produtoId: z.string().uuid(),
  nota: z.number().int().min(1).max(5),
  titulo: z.string().max(80).optional().or(z.literal('')),
  comentario: z.string().max(2000).optional().or(z.literal('')),
})
export type AvaliacaoInput = z.infer<typeof AvaliacaoSchema>

export type ResultadoAvaliacao =
  | { ok: true; compraVerificada: boolean }
  | { ok: false; error: 'nao_logado' | 'invalido' | 'produto_nao_encontrado' | 'falha' }

// Status de pedido que contam como "comprou de verdade" pro selo.
const STATUS_COMPRA = ['pago', 'em_separacao', 'enviado', 'pronto_retirada', 'entregue']

/**
 * Cria/atualiza a avaliação do comprador logado (1 por produto — a UNIQUE de
 * 0088 garante; aqui fazemos upsert). Grava via service role: a Server Action
 * é quem valida a sessão e decide `compra_verificada`.
 */
export async function enviarAvaliacao(
  input: AvaliacaoInput,
): Promise<ResultadoAvaliacao> {
  const parsed = AvaliacaoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalido' }

  const user = await obterUsuarioLoja()
  if (!user) return { ok: false, error: 'nao_logado' }

  const svc = createServiceClient()

  const { data: produto } = await svc
    .from('produtos')
    .select('id, slug, franquia_id')
    .eq('id', parsed.data.produtoId)
    .maybeSingle()
  if (!produto) return { ok: false, error: 'produto_nao_encontrado' }

  // Comprador da conta (cria um se o usuário nunca comprou — pode avaliar,
  // só não ganha o selo de compra verificada).
  let { data: comprador } = await svc
    .from('compradores')
    .select('id, nome')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!comprador) {
    const nome =
      (user.user_metadata?.nome_completo as string | undefined) ??
      user.email?.split('@')[0] ??
      'Cliente'
    const { data: novo, error } = await svc
      .from('compradores')
      .insert({
        auth_user_id: user.id,
        nome,
        email: (user.email ?? '').toLowerCase(),
      })
      .select('id, nome')
      .single()
    if (error || !novo) return { ok: false, error: 'falha' }
    comprador = novo
  }

  // Compra verificada: algum pedido pago (ou além) contendo o produto.
  const { data: pedidosDoComprador } = await svc
    .from('pedidos')
    .select('id, pedido_itens!inner(produto_id)')
    .eq('comprador_id', comprador.id)
    .eq('pedido_itens.produto_id', produto.id)
    .in('status', STATUS_COMPRA)
    .limit(1)
  const compraVerificada = (pedidosDoComprador?.length ?? 0) > 0

  const { error: errUpsert } = await svc.from('produto_avaliacoes').upsert(
    {
      franquia_id: produto.franquia_id,
      produto_id: produto.id,
      comprador_id: comprador.id,
      nota: parsed.data.nota,
      titulo: parsed.data.titulo?.trim() || null,
      comentario: parsed.data.comentario?.trim() || null,
      nome_exibicao: comprador.nome,
      compra_verificada: compraVerificada,
      deleted_at: null,
    },
    { onConflict: 'produto_id,comprador_id' },
  )
  if (errUpsert) {
    console.error('[loja.enviarAvaliacao]', errUpsert)
    return { ok: false, error: 'falha' }
  }

  if (produto.slug) {
    revalidatePath(`/p/${produto.slug}`)
    revalidatePath(`/pt/p/${produto.slug}`)
  }
  return { ok: true, compraVerificada }
}

export type MinhaAvaliacao = {
  nota: number
  titulo: string | null
  comentario: string | null
} | null

/** Avaliação já feita pelo usuário logado neste produto (pré-preenche o form). */
export async function obterMinhaAvaliacao(
  produtoId: string,
): Promise<MinhaAvaliacao> {
  const user = await obterUsuarioLoja()
  if (!user) return null

  const svc = createServiceClient()
  const { data: comprador } = await svc
    .from('compradores')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!comprador) return null

  const { data } = await svc
    .from('produto_avaliacoes')
    .select('nota, titulo, comentario')
    .eq('produto_id', produtoId)
    .eq('comprador_id', comprador.id)
    .is('deleted_at', null)
    .maybeSingle()
  return (data as MinhaAvaliacao) ?? null
}
