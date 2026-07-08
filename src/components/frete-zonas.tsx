import { Bike, Bus, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { formatarPreco } from '@/lib/format'
import {
  cotarTodasZonas,
  type ItemFrete,
  type ServicoEntrega,
} from '@/lib/frete'

const ICONE: Record<ServicoEntrega, typeof Truck> = {
  delivery: Bike,
  courier: Truck,
  encomienda: Bus,
}

/**
 * Tabela de entrega da página do produto: as 3 zonas do Paraguai com forma,
 * prazo e preço — sem o comprador precisar digitar nada (PY não usa CEP).
 */
export async function FreteZonas({
  item,
  subtotal,
}: {
  item: ItemFrete
  subtotal: number
}) {
  const t = await getTranslations('produto')
  const opcoes = cotarTodasZonas({ itens: [item], subtotal })

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Truck className="size-4 text-gray-400" />
        {t('frete_titulo')}
      </p>
      <div className="flex flex-col gap-1.5">
        {opcoes.map((op) => {
          const Icone = ICONE[op.servico]
          return (
            <div
              key={op.zona}
              className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-[13px]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icone className="size-4 shrink-0 text-gray-400" />
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-800">
                    {t(`frete_zona_${op.zona}`)}
                  </span>
                  <span className="block text-[12px] text-gray-500">
                    {t(`frete_servico_${op.servico}`)} ·{' '}
                    {op.prazoDias.min === op.prazoDias.max
                      ? t('frete_prazo_unico', { n: op.prazoDias.max })
                      : t('frete_prazo', {
                          min: op.prazoDias.min,
                          max: op.prazoDias.max,
                        })}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-bold">
                {op.gratis ? (
                  <span className="text-emerald-600">{t('frete_gratis')}</span>
                ) : (
                  formatarPreco(op.valor)
                )}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11.5px] text-gray-400">{t('frete_gratis_aviso')}</p>
    </div>
  )
}
