'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useSyncExternalStore } from 'react'

const CHAVE = 'mira_vistos'
const MAX = 12

export type ProdutoVisto = {
  id: string
  slug: string | null
  nome: string
  imagemUrl: string | null
  precoTexto: string | null
}

function lerVistos(): ProdutoVisto[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as ProdutoVisto[]
  } catch {
    return []
  }
}

// Snapshot cacheado pro useSyncExternalStore (precisa ser referência estável
// enquanto o localStorage não muda).
const cache: { raw: string | null; lista: ProdutoVisto[] } = {
  raw: null,
  lista: [],
}
function snapshotVistos(): ProdutoVisto[] {
  const raw = localStorage.getItem(CHAVE)
  if (raw !== cache.raw) {
    cache.raw = raw
    cache.lista = lerVistos()
  }
  return cache.lista
}
function assinarStorage(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}
// Referência ESTÁVEL pro snapshot do servidor — `() => []` inline cria array
// novo a cada chamada e o React acusa "getServerSnapshot should be cached".
const VAZIO_SSR: ProdutoVisto[] = []
const snapshotServidor = () => VAZIO_SSR

/** Registra a visita ao produto (montar na PDP; não renderiza nada). */
export function RegistrarVisita({ produto }: { produto: ProdutoVisto }) {
  useEffect(() => {
    const lista = lerVistos().filter((p) => p.id !== produto.id)
    lista.unshift(produto)
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, MAX)))
    } catch {
      // localStorage cheio/indisponível: métrica de conveniência, ignora.
    }
  }, [produto])
  return null
}

/** Carrossel "vistos recentemente" (home). Some quando não há histórico. */
export function VistosRecentemente({ excluirId }: { excluirId?: string }) {
  const t = useTranslations('home')
  const todos = useSyncExternalStore(
    assinarStorage,
    snapshotVistos,
    snapshotServidor,
  )
  const vistos = todos.filter((p) => p.id !== excluirId)

  if (vistos.length === 0) return null

  return (
    <section className="mt-9">
      <h2 className="mb-3.5 flex items-baseline gap-2 font-display text-[19px] font-bold text-gray-900">
        {t('vistos_recentemente')}
        <span aria-hidden className="inline-block size-1.5 rounded-full bg-marca" />
      </h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {vistos.map((p) => (
          <Link
            key={p.id}
            href={`/p/${p.slug ?? p.id}`}
            className="group w-40 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-gray-50 to-white p-3">
              {p.imagemUrl ? (
                <div className="relative h-full w-full">
                  <Image
                    src={p.imagemUrl}
                    alt={p.nome}
                    fill
                    sizes="160px"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>
            <div className="px-3 pb-3 pt-1.5">
              <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-gray-800">
                {p.nome}
              </p>
              {p.precoTexto && (
                <p className="mt-1 font-display text-[13.5px] font-black text-marca">
                  {p.precoTexto}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
