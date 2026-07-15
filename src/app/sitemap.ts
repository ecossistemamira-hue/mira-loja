import type { MetadataRoute } from 'next'

import { listarSlugsFranquias, listarSlugsVitrine } from '@/lib/queries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export const revalidate = 3600

// es é o locale default SEM prefixo; pt-BR vive sob /pt (src/i18n/routing.ts).
function urlEs(path: string) {
  return `${SITE_URL}${path === '/' ? '' : path}`
}
function urlPt(path: string) {
  return `${SITE_URL}/pt${path === '/' ? '' : path}`
}

/** Uma entrada por locale, cada uma apontando os alternates (hreflang). */
function entradasLocalizadas(
  path: string,
  extras: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  const languages = { es: urlEs(path), 'pt-BR': urlPt(path) }
  return [
    { url: urlEs(path), alternates: { languages }, ...extras },
    { url: urlPt(path), alternates: { languages }, ...extras },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [produtos, franquias] = await Promise.all([
    listarSlugsVitrine(),
    listarSlugsFranquias(),
  ])

  const rotasProduto: MetadataRoute.Sitemap = produtos
    .filter((p) => p.slug)
    .flatMap((p) =>
      entradasLocalizadas(`/p/${p.slug}`, {
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: 'weekly',
        priority: 0.7,
      }),
    )

  const rotasFranquia: MetadataRoute.Sitemap = franquias.flatMap((slug) =>
    entradasLocalizadas(`/f/${slug}`, {
      changeFrequency: 'weekly',
      priority: 0.5,
    }),
  )

  return [
    ...entradasLocalizadas('/', { changeFrequency: 'daily', priority: 1 }),
    ...rotasProduto,
    ...rotasFranquia,
  ]
}
