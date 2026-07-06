'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { definirLocale } from '@/app/actions'

const OPCOES = [
  { valor: 'es', label: 'ES' },
  { valor: 'pt-BR', label: 'PT' },
] as const

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [pending, start] = useTransition()

  const trocar = (valor: string) => {
    if (valor === locale) return
    start(async () => {
      await definirLocale(valor)
      router.refresh()
    })
  }

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold">
      {OPCOES.map((o) => {
        const ativo = o.valor === locale
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => trocar(o.valor)}
            disabled={pending}
            className={
              ativo
                ? 'rounded-full px-2.5 py-1 text-white'
                : 'rounded-full px-2.5 py-1 text-gray-500 hover:text-gray-800'
            }
            style={ativo ? { background: '#0004ff' } : undefined}
            aria-pressed={ativo}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
