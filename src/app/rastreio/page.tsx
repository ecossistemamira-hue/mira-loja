import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { RastreioForm } from '@/components/rastreio-form'

export const metadata: Metadata = {
  title: 'Rastreio',
  robots: { index: false },
}

export default async function RastreioPage() {
  const t = await getTranslations('rastreio')

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('titulo')}</h1>
      <p className="mb-6 mt-1 text-[13px] text-gray-500">{t('subtitulo')}</p>
      <RastreioForm />
    </div>
  )
}
