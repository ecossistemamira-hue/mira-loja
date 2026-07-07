'use client'

import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Store } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ComponentType } from 'react'

import { cn } from '@/lib/cn'

export type SlideHero = {
  badge: string
  titulo: string
  subtitulo: string
  cta: string
  href: string
}

// Gradientes diagonais herdados do OfertasParaguai (vinho / azul-noite / verde).
const ESTILOS = [
  'linear-gradient(135deg, #7a1226 0%, #8b1a2b 55%, #4a0c1a 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #27496d 55%, #0f2438 100%)',
  'linear-gradient(135deg, #1a5c3a 0%, #217a4c 55%, #0d3a23 100%)',
] as const

const ICONES: ComponentType<{ className?: string }>[] = [
  ShoppingBag,
  Store,
  Sparkles,
]

export function HeroCarousel({ slides }: { slides: SlideHero[] }) {
  const [atual, setAtual] = useState(0)
  const total = slides.length

  const avancar = useCallback(
    () => setAtual((a) => (a + 1) % total),
    [total],
  )
  const voltar = () => setAtual((a) => (a - 1 + total) % total)

  // Auto-play 5s, pausa não é necessária — troca é suave e reversível.
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(avancar, 5000)
    return () => clearInterval(timer)
  }, [avancar, total])

  if (total === 0) return null
  const slide = slides[atual]
  const Icone = ICONES[atual % ICONES.length]

  return (
    <section
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: ESTILOS[atual % ESTILOS.length], minHeight: 220 }}
    >
      {/* Círculos decorativos translúcidos */}
      <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between gap-6 px-7 py-9 sm:px-10">
        <div className="max-w-xl">
          <span className="inline-block rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
            {slide.badge}
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
            {slide.titulo}
          </h1>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/65">
            {slide.subtitulo}
          </p>
          <Link
            href={slide.href}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-bold text-gray-900 transition-transform hover:-translate-y-0.5"
          >
            {slide.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="hidden shrink-0 md:block">
          <div className="grid size-32 place-items-center rounded-3xl bg-white/10 backdrop-blur-sm">
            <Icone className="size-14 text-white/80" />
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={voltar}
            aria-label="‹"
            className="absolute left-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={avancar}
            aria-label="›"
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={String(i + 1)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === atual ? 'w-6 bg-white' : 'w-1.5 bg-white/40',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
