import { MapPin, ShieldCheck, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ProductCard } from '@/components/product-card'
import { listarMediasAvaliacoes } from '@/lib/avaliacoes'
import { listarProdutosVitrine, obterFranquiaPorSlug } from '@/lib/queries'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const franquia = await obterFranquiaPorSlug(slug)
  if (!franquia) return {}

  return {
    title: franquia.nome_fantasia,
    description: franquia.cidade
      ? `${franquia.nome_fantasia} — ${franquia.cidade}, ${franquia.pais}`
      : franquia.nome_fantasia,
    alternates: { canonical: `${SITE_URL}/f/${slug}` },
  }
}

export default async function FranquiaPage({ params }: Props) {
  const { slug } = await params
  const franquia = await obterFranquiaPorSlug(slug)
  if (!franquia) notFound()

  const t = await getTranslations('franquia')
  const produtos = await listarProdutosVitrine({
    franquiaId: franquia.id,
    limite: 60,
  })
  const medias = await listarMediasAvaliacoes(produtos.map((p) => p.id))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Cabeçalho do vendedor */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {franquia.logo_url ? (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <Image
                src={franquia.logo_url}
                alt={franquia.nome_fantasia}
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </div>
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-marca/10 text-marca">
              <Store className="size-7" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
              {t('rotulo')}
            </p>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-gray-900">
              {franquia.nome_fantasia}
            </h1>
            {franquia.cidade && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-gray-500">
                <MapPin className="size-3.5" />
                {franquia.cidade}, {franquia.pais}
              </p>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-[11px] font-bold text-blue-700">
            <ShieldCheck className="size-4" />
            {t('verificada')}
          </span>
        </div>
      </section>

      {/* Produtos da franquia */}
      <div className="mt-6">
        <h2 className="mb-4 font-display text-[17px] font-bold text-gray-900">
          {t('produtos_titulo', { n: produtos.length })}
        </h2>
        {produtos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="text-4xl">🛍️</div>
            <p className="mx-auto mt-3 max-w-sm text-[13px] text-gray-500">
              {t('sem_produtos')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {produtos.map((p) => (
              <ProductCard
                key={p.id}
                produto={p}
                avaliacao={medias.get(p.id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
