'use server'

import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase'

const AvisoSchema = z.object({
  produtoId: z.string().uuid(),
  email: z.string().email().max(200),
})
export type AvisoEstoqueInput = z.infer<typeof AvisoSchema>

export type ResultadoAvisoEstoque =
  | { ok: true }
  | { ok: false; error: 'invalido' | 'produto_nao_encontrado' | 'falha' }

/**
 * Registra o pedido de "avise-me quando voltar ao estoque". Escrita via
 * service role (a tabela não tem policy de INSERT — só a Server Action grava,
 * depois de validar). Repetir o mesmo e-mail re-arma o aviso (zera
 * `notificado_em`) — o UNIQUE (produto, email) da migration 0095 deduplica.
 * O disparo acontece no gestor, quando a franquia repõe o estoque.
 */
export async function registrarAvisoEstoque(
  input: AvisoEstoqueInput,
): Promise<ResultadoAvisoEstoque> {
  const parsed = AvisoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalido' }

  const svc = createServiceClient()

  // Só produtos realmente visíveis na loja aceitam aviso.
  const { data: produto } = await svc
    .from('produtos')
    .select('id')
    .eq('id', parsed.data.produtoId)
    .eq('publicado_loja', true)
    .eq('status', 'aprovado')
    .is('deleted_at', null)
    .maybeSingle()
  if (!produto) return { ok: false, error: 'produto_nao_encontrado' }

  const { error } = await svc.from('produto_avisos_estoque').upsert(
    {
      produto_id: produto.id,
      email: parsed.data.email.trim().toLowerCase(),
      notificado_em: null,
    },
    { onConflict: 'produto_id,email' },
  )
  if (error) {
    console.error('[loja.registrarAvisoEstoque]', error)
    return { ok: false, error: 'falha' }
  }
  return { ok: true }
}
