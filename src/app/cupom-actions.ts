'use server'

import { z } from 'zod'

import { obterCarrinho } from '@/lib/cart-queries'
import { validarCupomParaCarrinho, type ErroCupom } from '@/lib/cupom'

const CodigoSchema = z.string().min(2).max(40)

export type ResultadoValidarCupom =
  | { ok: true; codigo: string; descontoTotal: number }
  | { ok: false; error: ErroCupom }

/** Prévia do cupom no checkout — valida contra o carrinho atual do cookie. */
export async function validarCupom(
  codigo: string,
): Promise<ResultadoValidarCupom> {
  const parsed = CodigoSchema.safeParse(codigo)
  if (!parsed.success) return { ok: false, error: 'nao_encontrado' }

  const { grupos, totalItens } = await obterCarrinho()
  if (totalItens === 0) return { ok: false, error: 'nao_aplicavel' }

  const r = await validarCupomParaCarrinho(parsed.data, grupos)
  if (!r.ok) return r
  return {
    ok: true,
    codigo: r.cupom.codigo,
    descontoTotal: r.cupom.descontoTotal,
  }
}
