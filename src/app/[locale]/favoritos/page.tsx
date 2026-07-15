'use client'

import { Heart, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { useWishlist } from '@/lib/wishlist'

/**
 * Favoritos são 100% client-side (localStorage) — a página renderiza a partir
 * do snapshot salvo, sem fetch. Clicar no card leva pra página do produto.
 */
export default function FavoritosPage() {
  const t = useTranslations('favoritos')
  const { itens, pronto, remover } = useWishlist()

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <h1 className="font-display mb-5 flex items-center gap-2 text-xl font-bold tracking-tight">
        <Heart className="size-5 text-marca" fill="currentColor" />
        {t('titulo')}
      </h1>

      {!pronto ? null : itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl">🤍</div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            {t('vazio_titulo')}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">
            {t('vazio_dica')}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-marca px-5 text-[13px] font-bold text-white transition-colors hover:bg-marca-hover"
          >
            {t('explorar')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {itens.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg"
            >
              <Link
                href={`/p/${item.slug ?? item.id}`}
                className="flex flex-1 flex-col"
              >
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6 pb-2 pt-5">
                  {item.imagemUrl ? (
                    <div className="relative h-28 w-full">
                      <Image
                        src={item.imagemUrl}
                        alt={item.nome}
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-contain transition-transform duration-300 group-hover:scale-[1.07]"
                      />
                    </div>
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 border-t border-gray-50 px-4 pb-4 pt-3">
                  {item.categoria && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                      {item.categoria}
                    </span>
                  )}
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-800">
                    {item.nome}
                  </h3>
                  {item.precoTexto && (
                    <span className="mt-auto pt-1.5 font-display text-[17px] font-black text-marca">
                      {item.precoTexto}
                    </span>
                  )}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => remover(item.id)}
                aria-label={t('remover')}
                className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-lg bg-white/90 text-gray-400 shadow-sm backdrop-blur transition-colors hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
