'use client'

import { Heart } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { useWishlist } from '@/lib/wishlist'

export function WishlistHeaderLink() {
  const t = useTranslations('favoritos')
  const { itens, pronto } = useWishlist()
  const n = pronto ? itens.length : 0

  return (
    <Link
      href="/favoritos"
      className="relative grid size-9 place-items-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-marca"
      aria-label={t('titulo')}
    >
      <Heart className="size-[18px]" fill={n > 0 ? 'currentColor' : 'none'} />
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-marca px-1 text-[10px] font-bold leading-4 text-white">
          {n}
        </span>
      )}
    </Link>
  )
}
