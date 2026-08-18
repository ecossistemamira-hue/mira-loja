import { ScrollText } from 'lucide-react'
import type { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

// A loja não usa plugin de tipografia; os elementos do texto legal (h2/p/ul…)
// são estilizados via seletores de filho neste wrapper — as páginas escrevem
// HTML semântico puro.
const ESTILO_PROSA = [
  '[&_h2]:mt-8 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-gray-900',
  '[&_h3]:mt-5 [&_h3]:text-[14.5px] [&_h3]:font-bold [&_h3]:text-gray-900',
  '[&_p]:mt-3 [&_p]:text-[13.5px] [&_p]:leading-relaxed [&_p]:text-gray-600',
  '[&_ul]:mt-3 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5',
  '[&_li]:text-[13.5px] [&_li]:leading-relaxed [&_li]:text-gray-600',
  '[&_strong]:font-semibold [&_strong]:text-gray-800',
  '[&_a]:font-semibold [&_a]:text-marca hover:[&_a]:text-marca-hover',
].join(' ')

export function LegalArticle({
  titulo,
  atualizado,
  children,
}: {
  titulo: string
  atualizado: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <div className="mb-2">
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-marca/10 text-marca">
          <ScrollText className="size-6" />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{atualizado}</p>
      </div>
      <article className={ESTILO_PROSA}>{children}</article>
    </div>
  )
}

/** Rodapé com links cruzados entre as três páginas legais. */
export function LegalVerTambem({
  rotulo,
  links,
}: {
  rotulo: string
  links: { href: string; texto: string }[]
}) {
  return (
    <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
        {rotulo}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[13px] font-semibold text-marca transition-colors hover:text-marca-hover"
          >
            {l.texto}
          </Link>
        ))}
      </div>
    </div>
  )
}
