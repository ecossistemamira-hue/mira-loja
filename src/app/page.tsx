import { Flame, Sparkles, Tag } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { BeneficiosBar } from '@/components/beneficios-bar'
import { CategoryCarousel } from '@/components/category-carousel'
import { HeroCarousel, type SlideHero } from '@/components/hero-carousel'
import { ProductCard } from '@/components/product-card'
import { VistosRecentemente } from '@/components/vistos-recentemente'
import { listarMediasAvaliacoes } from '@/lib/avaliacoes'
import { listarMaisVendidos } from '@/lib/mais-vendidos'
import { listarCategoriasVitrine, listarProdutosVitrine } from '@/lib/queries'
import type { ProdutoVitrine } from '@/lib/types'

// Revalida a home a cada 5 min (ISR) — vitrine muda pouco, mas reflete novos
// produtos publicados sem rebuild.
export const revalidate = 300

export default async function HomePage() {
  const t = await getTranslations('home')
  const [produtos, categorias, maisVendidos] = await Promise.all([
    listarProdutosVitrine({ limite: 60 }),
    listarCategoriasVitrine(),
    listarMaisVendidos(12),
  ])
  const medias = await listarMediasAvaliacoes([
    ...new Set([...produtos, ...maisVendidos].map((p) => p.id)),
  ])

  const slides: SlideHero[] = [1, 2, 3].map((n) => ({
    badge: t(`hero_badge_${n}`),
    titulo: t(`hero_titulo_${n}`),
    subtitulo: t(`hero_subtitulo_${n}`),
    cta: t(`hero_cta_${n}`),
    href: '/buscar',
  }))

  // Agrupa por categoria preservando a ordem (mais recente primeiro); seções
  // só pra categorias com 2+ produtos, no máximo 4 seções.
  const porCategoria = new Map<string, ProdutoVitrine[]>()
  for (const p of produtos) {
    if (!p.categoria) continue
    const lista = porCategoria.get(p.categoria) ?? []
    lista.push(p)
    porCategoria.set(p.categoria, lista)
  }
  const secoesCategorias = [...porCategoria.entries()]
    .filter(([, lista]) => lista.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <HeroCarousel slides={slides} />

      {/* Barra de confiança */}
      <div className="mt-5">
        <BeneficiosBar />
      </div>

      {/* Pills de categorias */}
      {categorias.length > 0 && (
        <div className="scroll-oculto mt-5 flex gap-2 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <Link
              key={cat}
              href={`/buscar?categoria=${encodeURIComponent(cat)}`}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-marca hover:bg-marca/5 hover:text-marca"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {produtos.length === 0 ? (
        <EmptyState titulo={t('vazio_titulo')} dica={t('vazio_dica')} />
      ) : (
        <>
          {/* Novidades */}
          <SecaoCarrossel
            icone={<Sparkles className="size-4" />}
            titulo={t('recentes')}
            verTodosHref="/buscar"
            verTodosLabel={t('ver_todos')}
          >
            {produtos.slice(0, 12).map((p) => (
              <ProductCard
                key={p.id}
                produto={p}
                compacto
                avaliacao={medias.get(p.id) ?? null}
              />
            ))}
          </SecaoCarrossel>

          {/* Mais vendidos (agregado de pedidos pagos) */}
          {maisVendidos.length > 0 && (
            <SecaoCarrossel
              icone={<Flame className="size-4" />}
              titulo={t('mais_vendidos')}
              verTodosHref="/buscar"
              verTodosLabel={t('ver_todos')}
            >
              {maisVendidos.map((p) => (
                <ProductCard
                  key={p.id}
                  produto={p}
                  compacto
                  avaliacao={medias.get(p.id) ?? null}
                />
              ))}
            </SecaoCarrossel>
          )}

          {/* Vistos recentemente (histórico local do visitante) */}
          <VistosRecentemente />

          {/* Uma seção por categoria relevante */}
          {secoesCategorias.map(([categoria, lista]) => (
            <SecaoCarrossel
              key={categoria}
              icone={<Tag className="size-4" />}
              titulo={categoria}
              verTodosHref={`/buscar?categoria=${encodeURIComponent(categoria)}`}
              verTodosLabel={t('ver_todos')}
            >
              {lista.slice(0, 12).map((p) => (
                <ProductCard
                  key={p.id}
                  produto={p}
                  compacto
                  avaliacao={medias.get(p.id) ?? null}
                />
              ))}
            </SecaoCarrossel>
          ))}
        </>
      )}
    </div>
  )
}

function SecaoCarrossel({
  icone,
  titulo,
  verTodosHref,
  verTodosLabel,
  children,
}: {
  icone: React.ReactNode
  titulo: string
  verTodosHref: string
  verTodosLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-marca/10 text-marca">
            {icone}
          </span>
          <h2 className="font-display text-[17px] font-bold text-gray-900">
            {titulo}
          </h2>
        </div>
        <Link
          href={verTodosHref}
          className="shrink-0 text-xs font-semibold text-marca hover:underline"
        >
          {verTodosLabel}
        </Link>
      </div>
      <CategoryCarousel>{children}</CategoryCarousel>
    </section>
  )
}

function EmptyState({ titulo, dica }: { titulo: string; dica: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="text-4xl">🛍️</div>
      <h3 className="mt-3 text-base font-semibold text-gray-900">{titulo}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">{dica}</p>
    </div>
  )
}
