import { ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

import { NewsletterForm } from '@/components/newsletter-form'
import { ShoppyLogo } from '@/components/shoppy-logo'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''
const MIRAFRANQUICIA_URL = 'https://mirafranquicia.com'

export async function SiteFooter() {
  const t = await getTranslations('rodape')
  const tSite = await getTranslations('site')

  return (
    <footer className="mt-10 border-t border-gray-200/70 bg-white">
      <div className="mx-auto grid max-w-[1220px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Marca */}
        <div className="flex flex-col gap-3">
          <Link href="/" aria-label={tSite('nome')} className="self-start">
            <ShoppyLogo iconSize={24} textSize={18} />
          </Link>
          <p className="max-w-[260px] text-xs leading-relaxed text-gray-500">
            {t('tagline')}
          </p>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-700">
            <ShieldCheck className="size-[15px] text-marca" />
            {t('pago_selo')}
          </span>
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
          <LinkFooter href="/rastreio">{t('ajuda_rastreio')}</LinkFooter>
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
          <a
            href={MIRAFRANQUICIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-marca transition-colors hover:text-marca-hover"
          >
            {t('vender_link')}
          </a>
        </ColunaFooter>

        {/* Newsletter */}
        <ColunaFooter titulo={t('newsletter_titulo')}>
          <p className="text-xs leading-relaxed text-gray-500">
            {t('newsletter_dica')}
          </p>
          <NewsletterForm />
        </ColunaFooter>
      </div>

      {/* Faixa final em slate escuro — assinatura da casa */}
      <div className="bg-noite">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-white/55">
          <span>
            © {new Date().getFullYear()} {t('direitos')}
          </span>
          <span className="inline-flex items-center gap-2">
            <BandeiraPy />
            <span className="font-semibold text-white/75">{t('hecho')}</span>
          </span>
          <Link href="/" className="text-white/55 transition-colors hover:text-white">
            {tSite('nome')}
          </Link>
        </div>
      </div>
    </footer>
  )
}

/** Bandeirinha do Paraguai em CSS (3 faixas), como selo "Hecho en Paraguay". */
function BandeiraPy() {
  return (
    <span
      aria-hidden
      className="inline-flex h-3 w-[18px] flex-col overflow-hidden rounded-[2px] ring-1 ring-white/20"
    >
      <span className="flex-1 bg-[#D52B1E]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#0038A8]" />
    </span>
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
