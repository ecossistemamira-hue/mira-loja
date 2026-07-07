import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { SearchBox } from '@/components/search-box'
import { WishlistHeaderLink } from '@/components/wishlist-header-link'
import { contarItensCarrinho } from '@/lib/cart-queries'

export async function SiteHeader() {
  const t = await getTranslations()
  const itensCarrinho = await contarItensCarrinho()

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-marca font-display text-[16px] font-extrabold text-white shadow-sm shadow-marca/30">
            M
          </span>
          <span className="hidden font-display text-[16px] font-bold tracking-tight sm:block">
            {t('site.nome')}
          </span>
        </Link>

        <SearchBox className="min-w-0 flex-1 sm:mx-auto sm:max-w-xl" />

        <div className="flex shrink-0 items-center gap-1.5">
          <WishlistHeaderLink />

          <Link
            href="/carrinho"
            className="relative grid size-9 place-items-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-marca"
            aria-label={t('nav.carrinho')}
          >
            <ShoppingCart className="size-[18px]" />
            {itensCarrinho > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-marca px-1 text-[10px] font-bold leading-4 text-white">
                {itensCarrinho}
              </span>
            )}
          </Link>

          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}
