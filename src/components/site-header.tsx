import { LayoutGrid, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/locale-switcher'
import { SearchBox } from '@/components/search-box'
import { UserMenu } from '@/components/user-menu'
import { WishlistHeaderLink } from '@/components/wishlist-header-link'
import { contarItensCarrinho } from '@/lib/cart-queries'
import { listarCategoriasComContagem } from '@/lib/queries'
import { obterUsuarioLoja } from '@/lib/supabase-auth'

export async function SiteHeader() {
  const t = await getTranslations()
  const [itensCarrinho, usuario, categorias] = await Promise.all([
    contarItensCarrinho(),
    obterUsuarioLoja(),
    listarCategoriasComContagem(),
  ])
  const categoriasBarra = categorias.slice(0, 8)
  const usuarioNome = usuario
    ? ((usuario.user_metadata?.nome_completo as string | undefined) ??
      (usuario.user_metadata?.full_name as string | undefined) ??
      usuario.email ??
      null)
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label={t('site.nome')}>
          {/* Logo Ofertas Paraguai (486x211) */}
          <Image
            src="/logo-horizontal.png"
            alt={t('site.nome')}
            width={486}
            height={211}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <Link
          href="/categorias"
          className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-marca/5 hover:text-marca md:inline-flex"
        >
          <LayoutGrid className="size-4" />
          {t('nav.categorias')}
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

          <UserMenu usuarioNome={usuarioNome} />

          <LocaleSwitcher />
        </div>
      </div>

      {/* Barra de categorias — fica no header sticky, como nos marketplaces */}
      {categoriasBarra.length >= 2 && (
        <nav
          aria-label={t('nav.categorias')}
          className="border-t border-gray-100 bg-white"
        >
          <div className="scroll-oculto mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 sm:px-6">
            {categoriasBarra.map((cat) => (
              <Link
                key={cat.categoria}
                href={`/buscar?categoria=${encodeURIComponent(cat.categoria)}`}
                className="shrink-0 whitespace-nowrap px-2.5 py-2 text-[12.5px] font-medium text-gray-600 transition-colors hover:text-marca"
              >
                {cat.categoria}
              </Link>
            ))}
            <Link
              href="/categorias"
              className="ml-auto shrink-0 whitespace-nowrap px-2.5 py-2 text-[12.5px] font-semibold text-marca hover:underline"
            >
              {t('nav.ver_todas_categorias')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
