import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { iconeDaCategoria } from '@/lib/categoria-icone'
import { listarCategoriasComContagem } from '@/lib/queries'

export const revalidate = 300

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'categorias' })
  return { title: t('titulo') }
}

export default async function CategoriasPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('categorias')
  const categorias = await listarCategoriasComContagem()

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-[13px] text-gray-500">
        <Link href="/" className="transition-colors hover:text-marca">
          {t('breadcrumb_inicio')}
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900">{t('titulo')}</span>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">{t('titulo')}</h1>
        <p className="mt-1.5 text-sm text-gray-600">{t('subtitulo')}</p>
      </div>

      {categorias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="text-4xl">🗂️</div>
          <p className="mx-auto mt-3 max-w-sm text-[13px] text-gray-500">
            {t('vazio')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categorias.map(({ categoria, total }) => {
            const Icone = iconeDaCategoria(categoria)
            return (
              <Link
                key={categoria}
                href={`/buscar?categoria=${encodeURIComponent(categoria)}`}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-marca hover:shadow-md"
              >
                <div className="mx-auto mb-3 grid size-16 place-items-center rounded-xl bg-white text-gray-400 shadow-sm transition-colors group-hover:bg-marca/10 group-hover:text-marca">
                  <Icone className="size-8" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {categoria}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t('n_produtos', { n: total })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
