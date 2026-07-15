'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import type { SugestaoBusca } from '@/app/api/busca/route'

/**
 * Busca central do header com autocomplete (debounce 300ms) — padrão do
 * OfertasParaguai: dropdown com foto + nome + preço.
 */
export function SearchBox({ className }: { className?: string }) {
  const t = useTranslations('nav')
  const router = useRouter()
  const [termo, setTermo] = useState('')
  const [sugestoes, setSugestoes] = useState<SugestaoBusca[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounce da consulta ao /api/busca (setState só dentro do timer)
  useEffect(() => {
    const q = termo.trim()
    const timer = setTimeout(
      async () => {
        if (q.length < 2) {
          setSugestoes([])
          setCarregando(false)
          return
        }
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        try {
          const res = await fetch(`/api/busca?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          })
          if (!res.ok) return
          const json = (await res.json()) as { sugestoes: SugestaoBusca[] }
          setSugestoes(json.sugestoes)
          setAberto(true)
        } catch {
          // abortado ou offline — silencioso
        } finally {
          setCarregando(false)
        }
      },
      q.length < 2 ? 0 : 300,
    )
    return () => clearTimeout(timer)
  }, [termo])

  // Fecha ao clicar fora
  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  const submeter = (e: React.FormEvent) => {
    e.preventDefault()
    const q = termo.trim()
    if (!q) return
    setAberto(false)
    router.push(`/buscar?q=${encodeURIComponent(q)}`)
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <form onSubmit={submeter} className="relative">
        <input
          type="search"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value)
            if (e.target.value.trim().length >= 2) setCarregando(true)
          }}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder={t('placeholder_busca')}
          className="h-10 w-full rounded-full border border-gray-200 bg-gray-50/80 pl-4.5 pr-11 text-[13px] outline-none transition-colors focus:border-marca/50 focus:bg-white"
          aria-label={t('buscar')}
        />
        <button
          type="submit"
          aria-label={t('buscar')}
          className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-marca text-white transition-colors hover:bg-marca-hover"
        >
          <Search className="size-4" />
        </button>
      </form>

      {aberto && (sugestoes.length > 0 || carregando) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          {carregando && sugestoes.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400">…</div>
          ) : (
            <ul>
              {sugestoes.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/p/${s.slug ?? s.id}`}
                    onClick={() => setAberto(false)}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {s.imagemUrl ? (
                        <Image
                          src={s.imagemUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <span className="text-base">📦</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-gray-800">
                        {s.nome}
                      </span>
                      {s.categoria && (
                        <span className="block text-[10px] uppercase tracking-widest text-gray-400">
                          {s.categoria}
                        </span>
                      )}
                    </span>
                    {s.precoTexto && (
                      <span className="shrink-0 text-[13px] font-black text-marca">
                        {s.precoTexto}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              <li className="border-t border-gray-50">
                <button
                  type="button"
                  onClick={submeter}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-marca hover:bg-marca-50"
                >
                  {t('ver_todos_resultados', { termo: termo.trim() })}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
