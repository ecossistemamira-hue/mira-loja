'use client'

import { Loader2, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { cotarFreteProduto } from '@/app/frete-actions'
import { formatarPreco } from '@/lib/format'
import type { MoedaFrete, OpcaoFrete } from '@/lib/frete'

/** Calculadora de frete da página do produto: CEP → opções com prazo/valor. */
export function FreteWidget({ produtoId }: { produtoId: string }) {
  const t = useTranslations('produto')
  const [pending, start] = useTransition()
  const [cep, setCep] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{
    moeda: MoedaFrete
    opcoes: OpcaoFrete[]
  } | null>(null)

  const calcular = () => {
    setErro(null)
    start(async () => {
      const r = await cotarFreteProduto(produtoId, cep)
      if (!r.ok) {
        setResultado(null)
        setErro(
          r.error === 'sem_envio' ? t('frete_sem_envio') : t('frete_cep_invalido'),
        )
        return
      }
      setResultado({ moeda: r.moeda, opcoes: r.opcoes })
    })
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Truck className="size-4 text-gray-400" />
        {t('frete_titulo')}
      </p>
      <div className="flex gap-2">
        <input
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !pending && calcular()}
          placeholder={t('frete_placeholder')}
          inputMode="numeric"
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-[14px] outline-none focus:border-marca/40"
        />
        <button
          type="button"
          onClick={calcular}
          disabled={pending || cep.trim().length < 4}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          {t('frete_calcular')}
        </button>
      </div>

      {erro && <p className="mt-2 text-[13px] font-medium text-red-600">{erro}</p>}

      {resultado && (
        <div className="mt-3 flex flex-col gap-1.5">
          {resultado.opcoes.map((op) => (
            <div
              key={op.servico}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-[13px]"
            >
              <span className="font-semibold text-gray-800">
                {t(`frete_${op.servico}`)}
                <span className="ml-2 font-normal text-gray-500">
                  {t('frete_prazo', {
                    min: op.prazoDias.min,
                    max: op.prazoDias.max,
                  })}
                </span>
              </span>
              <span className="font-bold">
                {op.gratis ? (
                  <span className="text-emerald-600">{t('frete_gratis')}</span>
                ) : (
                  formatarPreco(op.valor, resultado.moeda)
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
