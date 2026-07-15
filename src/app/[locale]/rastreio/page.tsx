import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RastreioForm } from '@/components/rastreio-form'

export const metadata: Metadata = {
  title: 'Rastreio',
  robots: { index: false },
}

type Props = { params: Promise<{ locale: string }> }

export default async function RastreioPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('rastreio')

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('titulo')}</h1>
      <p className="mb-6 mt-1 text-[13px] text-gray-500">{t('subtitulo')}</p>
      <RastreioForm />
    </div>
  )
}
