'use client'

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import type { BannerLoja } from '@/lib/queries'

/**
 * Hero da home. Com banners cadastrados (gestor → Vendas → Banners da loja),
 * vira um carrossel de IMAGENS com crossfade; texto e CTA são opcionais e
 * ganham véu de contraste quando presentes. Sem banners, o server component
 * `HeroFallback` assume — este componente nunca inventa slide fake.
 */
export function HeroBanners({ banners }: { banners: BannerLoja[] }) {
  const [atual, setAtual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const reduzMotion = useRef(false)
  const total = banners.length

  const avancar = useCallback(
    () => setAtual((a) => (a + 1) % total),
    [total],
  )

  useEffect(() => {
    reduzMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  }, [])

  useEffect(() => {
    if (total <= 1 || pausado || reduzMotion.current) return
    const timer = setInterval(avancar, 6000)
    return () => clearInterval(timer)
  }, [avancar, total, pausado])

  if (total === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-2xl bg-marca-escuro"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Slides empilhados — crossfade por opacidade */}
      <div className="relative h-[230px] sm:h-[300px] lg:h-[380px]">
        {banners.map((b, i) => {
          const conteudo = (
            <>
              <Image
                src={b.imagem_url!}
                alt={b.titulo}
                fill
                priority={i === 0}
                sizes="(max-width: 1400px) 100vw, 1400px"
                className="object-cover"
              />
              {(b.subtitulo || b.link_texto) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
              )}
              {(b.subtitulo || b.link_texto) && (
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-lg px-7 sm:px-10">
                    <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
                      {b.titulo}
                    </h2>
                    {b.subtitulo && (
                      <p className="mt-2 hidden max-w-md text-[14px] leading-relaxed text-white/80 sm:block">
                        {b.subtitulo}
                      </p>
                    )}
                    {b.link_texto && b.link_url && (
                      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-marca-escuro">
                        {b.link_texto}
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )
          return (
            <div
              key={b.id}
              aria-hidden={i !== atual}
              className={cn(
                'absolute inset-0 transition-opacity duration-700',
                i === atual ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              {b.link_url ? (
                <Link
                  href={b.link_url}
                  className="block h-full w-full"
                  tabIndex={i === atual ? 0 : -1}
                  aria-label={b.titulo}
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="h-full w-full">{conteudo}</div>
              )}
            </div>
          )
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => setAtual((a) => (a - 1 + total) % total)}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={avancar}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setAtual(i)}
                aria-label={b.titulo}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === atual ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
