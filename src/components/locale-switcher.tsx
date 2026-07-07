'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { definirLocale } from '@/app/actions'
import { cn } from '@/lib/cn'

// Bandeiras como no OfertasParaguai — ES (Paraguai) primeiro, mercado principal.
const OPCOES = [
  { valor: 'es', label: 'ES', bandeira: '🇵🇾' },
  { valor: 'pt-BR', label: 'PT', bandeira: '🇧🇷' },
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
    <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold">
      {OPCOES.map((o) => {
        const ativo = o.valor === locale
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => trocar(o.valor)}
            disabled={pending}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 transition-all',
              ativo
                ? 'bg-marca text-white'
                : 'text-gray-500 hover:text-gray-800',
            )}
            aria-pressed={ativo}
          >
            <span aria-hidden>{o.bandeira}</span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
