import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('produto')
  return (
    <div className="mx-auto grid max-w-6xl place-items-center px-4 py-24 text-center">
      <div className="text-5xl">🛍️</div>
      <h1 className="mt-4 text-2xl font-bold">404</h1>
      <Link
        href="/"
        className="mt-4 inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-white"
        style={{ background: '#a02237' }}
      >
        {t('voltar')}
      </Link>
    </div>
  )
}
