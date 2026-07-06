import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ProductCard } from '@/components/product-card'
import { listarProdutosVitrine } from '@/lib/queries'

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

  const produtos = await listarProdutosVitrine({
    busca: termo || undefined,
    categoria: categoria || undefined,
    limite: 60,
  })

  const titulo = categoria
    ? categoria
    : termo
      ? t('resultados', { n: produtos.length, termo })
      : t('titulo')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold tracking-tight">{titulo}</h1>

      {produtos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl">🔍</div>
          <p className="mx-auto mt-3 max-w-sm text-[13px] text-gray-500">
            {t('sem_resultados')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </div>
  )
}
