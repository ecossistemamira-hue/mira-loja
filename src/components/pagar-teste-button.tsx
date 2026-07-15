'use client'

import { Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { pagarTeste } from '@/app/checkout-actions'
import { useRouter } from '@/i18n/navigation'

export function PagarTesteButton({ pedidoId }: { pedidoId: string }) {
  const t = useTranslations('checkout')
  const router = useRouter()
  const [pending, start] = useTransition()

  const pagar = () => {
    start(async () => {
      await pagarTeste(pedidoId)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={pagar}
      disabled={pending}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-4 text-[13px] font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      {t('pagar_teste')}
    </button>
  )
}
