import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ProductCard } from '@/components/product-card'
import { listarMediasAvaliacoes } from '@/lib/avaliacoes'
import { cn } from '@/lib/cn'
import { precoVenda } from '@/lib/format'
import {
  listarCategoriasVitrine,
  listarProdutosVitrine,
  mapaFranquiasPublicas,
} from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false },
}

const ORDENS = ['recentes', 'menor_preco', 'maior_preco'] as const
type Ordem = (typeof ORDENS)[number]

type Props = {
  searchParams: Promise<{ q?: string; categoria?: string; ordem?: string }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q, categoria, ordem: ordemRaw } = await searchParams
  const t = await getTranslations('busca')
  const termo = (q ?? '').trim()
  const ordem: Ordem = ORDENS.includes(ordemRaw as Ordem)
    ? (ordemRaw as Ordem)
    : 'recentes'

  const [produtos, categorias] = await Promise.all([
    listarProdutosVitrine({
      busca: termo || undefined,
      categoria: categoria || undefined,
      limite: 60,
    }),
    listarCategoriasVitrine(),
  ])

  // Ordena pelo preço EFETIVO (promocional quando válido) — em JS porque a
  // regra coalesce(promo, cheio) não cabe num .order() simples.
  if (ordem !== 'recentes') {
    produtos.sort((a, b) => {
      const pa = precoVenda(a) ?? Number.MAX_SAFE_INTEGER
      const pb = precoVenda(b) ?? Number.MAX_SAFE_INTEGER
      return ordem === 'menor_preco' ? pa - pb : pb - pa
    })
  }

  const [medias, vendedores] = await Promise.all([
    listarMediasAvaliacoes(produtos.map((p) => p.id)),
    mapaFranquiasPublicas(produtos.map((p) => p.franquia_id)),
  ])

  const titulo = categoria
    ? categoria
    : termo
      ? t('resultados', { n: produtos.length, termo })
      : t('titulo')

  const href = (over: { cat?: string | null; ord?: Ordem }) => {
    const params = new URLSearchParams()
    if (termo) params.set('q', termo)
    const cat = over.cat === undefined ? categoria : over.cat
    if (cat) params.set('categoria', cat)
    const ord = over.ord ?? ordem
    if (ord !== 'recentes') params.set('ordem', ord)
    const s = params.toString()
    return s ? `/buscar?${s}` : '/buscar'
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">{titulo}</h1>

        {/* Ordenação */}
        <nav className="flex items-center gap-1.5 text-[12.5px]">
          <span className="mr-1 text-gray-400">{t('ordenar')}</span>
          {ORDENS.map((o) => (
            <Link
              key={o}
              href={href({ ord: o })}
              className={cn(
                'rounded-full px-3 py-1 font-medium transition-colors',
                ordem === o
                  ? 'bg-marca/10 font-semibold text-marca'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {t(`ordem_${o}`)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Sidebar de filtros (sticky) */}
        {categorias.length > 0 && (
          <aside className="shrink-0 lg:w-56">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-[88px]">
              <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                {t('filtro_categorias')}
              </span>
              <nav className="scroll-oculto flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
                <FiltroLink href={href({ cat: null })} ativo={!categoria}>
                  {t('todas_categorias')}
                </FiltroLink>
                {categorias.map((cat) => (
                  <FiltroLink
                    key={cat}
                    href={href({ cat })}
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
                <ProductCard
                  key={p.id}
                  produto={p}
                  avaliacao={medias.get(p.id) ?? null}
                  vendedor={vendedores.get(p.franquia_id) ?? null}
                />
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
