import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

/**
 * Padrão inspirado no ñandutí (renda paraguaia): rosetas de pontos em duas
 * coroas, repetidas como textura sutil sobre o vinho profundo do hero.
 */
const NANDUTI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='42' cy='42' r='2.6'/%3E%3Ccircle cx='58' cy='42' r='1.7'/%3E%3Ccircle cx='26' cy='42' r='1.7'/%3E%3Ccircle cx='42' cy='58' r='1.7'/%3E%3Ccircle cx='42' cy='26' r='1.7'/%3E%3Ccircle cx='53.3' cy='53.3' r='1.7'/%3E%3Ccircle cx='30.7' cy='30.7' r='1.7'/%3E%3Ccircle cx='53.3' cy='30.7' r='1.7'/%3E%3Ccircle cx='30.7' cy='53.3' r='1.7'/%3E%3Ccircle cx='70' cy='42' r='1'/%3E%3Ccircle cx='14' cy='42' r='1'/%3E%3Ccircle cx='42' cy='70' r='1'/%3E%3Ccircle cx='42' cy='14' r='1'/%3E%3Ccircle cx='61.8' cy='61.8' r='1'/%3E%3Ccircle cx='22.2' cy='22.2' r='1'/%3E%3Ccircle cx='61.8' cy='22.2' r='1'/%3E%3Ccircle cx='22.2' cy='61.8' r='1'/%3E%3C/g%3E%3C/svg%3E")`

/**
 * Hero padrão da home — assume quando a matriz ainda não cadastrou banner em
 * Vendas → Banners da loja. Um painel só, sem carrossel fake.
 */
export async function HeroFallback() {
  const t = await getTranslations('home')

  return (
    <section
      className="relative overflow-hidden rounded-2xl text-white"
      style={{
        background:
          'linear-gradient(120deg, #3d0a15 0%, #6e1526 48%, #a02237 100%)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: NANDUTI }}
      />
      {/* ₲ gigante — âncora decorativa da moeda das ofertas */}
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -right-6 -top-14 select-none text-[300px] font-black leading-none text-white/[0.07] sm:-right-2"
      >
        ₲
      </span>

      <div className="relative px-7 py-11 sm:px-10 sm:py-14">
        <span className="inline-block rounded-full border border-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
          {t('hero_badge_1')}
        </span>
        <h1 className="font-display mt-4 max-w-2xl text-3xl font-bold leading-[1.08] sm:text-5xl">
          {t('hero_titulo_1')}
        </h1>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
          {t('hero_subtitulo_1')}
        </p>
        <Link
          href="/buscar"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13.5px] font-bold text-marca-escuro transition-transform hover:-translate-y-0.5"
        >
          {t('hero_cta_1')}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
