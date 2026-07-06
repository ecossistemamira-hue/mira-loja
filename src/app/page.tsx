import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ProductCard } from '@/components/product-card'
import { listarCategoriasVitrine, listarProdutosVitrine } from '@/lib/queries'

// Revalida a home a cada 5 min (ISR) — vitrine muda pouco, mas reflete novos
// produtos publicados sem rebuild.
export const revalidate = 300

export default async function HomePage() {
  const t = await getTranslations('home')
  const [produtos, categorias] = await Promise.all([
    listarProdutosVitrine({ limite: 40 }),
    listarCategoriasVitrine(),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <section className="mb-8 rounded-2xl border border-gray-200 bg-white px-6 py-10 sm:px-10">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: '#0004ff' }}
        >
          Mira Shop
        </span>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {t('hero_titulo')}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-gray-500">
          {t('hero_subtitulo')}
        </p>
      </section>

      {/* Categorias */}
      {categorias.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-gray-900">
            {t('categorias')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <Link
                key={cat}
                href={`/buscar?categoria=${encodeURIComponent(cat)}`}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:border-[#0004ff] hover:text-[#0004ff]"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produtos */}
      <section>
        <h2 className="mb-4 text-sm font-bold text-gray-900">{t('recentes')}</h2>
        {produtos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="text-4xl">🛍️</div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              {t('vazio_titulo')}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">
              {t('vazio_dica')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produtos.map((p) => (
              <ProductCard key={p.id} produto={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
