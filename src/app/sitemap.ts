import type { MetadataRoute } from 'next'

import { listarSlugsVitrine } from '@/lib/queries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const produtos = await listarSlugsVitrine()

  const rotasProduto: MetadataRoute.Sitemap = produtos
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...rotasProduto,
  ]
}
