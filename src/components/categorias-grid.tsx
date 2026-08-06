import { Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

import { iconeDaCategoria } from '@/lib/categoria-icone'

/**
 * "Explorá por categoría" — card branco com grid de quadradinhos, como no
 * design Shoppy. Fecha com o item "+ Ver tudo" pra página de categorias.
 */
export async function CategoriasGrid({ categorias }: { categorias: string[] }) {
  const t = await getTranslations()
  if (categorias.length === 0) return null

  return (
    <section className="mt-6 rounded-[14px] border border-[#E2E8F0] bg-white p-5 sm:p-[22px]">
      <h2 className="mb-4 text-[19px] font-bold tracking-[-0.3px] text-noite">
        {t('home.explorar_categorias')}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
        {categorias.slice(0, 11).map((cat) => {
          const Icone = iconeDaCategoria(cat)
          return (
            <Link
              key={cat}
              href={`/buscar?categoria=${encodeURIComponent(cat)}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-transparent px-2 py-3.5 text-center text-[#334155] transition-colors hover:border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-marca"
            >
              <span className="grid size-[54px] place-items-center rounded-[14px] bg-[#F1F5F9] text-noite transition-colors group-hover:bg-marca-50 group-hover:text-marca">
                <Icone className="size-6" strokeWidth={1.8} />
              </span>
              <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight">
                {cat}
              </span>
            </Link>
          )
        })}
        <Link
          href="/categorias"
          className="group flex flex-col items-center gap-2 rounded-xl border border-transparent px-2 py-3.5 text-center text-[#334155] transition-colors hover:border-[#E2E8F0] hover:bg-[#F8FAFC] hover:text-marca"
        >
          <span className="grid size-[54px] place-items-center rounded-[14px] bg-[#F1F5F9] text-noite transition-colors group-hover:bg-marca-50 group-hover:text-marca">
            <Plus className="size-6" strokeWidth={1.8} />
          </span>
          <span className="text-[12.5px] font-semibold leading-tight">
            {t('nav.ver_todas_categorias')}
          </span>
        </Link>
      </div>
    </section>
  )
}
