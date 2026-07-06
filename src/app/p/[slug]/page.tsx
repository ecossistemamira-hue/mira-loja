import { ChevronLeft, Package, Store, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ProductGallery } from '@/components/product-gallery'
import { estoqueDisponivel, precoExibicao } from '@/lib/format'
import { obterProdutoPorSlug } from '@/lib/queries'

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: produto.descricao ?? undefined,
    image: imagem ? [imagem] : undefined,
    category: produto.categoria ?? undefined,
    offers: preco
      ? {
          '@type': 'Offer',
          price: produto.preco_pyg ?? produto.preco_brl ?? undefined,
          priceCurrency: preco.moeda,
          availability: semEstoque
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/p/${produto.slug ?? produto.id}`,
        }
      : undefined,
  }

  const msg = encodeURIComponent(t('whatsapp_mensagem', { nome: produto.nome }))
  const whatsappUrl = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${msg}` : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* JSON-LD Product pra SEO/rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0004ff]"
      >
        <ChevronLeft className="size-3.5" />
        {t('voltar')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          nome={produto.nome}
          fotos={produto.fotos}
          fallbackUrl={produto.imagem_url}
        />

        <div className="flex flex-col">
          {produto.categoria && (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {produto.categoria}
            </span>
          )}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight">
            {produto.nome}
          </h1>

          <div className="mt-4">
            {preco ? (
              <span className="text-3xl font-extrabold text-gray-900">
                {preco.texto}
              </span>
            ) : (
              <span className="text-lg text-gray-400">{t('sem_preco')}</span>
            )}
          </div>

          <div className="mt-2 text-[13px] font-semibold">
            {semEstoque ? (
              <span className="text-red-600">{t('sem_estoque')}</span>
            ) : (
              <span className="text-emerald-600">
                {t('em_estoque')} · {t('unidades_disponiveis', { n: disponivel })}
              </span>
            )}
          </div>

          {/* Entrega */}
          <div className="mt-4 flex flex-col gap-2 text-[13px] text-gray-600">
            {produto.permite_envio && (
              <span className="inline-flex items-center gap-2">
                <Truck className="size-4 text-gray-400" />
                {t('entrega_envio')}
              </span>
            )}
            {produto.permite_retirada && (
              <span className="inline-flex items-center gap-2">
                <Store className="size-4 text-gray-400" />
                {t('entrega_retirada')}
              </span>
            )}
          </div>

          {/* CTA temporário (Fase 1: sem carrinho ainda) */}
          {whatsappUrl && !semEstoque && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95"
              style={{ background: '#0004ff' }}
            >
              {t('comprar_whatsapp')}
            </a>
          )}

          {/* Descrição */}
          {produto.descricao && (
            <div className="mt-8">
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
    </div>
  )
}
