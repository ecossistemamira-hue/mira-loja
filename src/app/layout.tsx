import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { SiteHeader } from '@/components/site-header'

import './globals.css'

const poppins = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
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
  const t = await getTranslations('rodape')

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-[13px] text-gray-500">
              <span>
                © {t('direitos')}
              </span>
              <Link href="/" className="hover:text-gray-800">
                Mira Shop
              </Link>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
