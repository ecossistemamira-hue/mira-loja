import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { NewsletterForm } from '@/components/newsletter-form'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

export async function SiteFooter() {
  const t = await getTranslations('rodape')
  const tSite = await getTranslations('site')

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Marca */}
        <div className="flex flex-col gap-3">
          <Image
            src="/logo-horizontal.png"
            alt={tSite('nome')}
            width={486}
            height={211}
            className="h-12 w-auto self-start"
          />
          <p className="max-w-[260px] text-xs leading-relaxed text-gray-500">
            {t('tagline')}
          </p>
        </div>

        {/* Navegação */}
        <ColunaFooter titulo={t('nav_titulo')}>
          <LinkFooter href="/">{t('nav_inicio')}</LinkFooter>
          <LinkFooter href="/categorias">{t('nav_categorias')}</LinkFooter>
          <LinkFooter href="/buscar">{t('nav_buscar')}</LinkFooter>
          <LinkFooter href="/favoritos">{t('nav_favoritos')}</LinkFooter>
          <LinkFooter href="/carrinho">{t('nav_carrinho')}</LinkFooter>
        </ColunaFooter>

        {/* Ajuda */}
        <ColunaFooter titulo={t('ajuda_titulo')}>
          <LinkFooter href="/faq">{t('ajuda_faq')}</LinkFooter>
          {WHATSAPP && (
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 transition-colors hover:text-marca"
            >
              {t('ajuda_whatsapp')}
            </a>
          )}
          <span className="text-xs text-gray-500">{t('ajuda_retirada')}</span>
        </ColunaFooter>

        {/* Newsletter */}
        <ColunaFooter titulo={t('newsletter_titulo')}>
          <p className="text-xs leading-relaxed text-gray-500">
            {t('newsletter_dica')}
          </p>
          <NewsletterForm />
        </ColunaFooter>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-gray-400">
          <span>
            © {new Date().getFullYear()} {t('direitos')}
          </span>
          <Link href="/" className="transition-colors hover:text-marca">
            {tSite('nome')}
          </Link>
        </div>
      </div>
    </footer>
  )
}

function ColunaFooter({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
        {titulo}
      </span>
      {children}
    </div>
  )
}

function LinkFooter({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-xs text-gray-500 transition-colors hover:text-marca"
    >
      {children}
    </Link>
  )
}
