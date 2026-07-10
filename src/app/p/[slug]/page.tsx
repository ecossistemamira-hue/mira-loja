import { BadgeCheck, MapPin, Package, ShieldCheck, Store, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { CompraBox } from '@/components/add-to-cart-button'
import { AvaliacoesSection } from '@/components/avaliacoes-section'
import { AvisoEstoque } from '@/components/aviso-estoque'
import { BeneficiosBar } from '@/components/beneficios-bar'
import { CategoryCarousel } from '@/components/category-carousel'
import { FreteAex } from '@/components/frete-aex'
import { ProductCard } from '@/components/product-card'
import { ProductGallery } from '@/components/product-gallery'
import { ShareButtons } from '@/components/share-buttons'
import { StarRating } from '@/components/star-rating'
import { RegistrarVisita } from '@/components/vistos-recentemente'
import { WishlistButton } from '@/components/wishlist-button'
import { listarAvaliacoes, listarMediasAvaliacoes } from '@/lib/avaliacoes'
import { estoqueDisponivel, precoExibicao, precoVenda } from '@/lib/format'
import {
  listarProdutosVitrine,
  mapaFranquiasPublicas,
  obterProdutoPorSlug,
} from '@/lib/queries'
import type { ProdutoDetalhe } from '@/lib/types'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const produto = await obterProdutoPorSlug(slug)
  if (!produto) return {}

  const preco = precoExibicao(produto)
  const descricao =
    produto.descricao?.slice(0, 160) ??
    `${produto.nome}${preco ? ` — ${preco.texto}` : ''}`
  const imagem = produto.imagem_url ?? produto.fotos[0]?.url

  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `${SITE_URL}/p/${produto.slug ?? produto.id}` },
    openGraph: {
      title: produto.nome,
      description: descricao,
      type: 'website',
      images: imagem ? [{ url: imagem }] : undefined,
    },
  }
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params
  const produto = await obterProdutoPorSlug(slug)
  if (!produto) notFound()

  const t = await getTranslations('produto')
  const preco = precoExibicao(produto)
  const disponivel = estoqueDisponivel(produto)
  const semEstoque = disponivel <= 0
  const imagem = produto.imagem_url ?? produto.fotos[0]?.url
  const avaliacoes = await listarAvaliacoes(produto.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: produto.descricao ?? undefined,
    image: imagem ? [imagem] : undefined,
    category: produto.categoria ?? undefined,
    aggregateRating:
      avaliacoes.total > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: avaliacoes.media,
            reviewCount: avaliacoes.total,
          }
        : undefined,
    offers: preco
      ? {
          '@type': 'Offer',
          price: precoVenda(produto) ?? undefined,
          priceCurrency: 'PYG',
          availability: semEstoque
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/p/${produto.slug ?? produto.id}`,
          seller: produto.vendedor
            ? { '@type': 'Organization', name: produto.vendedor.nome_fantasia }
            : undefined,
        }
      : undefined,
  }

  // Ficha técnica — só entradas com dado preenchido.
  const dimensoes =
    produto.altura_cm != null &&
    produto.largura_cm != null &&
    produto.comprimento_cm != null
      ? `${Number(produto.altura_cm)} × ${Number(produto.largura_cm)} × ${Number(produto.comprimento_cm)} cm`
      : null
  const peso =
    produto.peso_gramas != null
      ? produto.peso_gramas >= 1000
        ? `${(produto.peso_gramas / 1000).toLocaleString()} kg`
        : `${produto.peso_gramas} g`
      : null
  const specs: Array<{ rotulo: string; valor: string }> = [
    ...(produto.categoria
      ? [{ rotulo: t('categoria'), valor: produto.categoria }]
      : []),
    ...(peso ? [{ rotulo: t('spec_peso'), valor: peso }] : []),
    ...(dimensoes ? [{ rotulo: t('spec_dimensoes'), valor: dimensoes }] : []),
    ...(produto.vendedor
      ? [{ rotulo: t('spec_vendedor'), valor: produto.vendedor.nome_fantasia }]
      : []),
  ]

  const msg = encodeURIComponent(t('whatsapp_mensagem', { nome: produto.nome }))
  const whatsappUrl = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${msg}` : null
  const urlProduto = `${SITE_URL}/p/${produto.slug ?? produto.id}`

  // Relacionados: mesma categoria, excluindo o próprio produto.
  const relacionados = produto.categoria
    ? (await listarProdutosVitrine({ categoria: produto.categoria, limite: 9 }))
        .filter((p) => p.id !== produto.id)
        .slice(0, 8)
    : []
  const [mediasRelacionados, vendedoresRelacionados] = await Promise.all([
    listarMediasAvaliacoes(relacionados.map((p) => p.id)),
    mapaFranquiasPublicas(relacionados.map((p) => p.franquia_id)),
  ])

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      {/* JSON-LD Product pra SEO/rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb: Início / Categorias / [categoria] / nome */}
      <nav className="mb-4 flex flex-wrap items-center text-[13px] text-gray-500">
        <Link href="/" className="transition-colors hover:text-marca">
          {t('breadcrumb_inicio')}
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link href="/categorias" className="transition-colors hover:text-marca">
          {t('breadcrumb_categorias')}
        </Link>
        {produto.categoria && (
          <>
            <span className="mx-2 text-gray-300">/</span>
            <Link
              href={`/buscar?categoria=${encodeURIComponent(produto.categoria)}`}
              className="transition-colors hover:text-marca"
            >
              {produto.categoria}
            </Link>
          </>
        )}
        <span className="mx-2 text-gray-300">/</span>
        <span className="truncate text-gray-900">{produto.nome}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          nome={produto.nome}
          fotos={produto.fotos}
          fallbackUrl={produto.imagem_url}
        />

        <div className="flex flex-col">
          {produto.categoria && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
              {produto.categoria}
            </span>
          )}
          <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
            {produto.nome}
          </h1>

          {avaliacoes.total > 0 && (
            <a
              href="#avaliacoes"
              className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-marca"
            >
              <StarRating nota={avaliacoes.media} tamanho={14} />
              <span className="font-semibold">{avaliacoes.media}</span>
              <span>({t('n_avaliacoes', { n: avaliacoes.total })})</span>
            </a>
          )}

          {/* Especificações (ficha técnica, como no OfertasParaguai) */}
          {specs.length > 0 && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <h2 className="mb-3 text-sm font-bold text-gray-900">
                {t('especificacoes')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {specs.map((s) => (
                  <div key={s.rotulo}>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      {s.rotulo}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {s.valor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloco de preço em destaque (assinatura do design) */}
          <div className="mt-5 rounded-2xl border border-marca/10 bg-marca/5 p-5">
            {preco ? (
              <>
                {preco.textoAntigo && (
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-[15px] text-gray-400 line-through">
                      {preco.textoAntigo}
                    </span>
                    <span className="rounded-full bg-marca px-2 py-0.5 text-[11px] font-black text-white">
                      -{preco.descontoPct}%
                    </span>
                  </div>
                )}
                <span className="font-display text-4xl font-black text-marca">
                  {preco.texto}
                </span>
              </>
            ) : (
              <span className="text-lg text-gray-400">{t('sem_preco')}</span>
            )}
            {semEstoque && (
              <div className="mt-1.5 text-[13px] font-semibold">
                <span className="text-red-600">{t('sem_estoque')}</span>
              </div>
            )}
          </div>

          {/* Selos de confiança editados pela franquia */}
          {produto.selos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {produto.selos.map((selo) => (
                <span
                  key={selo}
                  className="inline-flex items-center gap-1.5 rounded-full border border-marca/15 bg-marca/5 px-3 py-1.5 text-[12px] font-bold text-marca"
                >
                  <BadgeCheck className="size-3.5" />
                  {selo}
                </span>
              ))}
            </div>
          )}

          {/* Esgotado: avise-me quando voltar. Sem prefill de e-mail do
              logado — ler cookies aqui quebraria o ISR (revalidate) da PDP. */}
          {semEstoque && <AvisoEstoque produtoId={produto.id} />}

          {/* Entrega */}
          <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-medium text-gray-600">
            {produto.permite_envio && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
                <Truck className="size-3.5 text-gray-400" />
                {t('entrega_envio')}
              </span>
            )}
            {/* Retirada: produto permite E a franquia tem balcão (0096) */}
            {produto.permite_retirada &&
              (produto.vendedor?.aceita_retirada ?? true) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
                  <Store className="size-3.5 text-gray-400" />
                  {t('entrega_retirada')}
                </span>
              )}
          </div>

          {/* Cotação AEX por cidade de destino (PY não usa CEP) */}
          {produto.permite_envio && (
            <FreteAex
              item={{
                pesoGramas: produto.peso_gramas,
                alturaCm: produto.altura_cm,
                larguraCm: produto.largura_cm,
                comprimentoCm: produto.comprimento_cm,
                quantidade: 1,
              }}
            />
          )}

          {/* Vendido por (franquia da rede) — linka pra vitrine da franquia */}
          {produto.vendedor && (
            <VendedorCard
              vendedor={produto.vendedor}
              rotulo={t('vendido_por')}
              selo={t('franquia_verificada')}
            />
          )}

          {/* Ação principal: quantidade + comprar agora + carrinho */}
          {!semEstoque && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <CompraBox produtoId={produto.id} maxQtd={disponivel} />
              <WishlistButton
                variante="pagina"
                item={{
                  id: produto.id,
                  slug: produto.slug,
                  nome: produto.nome,
                  imagemUrl: imagem ?? null,
                  precoTexto: preco?.texto ?? null,
                  categoria: produto.categoria,
                }}
              />
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 text-[14px] font-semibold text-gray-700 transition-colors hover:border-marca/40 hover:text-marca"
                >
                  {t('comprar_whatsapp')}
                </a>
              )}
            </div>
          )}

          {/* Compartilhar */}
          <div className="mt-5">
            <ShareButtons titulo={produto.nome} url={urlProduto} />
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div className="mt-7">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Package className="size-4 text-gray-400" />
                {t('descricao')}
              </h2>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-gray-700">
                {produto.descricao}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Registra no histórico local (vistos recentemente) */}
      <RegistrarVisita
        produto={{
          id: produto.id,
          slug: produto.slug,
          nome: produto.nome,
          imagemUrl: imagem ?? null,
          precoTexto: preco?.texto ?? null,
        }}
      />

      {/* Barra de confiança */}
      <div className="mt-8">
        <BeneficiosBar />
      </div>

      {/* Avaliações */}
      <AvaliacoesSection produtoId={produto.id} resumo={avaliacoes} />

      {/* Mais desta categoria */}
      {relacionados.length > 0 && (
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-[17px] font-bold text-gray-900">
            {t('relacionados')}
          </h2>
          <CategoryCarousel>
            {relacionados.map((p) => (
              <ProductCard
                key={p.id}
                produto={p}
                compacto
                avaliacao={mediasRelacionados.get(p.id) ?? null}
                vendedor={vendedoresRelacionados.get(p.franquia_id) ?? null}
              />
            ))}
          </CategoryCarousel>
        </section>
      )}
    </div>
  )
}

function VendedorCard({
  vendedor,
  rotulo,
  selo,
}: {
  vendedor: NonNullable<ProdutoDetalhe['vendedor']>
  rotulo: string
  selo: string
}) {
  const conteudo = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
          <Store className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
            {rotulo}
          </p>
          <p className="truncate text-sm font-semibold text-gray-900">
            {vendedor.nome_fantasia}
          </p>
          {vendedor.cidade && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="size-3" />
              {vendedor.cidade}, {vendedor.pais}
            </p>
          )}
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
        <ShieldCheck className="size-3.5" />
        {selo}
      </span>
    </>
  )

  const classes =
    'mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'

  // Franquia sem slug (não deveria acontecer pós-migration 0094): card estático.
  if (!vendedor.slug) return <div className={classes}>{conteudo}</div>

  return (
    <Link
      href={`/f/${vendedor.slug}`}
      className={`${classes} transition-colors hover:border-marca/30`}
    >
      {conteudo}
    </Link>
  )
}
