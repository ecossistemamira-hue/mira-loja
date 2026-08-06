'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/cn'
import { useWishlist, type ItemWishlist } from '@/lib/wishlist'

type Props = {
  item: ItemWishlist
  /** 'card' = botão flutuante no card; 'pagina' = botão quadrado na página do produto. */
  variante?: 'card' | 'pagina'
  className?: string
}

export function WishlistButton({ item, variante = 'card', className }: Props) {
  const t = useTranslations('favoritos')
  const { tem, alternar, pronto } = useWishlist()
  const ativo = pronto && tem(item.id)

  const onClick = (e: React.MouseEvent) => {
    // Dentro de <Link> do card — não navegar ao favoritar.
    e.preventDefault()
    e.stopPropagation()
    alternar(item)
  }

  if (variante === 'pagina') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ativo ? t('remover') : t('adicionar')}
        aria-pressed={ativo}
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-xl border transition-all',
          ativo
            ? 'border-marca/30 bg-marca-50 text-marca'
            : 'border-gray-200 bg-white text-gray-400 hover:border-marca/30 hover:text-marca',
          className,
        )}
      >
        <Heart className="size-5" fill={ativo ? 'currentColor' : 'none'} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ativo ? t('remover') : t('adicionar')}
      aria-pressed={ativo}
      className={cn(
        // Círculo branco sempre visível, coração vermelho quando ativo (Shoppy)
        'grid size-8 place-items-center rounded-full border border-[#E2E8F0] bg-white transition-all',
        ativo ? 'text-acento' : 'text-[#94A3B8] hover:text-acento',
        className,
      )}
    >
      <Heart className="size-4" fill={ativo ? 'currentColor' : 'none'} />
    </button>
  )
}
