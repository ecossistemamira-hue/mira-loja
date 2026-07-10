import type { MetadataRoute } from 'next'

import { listarSlugsFranquias, listarSlugsVitrine } from '@/lib/queries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [produtos, franquias] = await Promise.all([
    listarSlugsVitrine(),
    listarSlugsFranquias(),
  ])

  const rotasProduto: MetadataRoute.Sitemap = produtos
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/p/${p.slug}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  const rotasFranquia: MetadataRoute.Sitemap = franquias.map((slug) => ({
    url: `${SITE_URL}/f/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...rotasProduto,
    ...rotasFranquia,
  ]
}
