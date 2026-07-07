'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react'

/**
 * Wishlist client-side (localStorage, sem login) — padrão herdado do
 * OfertasParaguai. Guarda um snapshot leve do produto pra página /favoritos
 * renderizar sem precisar de fetch.
 *
 * Implementada como store externa + useSyncExternalStore: o servidor enxerga
 * a lista vazia e o cliente re-renderiza com o localStorage já hidratado.
 */
export type ItemWishlist = {
  id: string
  slug: string | null
  nome: string
  imagemUrl: string | null
  precoTexto: string | null
  categoria: string | null
}

const STORAGE_KEY = 'mira_wishlist_v1'
const VAZIO: ItemWishlist[] = []

let cache: ItemWishlist[] | null = null
const listeners = new Set<() => void>()

function lerStorage(): ItemWishlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return VAZIO
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return VAZIO
    return parsed.filter(
      (i): i is ItemWishlist =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as ItemWishlist).id === 'string',
    )
  } catch {
    return VAZIO
  }
}

function getSnapshot(): ItemWishlist[] {
  if (cache === null) cache = lerStorage()
  return cache
}

function getServerSnapshot(): ItemWishlist[] {
  return VAZIO
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function gravar(novo: ItemWishlist[]) {
  cache = novo
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novo))
  } catch {
    // storage cheio/bloqueado — wishlist é best-effort
  }
  listeners.forEach((l) => l())
}

type WishlistContexto = {
  itens: ItemWishlist[]
  /** false só durante SSR/hidratação — evita mismatch. */
  pronto: boolean
  tem: (id: string) => boolean
  alternar: (item: ItemWishlist) => void
  remover: (id: string) => void
}

const Contexto = createContext<WishlistContexto | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const itens = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // Após a hidratação o snapshot vem do cliente — cache preenchido = pronto.
  const pronto = itens !== VAZIO || cache !== null

  const tem = useCallback(
    (id: string) => itens.some((i) => i.id === id),
    [itens],
  )

  const alternar = useCallback(
    (item: ItemWishlist) => {
      gravar(
        itens.some((i) => i.id === item.id)
          ? itens.filter((i) => i.id !== item.id)
          : [item, ...itens],
      )
    },
    [itens],
  )

  const remover = useCallback(
    (id: string) => {
      gravar(itens.filter((i) => i.id !== id))
    },
    [itens],
  )

  const valor = useMemo(
    () => ({ itens, pronto, tem, alternar, remover }),
    [itens, pronto, tem, alternar, remover],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useWishlist(): WishlistContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useWishlist precisa do WishlistProvider')
  return ctx
}
