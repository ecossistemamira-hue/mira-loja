import Image from 'next/image'
import { Link } from '@/i18n/navigation'

import { cn } from '@/lib/cn'
import type { BannerLoja } from '@/lib/queries'

/**
 * Faixa promocional no meio da home (posição `loja_faixa` do CMS). Até dois
 * banners lado a lado no desktop; some por completo quando não há nenhum.
 */
export function FaixaBanners({ banners }: { banners: BannerLoja[] }) {
  const exibidos = banners.slice(0, 2)
  if (exibidos.length === 0) return null

  return (
    <section
      className={cn(
        'mt-6 grid gap-4',
        exibidos.length === 2 && 'sm:grid-cols-2',
      )}
    >
      {exibidos.map((b) => {
        const inner = (
          <>
            <Image
              src={b.imagem_url!}
              alt={b.titulo}
              fill
              sizes="(max-width: 640px) 100vw, 700px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {b.subtitulo && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-4 pt-10">
                <p className="font-display text-[15px] font-bold text-white">
                  {b.titulo}
                </p>
                <p className="text-[12px] text-white/80">{b.subtitulo}</p>
              </div>
            )}
          </>
        )
        const classes =
          'group relative block h-36 overflow-hidden rounded-2xl bg-marca-escuro sm:h-44'
        return b.link_url ? (
          <Link key={b.id} href={b.link_url} aria-label={b.titulo} className={classes}>
            {inner}
          </Link>
        ) : (
          <div key={b.id} className={classes}>
            {inner}
          </div>
        )
      })}
    </section>
  )
}
