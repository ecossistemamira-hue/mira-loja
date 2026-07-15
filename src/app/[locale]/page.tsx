import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BeneficiosBar } from '@/components/beneficios-bar'
import { CategoryCarousel } from '@/components/category-carousel'
import { FaixaBanners } from '@/components/faixa-banners'
import { HeroBanners } from '@/components/hero-banners'
import { HeroFallback } from '@/components/hero-fallback'
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

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Hero: banners do gestor (Vendas → Banners da loja) ou o padrão */}
      {heroBanners.length > 0 ? (
        <HeroBanners banners={heroBanners} />
      ) : (
        <HeroFallback />
      )}

      <div className="mt-5">
        <BeneficiosBar />
      </div>

      {produtos.length === 0 ? (
        <EmptyState titulo={t('vazio_titulo')} dica={t('vazio_dica')} />
      ) : (
        <>
          {/* Ofertas do dia (maiores descontos ativos) */}
          {ofertas.length > 0 && (
            <Secao
              titulo={t('ofertas_dia')}
              destaque
              verTodosHref="/buscar?ordem=menor_preco"
              verTodosLabel={t('ver_todos')}
            >
              {ofertas.map((p) => (
                <ProductCard
                  key={p.id}
                  produto={p}
                  compacto
                  avaliacao={medias.get(p.id) ?? null}
                  vendedor={vendedores.get(p.franquia_id) ?? null}
                />
              ))}
            </Secao>
          )}

          {/* Faixa promocional do gestor (posição loja_faixa) */}
          <FaixaBanners banners={faixaBanners} />

          {/* Novidades */}
          <Secao
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
                vendedor={vendedores.get(p.franquia_id) ?? null}
              />
            ))}
          </Secao>

          {/* Mais vendidos (agregado de pedidos pagos) */}
          {maisVendidos.length > 0 && (
            <Secao
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
                  vendedor={vendedores.get(p.franquia_id) ?? null}
                />
              ))}
            </Secao>
          )}

          {/* Vistos recentemente (histórico local do visitante) */}
          <VistosRecentemente />

          {/* Uma seção por categoria relevante */}
          {secoesCategorias.map(([categoria, lista]) => (
            <Secao
              key={categoria}
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
                  vendedor={vendedores.get(p.franquia_id) ?? null}
                />
              ))}
            </Secao>
          ))}

          {/* Convite pra explorar categorias — fecha a página com direção */}
          {categorias.length > 0 && (
            <nav
              aria-label={t('explorar_categorias')}
              className="mt-10 border-t border-gray-200/70 pt-6"
            >
              <div className="scroll-oculto flex gap-2 overflow-x-auto pb-1">
                {categorias.map((cat) => (
                  <Link
                    key={cat}
                    href={`/buscar?categoria=${encodeURIComponent(cat)}`}
                    className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-marca hover:text-marca"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Seção aberta da home — título em display com o "ponto" carmim da casa, sem
 * caixa em volta (a página respira; o card do produto já é a moldura).
 */
function Secao({
  titulo,
  destaque = false,
  verTodosHref,
  verTodosLabel,
  children,
}: {
  titulo: string
  /** Ofertas ganham o ponto em ouro — único acento fora do carmim. */
  destaque?: boolean
  verTodosHref: string
  verTodosLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-9">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="font-display flex items-baseline gap-2 text-[19px] font-bold text-gray-900">
          {titulo}
          <span
            aria-hidden
            className={
              destaque
                ? 'inline-block size-1.5 rounded-full bg-oro'
                : 'inline-block size-1.5 rounded-full bg-marca'
            }
          />
        </h2>
        <Link
          href={verTodosHref}
          className="shrink-0 text-[12.5px] font-semibold text-marca hover:underline"
        >
          {verTodosLabel} →
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
