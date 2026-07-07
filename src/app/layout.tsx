import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { WishlistProvider } from '@/lib/wishlist'

import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('site')
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t('nome')} — ${t('tagline')}`,
      template: `%s · ${t('nome')}`,
    },
    description: t('tagline'),
    openGraph: {
      siteName: t('nome'),
      type: 'website',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <WishlistProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </WishlistProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
