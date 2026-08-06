import { Store } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const MIRAFRANQUICIA_URL = 'https://mirafranquicia.com'

/**
 * Banner escuro "Para vendedores" no pé da home — porta de entrada pra
 * franquia (quem vende na Shoppy é franqueado da rede).
 */
export async function BannerVendedor() {
  const t = await getTranslations('home')

  return (
    <section className="mt-6 grid overflow-hidden rounded-[14px] bg-noite sm:grid-cols-[1fr_260px]">
      <div className="flex flex-col justify-center px-7 py-8 text-white sm:px-10">
        <span className="text-[11.5px] font-bold uppercase tracking-[1.4px] text-marca-claro">
          {t('vend_eyebrow')}
        </span>
        <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.7px] sm:text-[27px]">
          {t('vend_titulo')}
        </h2>
        <p className="mt-2 max-w-[460px] text-[14px] leading-relaxed text-[#94A3B8]">
          {t('vend_texto')}
        </p>
        <div className="mt-5">
          <a
            href={MIRAFRANQUICIA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[9px] bg-marca px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-marca-hover"
          >
            {t('vend_cta')}
          </a>
        </div>
      </div>
      <div className="hidden items-center justify-center border-l border-dashed border-white/20 bg-white/5 sm:flex">
        <Store className="size-16 text-white/25" strokeWidth={1.2} />
      </div>
    </section>
  )
}
