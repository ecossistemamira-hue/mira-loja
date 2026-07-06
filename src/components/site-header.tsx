import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { contarItensCarrinho } from '@/lib/cart-queries'

export async function SiteHeader() {
  const t = await getTranslations()
  const itensCarrinho = await contarItensCarrinho()

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid size-7 place-items-center rounded-lg text-sm font-extrabold text-white"
            style={{ background: '#0004ff' }}
          >
            M
          </span>
          <span className="text-[15px] font-bold tracking-tight">
            {t('site.nome')}
          </span>
        </Link>

        <form action="/buscar" className="ml-auto flex-1 max-w-sm">
          <input
            type="search"
            name="q"
            placeholder={t('nav.placeholder_busca')}
            className="h-9 w-full rounded-full border border-gray-300 bg-gray-50 px-4 text-[13px] outline-none focus:border-[#0004ff] focus:bg-white"
          />
        </form>

        <Link
          href="/carrinho"
          className="relative grid size-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label={t('nav.carrinho')}
        >
          <ShoppingCart className="size-[18px]" />
          {itensCarrinho > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-4 text-white"
              style={{ background: '#ff0a0a' }}
            >
              {itensCarrinho}
            </span>
          )}
        </Link>

        <LocaleSwitcher />
      </div>
    </header>
  )
}
