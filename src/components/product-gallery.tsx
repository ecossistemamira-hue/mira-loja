'use client'

import Image from 'next/image'
import { useState } from 'react'

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

  if (urls.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-xl border border-gray-200 bg-gray-100 text-6xl">
        📦
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <Image
          src={urls[ativa]}
          alt={nome}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
        />
      </div>

      {urls.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setAtiva(i)}
              className="relative size-16 overflow-hidden rounded-lg border-2 bg-gray-100 transition-colors"
              style={{ borderColor: i === ativa ? '#a02237' : '#e5e7eb' }}
              aria-label={`${nome} ${i + 1}`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
