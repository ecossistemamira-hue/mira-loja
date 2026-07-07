'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { inscreverNewsletter } from '@/app/actions'

export function NewsletterForm() {
  const t = useTranslations('rodape')
  const [pending, start] = useTransition()
  const [estado, setEstado] = useState<'idle' | 'ok' | 'erro'>('idle')

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '')
    start(async () => {
      const r = await inscreverNewsletter(email)
      setEstado(r.ok ? 'ok' : 'erro')
    })
  }

  if (estado === 'ok') {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <Check className="size-3.5" />
        {t('newsletter_ok')}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
      <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:border-marca/40">
        <input
          type="email"
          name="email"
          required
          placeholder={t('newsletter_placeholder')}
          className="h-9 min-w-0 flex-1 bg-transparent px-3 text-xs outline-none"
          aria-label={t('newsletter_titulo')}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 bg-marca px-3.5 text-xs font-bold text-white transition-colors hover:bg-marca-hover disabled:opacity-60"
        >
          {pending ? '…' : t('newsletter_botao')}
        </button>
      </div>
      {estado === 'erro' && (
        <p className="text-[11px] text-red-600">{t('newsletter_erro')}</p>
      )}
    </form>
  )
}
