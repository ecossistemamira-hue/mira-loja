import 'server-only'

import { cookies } from 'next/headers'

export const CART_COOKIE = 'mira_cart'

/** Lê o id do carrinho no cookie (ou null se ainda não existe). */
export async function lerCarrinhoId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

/** Grava o id do carrinho no cookie (httpOnly, 30 dias). */
export async function gravarCarrinhoId(id: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
}
