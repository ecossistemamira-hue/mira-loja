'use server'

import { z } from 'zod'

import { obterCarrinho } from '@/lib/cart-queries'
import { validarCupomParaCarrinho, type ErroCupom } from '@/lib/cupom'

const CodigoSchema = z.string().min(2).max(40)
const EmailSchema = z.string().email().optional().or(z.literal(''))

export type ResultadoValidarCupom =
  | { ok: true; codigo: string; descontoTotal: number }
  | { ok: false; error: ErroCupom; faltam?: number }

/**
 * Prévia do cupom no checkout — valida contra o carrinho atual do cookie.
 * O e-mail é opcional e serve só pra antecipar o limite por pessoa (0104);
 * a checagem que vale é a do `consumir_cupom` ao fechar o pedido.
 */
export async function validarCupom(
  codigo: string,
  email?: string,
): Promise<ResultadoValidarCupom> {
  const parsed = CodigoSchema.safeParse(codigo)
  if (!parsed.success) return { ok: false, error: 'nao_encontrado' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'nao_aplicavel' }

  const emailOk = EmailSchema.safeParse(email ?? '')
  const r = await validarCupomParaCarrinho(
    parsed.data,
    grupos,
    emailOk.success ? emailOk.data : undefined,
  )
  if (!r.ok) return r
  return {
    ok: true,
    codigo: r.cupom.codigo,
    descontoTotal: r.cupom.descontoTotal,
  }
}
