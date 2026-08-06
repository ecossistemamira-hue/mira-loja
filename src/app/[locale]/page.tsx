import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BannerVendedor } from '@/components/banner-vendedor'
import { BeneficiosBar } from '@/components/beneficios-bar'
import { CategoriasGrid } from '@/components/categorias-grid'
import { CategoryCarousel } from '@/components/category-carousel'
import { FaixaBanners } from '@/components/faixa-banners'
import { HeroBanners } from '@/components/hero-banners'
import { HeroFallback } from '@/components/hero-fallback'
import { OfertasCountdown } from '@/components/ofertas-countdown'
import { ProductCard } from '@/components/product-card'
import { VistosRecentemente } from '@/components/vistos-recentemente'
import { Link } from '@/i18n/navigation'
import { listarMediasAvaliacoes } from '@/lib/avaliacoes'
import { listarMaisVendidos } from '@/lib/mais-vendidos'
import {
  listarBannersLoja,
  listarCategoriasVitrine,
  listarOfertasVitrine,
  listarProdutosVitrine,
  mapaFranquiasPublicas,
} from '@/lib/queries'
import type { ProdutoVitrine } from '@/lib/types'

// Revalida a home a cada 5 min (ISR) — vitrine muda pouco, mas reflete novos
// produtos publicados (e banners do gestor) sem rebuild.
export const revalidate = 300

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('home')
  const [produtos, categorias, maisVendidos, ofertas, banners] =
    await Promise.all([
      listarProdutosVitrine({ limite: 60 }),
      listarCategoriasVitrine(),
      listarMaisVendidos(12),
      listarOfertasVitrine(12),
      listarBannersLoja(),
    ])
  const todos = [...produtos, ...maisVendidos, ...ofertas]
  const [medias, vendedores] = await Promise.all([
    listarMediasAvaliacoes([...new Set(todos.map((p) => p.id))]),
    mapaFranquiasPublicas(todos.map((p) => p.franquia_id)),
  ])

  const heroBanners = banners.filter((b) => b.posicao === 'loja_hero')
  const faixaBanners = banners.filter((b) => b.posicao === 'loja_faixa')

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

  const cardProduto = (p: ProdutoVitrine) => (
    <ProductCard
      key={p.id}
      produto={p}
      compacto
      avaliacao={medias.get(p.id) ?? null}
      vendedor={vendedores.get(p.franquia_id) ?? null}
    />
  )

  return (
    <div className="mx-auto max-w-[1220px] px-4 py-5 sm:px-6">
      {/* Hero: banners do gestor (Vendas → Banners da loja) ou o padrão */}
      {heroBanners.length > 0 ? (
        <HeroBanners banners={heroBanners} />
      ) : (
        <HeroFallback />
      )}

      <div className="mt-4">
        <BeneficiosBar />
      </div>

      {produtos.length === 0 ? (
        <EmptyState titulo={t('vazio_titulo')} dica={t('vazio_dica')} />
      ) : (
        <>
          {/* Ofertas do dia (maiores descontos ativos) — card com countdown */}
          {ofertas.length > 0 && (
            <SecaoCard
              titulo={t('ofertas_dia')}
              extra={<OfertasCountdown />}
              verTodosHref="/buscar?ordem=menor_preco"
              verTodosLabel={t('ver_todos')}
            >
              {ofertas.map(cardProduto)}
            </SecaoCard>
          )}

          {/* Faixa promocional do gestor (posição loja_faixa) */}
          <FaixaBanners banners={faixaBanners} />

          {/* Explorar por categoria — grid de quadradinhos */}
          <CategoriasGrid categorias={categorias} />

          {/* Novidades */}
          <SecaoCard
            titulo={t('recentes')}
            verTodosHref="/buscar"
            verTodosLabel={t('ver_todos')}
          >
            {produtos.slice(0, 12).map(cardProduto)}
          </SecaoCard>

          {/* Mais vendidos (agregado de pedidos pagos) — grade aberta */}
          {maisVendidos.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-[19px] font-bold tracking-[-0.3px] text-noite">
                  {t('mais_vendidos')}
                </h2>
                <Link
                  href="/buscar"
                  className="shrink-0 text-[13.5px] font-semibold text-marca hover:text-marca-hover"
                >
                  {t('ver_todos')} →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(228px,1fr))]">
                {maisVendidos.map((p) => (
                  <ProductCard
                    key={p.id}
                    produto={p}
                    avaliacao={medias.get(p.id) ?? null}
                    vendedor={vendedores.get(p.franquia_id) ?? null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Vistos recentemente (histórico local do visitante) */}
          <VistosRecentemente />

          {/* Uma seção por categoria relevante */}
          {secoesCategorias.map(([categoria, lista]) => (
            <SecaoCard
              key={categoria}
              titulo={categoria}
              verTodosHref={`/buscar?categoria=${encodeURIComponent(categoria)}`}
              verTodosLabel={t('ver_todos')}
            >
              {lista.slice(0, 12).map(cardProduto)}
            </SecaoCard>
          ))}

          {/* Porta de entrada pra quem quer vender (franquia) */}
          <BannerVendedor />
        </>
      )}
    </div>
  )
}

/**
 * Seção da home no padrão Shoppy: card branco radius 14, título 19px à
 * esquerda, chip opcional (countdown) e "Ver todos" à direita.
 */
function SecaoCard({
  titulo,
  extra,
  verTodosHref,
  verTodosLabel,
  children,
}: {
  titulo: string
  /** Elemento ao lado do título (ex.: countdown das ofertas). */
  extra?: React.ReactNode
  verTodosHref: string
  verTodosLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 rounded-[14px] border border-[#E2E8F0] bg-white p-5 sm:p-[22px]">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-[-0.3px] text-noite">
          {titulo}
        </h2>
        {extra}
        <Link
          href={verTodosHref}
          className="ml-auto shrink-0 text-[13.5px] font-semibold text-marca hover:text-marca-hover"
        >
          {verTodosLabel} →
        </Link>
      </div>
      <CategoryCarousel emCard>{children}</CategoryCarousel>
    </section>
  )
}

function EmptyState({ titulo, dica }: { titulo: string; dica: string }) {
  return (
    <div className="mt-6 rounded-[14px] border border-dashed border-[#CBD5E1] bg-white px-6 py-16 text-center">
      <div className="text-4xl">🛍️</div>
      <h3 className="mt-3 text-base font-semibold text-noite">{titulo}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#64748B]">{dica}</p>
    </div>
  )
}
