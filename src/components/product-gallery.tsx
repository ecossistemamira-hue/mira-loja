'use client'

import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import type { ProdutoFotoVitrine } from '@/lib/types'

type Props = {
  nome: string
  fotos: ProdutoFotoVitrine[]
  fallbackUrl: string | null
}

export function ProductGallery({ nome, fotos, fallbackUrl }: Props) {
  const urls =
    fotos.length > 0
      ? fotos.map((f) => f.url)
      : fallbackUrl
        ? [fallbackUrl]
        : []
  const [ativa, setAtiva] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  // Zoom do lightbox: guarda A FOTO em que o zoom foi ativado — trocar de foto
  // desativa sozinho (sem setState em effect, que o lint do React 19 barra).
  const [zoomEm, setZoomEm] = useState<{ i: number; origem: string } | null>(
    null,
  )
  const toqueX = useRef<number | null>(null)

  const zoomAtivo = lightbox && zoomEm?.i === ativa

  const fecharLightbox = () => {
    setLightbox(false)
    setZoomEm(null)
  }

  const origemDoEvento = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    return `${x.toFixed(1)}% ${y.toFixed(1)}%`
  }

  const total = urls.length
  const anterior = useCallback(
    () => setAtiva((a) => (a - 1 + total) % total),
    [total],
  )
  const proxima = useCallback(() => setAtiva((a) => (a + 1) % total), [total])

  // Teclado no lightbox: ← → navegam, Esc fecha. Trava o scroll do body.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightbox(false)
        setZoomEm(null)
      }
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'ArrowRight') proxima()
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [lightbox, anterior, proxima])

  if (total === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-xl border border-gray-200 bg-gray-100 text-6xl">
        📦
      </div>
    )
  }

  // Swipe no mobile (imagem principal e lightbox). Com zoom ativo o swipe
  // não troca de foto (o gesto vira "explorar a imagem").
  const onTouchStart = (e: React.TouchEvent) => {
    toqueX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (toqueX.current == null || total < 2 || zoomAtivo) return
    const delta = e.changedTouches[0].clientX - toqueX.current
    if (Math.abs(delta) > 40) (delta > 0 ? anterior : proxima)()
    toqueX.current = null
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Imagem principal */}
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 z-[1] cursor-zoom-in"
          aria-label={`${nome} — ampliar foto`}
        />
        <Image
          key={urls[ativa]}
          src={urls[ativa]}
          alt={nome}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Setas */}
        {total > 1 && (
          <>
            <SetaGaleria lado="esq" onClick={anterior} rotulo="Foto anterior" />
            <SetaGaleria lado="dir" onClick={proxima} rotulo="Próxima foto" />
          </>
        )}

        {/* Ampliar + contador */}
        <span className="pointer-events-none absolute right-3 top-3 z-[2] grid size-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Expand className="size-4" />
        </span>
        {total > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-[2] rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur-sm">
            {ativa + 1} / {total}
          </span>
        )}
      </div>

      {/* Miniaturas */}
      {total > 1 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setAtiva(i)}
              className={cn(
                'relative size-16 overflow-hidden rounded-lg border-2 bg-gray-100 transition-all',
                i === ativa
                  ? 'border-marca ring-2 ring-marca/20'
                  : 'border-gray-200 opacity-70 hover:opacity-100',
              )}
              aria-label={`${nome} ${i + 1}`}
              aria-current={i === ativa}
            >
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={nome}
          onClick={fecharLightbox}
        >
          {/* Topo: contador + fechar */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-[13px] font-semibold text-white/70">
              {total > 1 ? `${ativa + 1} / ${total}` : ''}
            </span>
            <button
              type="button"
              onClick={fecharLightbox}
              className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Imagem — clique dá zoom no ponto; com zoom, o mouse "passeia" */}
          <div
            className="relative mx-auto min-h-0 w-full max-w-5xl flex-1 px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className={cn(
                // absolute (não h-full): o pai é flex-1 e o 100% colapsaria.
                'absolute inset-x-4 top-0 bottom-4 overflow-hidden',
                zoomAtivo ? 'cursor-zoom-out' : 'cursor-zoom-in',
              )}
              onClick={(e) =>
                setZoomEm(
                  zoomAtivo ? null : { i: ativa, origem: origemDoEvento(e) },
                )
              }
              onMouseMove={(e) => {
                if (zoomAtivo)
                  setZoomEm({ i: ativa, origem: origemDoEvento(e) })
              }}
            >
              <Image
                key={urls[ativa]}
                src={urls[ativa]}
                alt={nome}
                fill
                sizes="100vw"
                className={cn(
                  // transition-transform só anima o scale — transform-origin
                  // (o "passeio" do mouse) muda instantâneo, como deve.
                  'object-contain transition-transform duration-200',
                  zoomAtivo && 'scale-[2.2]',
                )}
                style={{ transformOrigin: zoomEm?.origem ?? '50% 50%' }}
              />
            </div>
            {total > 1 && (
              <>
                <SetaGaleria lado="esq" onClick={anterior} rotulo="Foto anterior" clara />
                <SetaGaleria lado="dir" onClick={proxima} rotulo="Próxima foto" clara />
              </>
            )}
          </div>

          {/* Miniaturas do lightbox */}
          {total > 1 && (
            <div
              className="flex justify-center gap-2 px-4 pb-5"
              onClick={(e) => e.stopPropagation()}
            >
              {urls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAtiva(i)}
                  className={cn(
                    'relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    i === ativa
                      ? 'border-white'
                      : 'border-transparent opacity-50 hover:opacity-90',
                  )}
                  aria-label={`${nome} ${i + 1}`}
                >
                  <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SetaGaleria({
  lado,
  onClick,
  rotulo,
  clara,
}: {
  lado: 'esq' | 'dir'
  onClick: () => void
  rotulo: string
  clara?: boolean
}) {
  const Icone = lado === 'esq' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'absolute top-1/2 z-[2] grid size-10 -translate-y-1/2 place-items-center rounded-full shadow-md transition-all',
        lado === 'esq' ? 'left-3' : 'right-3',
        clara
          ? 'bg-white/15 text-white hover:bg-white/30'
          : 'bg-white/90 text-gray-800 opacity-0 backdrop-blur-sm hover:bg-white group-hover:opacity-100',
      )}
      aria-label={rotulo}
    >
      <Icone className="size-5" />
    </button>
  )
}
