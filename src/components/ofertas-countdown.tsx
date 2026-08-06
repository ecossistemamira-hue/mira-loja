'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

/**
 * Chip "Termina en HH:MM:SS" das Ofertas do dia — conta até a meia-noite do
 * visitante (a lista de ofertas é recalculada por dia via ISR, então o "dia"
 * de fato vira). Renderiza vazio no server pra não dar mismatch de hidratação.
 */
export function OfertasCountdown() {
  const t = useTranslations('home')
  const [restante, setRestante] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => {
      const agora = new Date()
      const meiaNoite = new Date(agora)
      meiaNoite.setHours(24, 0, 0, 0)
      const s = Math.max(0, Math.floor((meiaNoite.getTime() - agora.getTime()) / 1000))
      const pad = (n: number) => String(n).padStart(2, '0')
      setRestante(
        `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`,
      )
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!restante) return null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FEF2F2] px-2.5 py-1 text-[12.5px] font-semibold text-[#991B1B]">
      {t('ofertas_termina')}
      <span className="font-bold tabular-nums text-acento">{restante}</span>
    </span>
  )
}
