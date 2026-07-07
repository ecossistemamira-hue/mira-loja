import { HelpCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq')
  return { title: t('titulo') }
}

// Perguntas com resposta estática no i18n (faq.q1..q8 / faq.r1..r8).
const PERGUNTAS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export default async function FaqPage() {
  const t = await getTranslations('faq')
  const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-marca/10 text-marca">
          <HelpCircle className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">{t('titulo')}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{t('subtitulo')}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PERGUNTAS.map((n) => (
          <details
            key={n}
            className="group rounded-2xl border border-gray-100 bg-white shadow-sm open:border-marca/20"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[14px] font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
              {t(`q${n}`)}
              <span className="shrink-0 text-gray-300 transition-transform group-open:rotate-45 group-open:text-marca">
                +
              </span>
            </summary>
            <p className="whitespace-pre-line border-t border-gray-50 px-5 py-4 text-[13.5px] leading-relaxed text-gray-600">
              {t(`r${n}`)}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-marca/10 bg-marca/5 p-5 text-center">
        <p className="text-sm font-semibold text-gray-900">{t('nao_achou')}</p>
        <p className="mt-0.5 text-[13px] text-gray-500">{t('nao_achou_dica')}</p>
        {WHATSAPP && (
          <Link
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            className="mt-3 inline-flex h-10 items-center rounded-xl bg-marca px-5 text-[13px] font-bold text-white transition-colors hover:bg-marca-hover"
          >
            {t('falar_whatsapp')}
          </Link>
        )}
      </div>
    </div>
  )
}
