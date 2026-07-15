'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

/**
 * Trilho horizontal com setas flutuantes (estilo OfertasParaguai). Os cards
 * chegam como children server-rendered — este shell só cuida do scroll.
 */
export function CategoryCarousel({ children }: { children: React.ReactNode }) {
  const trilhoRef = useRef<HTMLDivElement>(null)
  const [podeEsq, setPodeEsq] = useState(false)
  const [podeDir, setPodeDir] = useState(false)

  const atualizar = () => {
    const el = trilhoRef.current
    if (!el) return
    setPodeEsq(el.scrollLeft > 4)
    setPodeDir(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    atualizar()
    const el = trilhoRef.current
    if (!el) return
    el.addEventListener('scroll', atualizar, { passive: true })
    window.addEventListener('resize', atualizar)
    return () => {
      el.removeEventListener('scroll', atualizar)
      window.removeEventListener('resize', atualizar)
    }
  }, [])

  const rolar = (direcao: 1 | -1) => {
    trilhoRef.current?.scrollBy({ left: direcao * 440, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={trilhoRef}
        className="scroll-oculto flex gap-3 overflow-x-auto pb-1"
      >
        {children}
      </div>

      {/* Setas flutuantes com fade lateral */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-fundo via-fundo/70 to-transparent pr-6 transition-opacity',
          podeEsq ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          type="button"
          onClick={() => rolar(-1)}
          aria-label="‹"
          tabIndex={podeEsq ? 0 : -1}
          className="pointer-events-auto grid size-10 place-items-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-marca hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-fundo via-fundo/70 to-transparent pl-6 transition-opacity',
          podeDir ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          type="button"
          onClick={() => rolar(1)}
          aria-label="›"
          tabIndex={podeDir ? 0 : -1}
          className="pointer-events-auto grid size-10 place-items-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-marca hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
