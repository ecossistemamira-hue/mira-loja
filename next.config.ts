import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Libera o host do Supabase Storage (bucket público `produto-fotos`) pro
// next/image otimizar as fotos remotas dos produtos.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: 'https',
            hostname: new URL(supabaseUrl).hostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
