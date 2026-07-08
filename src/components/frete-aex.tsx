'use client'

import { Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { formatarPreco } from '@/lib/format'
import {
  cidadesPorDepartamento,
  cotarFrete,
  type ItemFrete,
} from '@/lib/frete'

/**
 * Cotação AEX na página do produto: escolhe a cidade de destino e o preço sai
 * da tabela oficial da AEX (origem Ciudad del Este). Cálculo local — a tabela
 * é pública e o checkout recalcula no servidor de qualquer forma.
 */
export function FreteAex({ item }: { item: ItemFrete }) {
  const t = useTranslations('produto')
  const [cidadeId, setCidadeId] = useState<number | ''>('')
  const grupos = useMemo(() => cidadesPorDepartamento(), [])

  const cotacao = cidadeId === '' ? null : cotarFrete(cidadeId, [item])

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Truck className="size-4 text-gray-400" />
        {t('frete_titulo')}
      </p>
      <p className="mb-2.5 text-[12px] text-gray-500">{t('frete_subtitulo')}</p>

      <select
        value={cidadeId}
        onChange={(e) =>
          setCidadeId(e.target.value === '' ? '' : Number(e.target.value))
        }
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-[14px] outline-none focus:border-marca/40"
        aria-label={t('frete_cidade_aria')}
      >
        <option value="">{t('frete_cidade_placeholder')}</option>
        {grupos.map((g) => (
          <optgroup key={g.departamento} label={g.departamento}>
            {g.cidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cidade}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {cotacao && cotacao.ok && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-[13px]">
          <span className="min-w-0">
            <span className="block font-semibold text-gray-800">
              {t('frete_servico_aex')}
            </span>
            <span className="block text-[12px] text-gray-500">
              {t('frete_ate', { cidade: cotacao.cidade.cidade })}
            </span>
          </span>
          <span className="shrink-0 font-bold">{formatarPreco(cotacao.valor)}</span>
        </div>
      )}
      {cotacao && !cotacao.ok && cotacao.error === 'peso_excede' && (
        <p className="mt-3 text-[13px] font-medium text-amber-700">
          {t('frete_peso_excede')}
        </p>
      )}

      <p className="mt-2 text-[11.5px] text-gray-400">{t('frete_fonte')}</p>
    </div>
  )
}
