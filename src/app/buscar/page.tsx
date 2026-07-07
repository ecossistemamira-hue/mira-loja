import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ProductCard } from '@/components/product-card'
import { cn } from '@/lib/cn'
import { listarCategoriasVitrine, listarProdutosVitrine } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false },
}

type Props = {
  searchParams: Promise<{ q?: string; categoria?: string }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q, categoria } = await searchParams
  const t = await getTranslations('busca')
  const termo = (q ?? '').trim()

  const [produtos, categorias] = await Promise.all([
    listarProdutosVitrine({
      busca: termo || undefined,
      categoria: categoria || undefined,
      limite: 60,
    }),
    listarCategoriasVitrine(),
  ])

  const titulo = categoria
    ? categoria
    : termo
      ? t('resultados', { n: produtos.length, termo })
      : t('titulo')

  const hrefCategoria = (cat?: string) => {
    const params = new URLSearchParams()
    if (termo) params.set('q', termo)
    if (cat) params.set('categoria', cat)
    const s = params.toString()
    return s ? `/buscar?${s}` : '/buscar'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-bold tracking-tight">{titulo}</h1>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Sidebar de filtros (sticky) */}
        {categorias.length > 0 && (
          <aside className="shrink-0 lg:w-56">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-[88px]">
              <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                {t('filtro_categorias')}
              </span>
              <nav className="scroll-oculto flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
                <FiltroLink href={hrefCategoria()} ativo={!categoria}>
                  {t('todas_categorias')}
                </FiltroLink>
                {categorias.map((cat) => (
                  <FiltroLink
                    key={cat}
                    href={hrefCategoria(cat)}
                    ativo={categoria === cat}
                  >
                    {cat}
                  </FiltroLink>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Resultados */}
        <div className="min-w-0 flex-1">
          {produtos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <div className="text-4xl">🔍</div>
              <p className="mx-auto mt-3 max-w-sm text-[13px] text-gray-500">
                {t('sem_resultados')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {produtos.map((p) => (
                <ProductCard key={p.id} produto={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FiltroLink({
  href,
  ativo,
  children,
}: {
  href: string
  ativo: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
        ativo
          ? 'bg-marca/10 font-semibold text-marca'
          : 'text-gray-600 hover:bg-gray-50 hover:text-marca',
      )}
    >
      {children}
    </Link>
  )
}
