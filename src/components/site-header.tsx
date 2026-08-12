import { Menu } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

import { HeaderContaCarrinho } from '@/components/header-conta-carrinho'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { SearchBox } from '@/components/search-box'
import { ShoppyLogo } from '@/components/shoppy-logo'
import { WishlistHeaderLink } from '@/components/wishlist-header-link'
import { listarCategoriasComContagem } from '@/lib/queries'

const MIRAFRANQUICIA_URL = 'https://mirafranquicia.com'

export async function SiteHeader() {
  const t = await getTranslations()
  // Só dado PÚBLICO no server (e cacheado); carrinho/sessão viraram ilha
  // client (HeaderContaCarrinho) — zero cookie/Auth no caminho do render.
  const categorias = await listarCategoriasComContagem()
  const categoriasBarra = categorias.slice(0, 8)

  return (
    <>
      {/* Barra de anúncio — rola junto com a página; só o header é sticky */}
      <div className="bg-noite text-[12.5px] text-[#E2E8F0]">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-4 py-2 text-center">
          <span className="font-semibold text-white">
            {t('home.anuncio_destaque')}
          </span>
          <span aria-hidden className="hidden text-[#475569] sm:inline">
            |
          </span>
          <span className="hidden sm:inline">{t('home.anuncio_texto')}</span>
          <Link
            href="/buscar?ordem=menor_preco"
            className="ml-1.5 font-semibold text-marca-claro hover:underline"
          >
            {t('home.anuncio_link')}
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
        {/* No mobile a busca desce pra própria linha (a 390px ela ficava com
            ~70px espremida entre logo e ícones); do sm pra cima, tudo em uma. */}
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:flex-nowrap sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label={t('site.nome')}>
            <ShoppyLogo />
          </Link>

          <SearchBox className="order-last w-full min-w-0 sm:order-none sm:mx-auto sm:w-auto sm:max-w-2xl sm:flex-1" />

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
            <WishlistHeaderLink />

            <HeaderContaCarrinho />

            <LocaleSwitcher />
          </div>
        </div>

        {/* Linha 2 — nav de categorias, como nos marketplaces */}
        <nav
          aria-label={t('nav.categorias')}
          className="border-t border-[#F1F5F9] bg-white"
        >
          <div className="scroll-oculto mx-auto flex max-w-[1220px] items-center overflow-x-auto px-4">
            <Link
              href="/categorias"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap py-2.5 pr-3 text-[13.5px] font-semibold text-noite transition-colors hover:text-marca"
            >
              <Menu className="size-[17px]" />
              {t('nav.todas_categorias')}
            </Link>
            {categoriasBarra.length > 0 && (
              <span aria-hidden className="mx-2 h-4 w-px shrink-0 bg-[#E2E8F0]" />
            )}
            {categoriasBarra.map((cat) => (
              <Link
                key={cat.categoria}
                href={`/buscar?categoria=${encodeURIComponent(cat.categoria)}`}
                className="shrink-0 whitespace-nowrap px-2.5 py-2.5 text-[13.5px] font-medium text-[#475569] transition-colors hover:text-marca"
              >
                {cat.categoria}
              </Link>
            ))}
            <a
              href={MIRAFRANQUICIA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 whitespace-nowrap py-2.5 pl-3 text-[13.5px] font-semibold text-marca hover:text-marca-hover"
            >
              {t('nav.vender')}
            </a>
          </div>
        </nav>
      </header>
    </>
  )
}
