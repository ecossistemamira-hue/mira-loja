import { CheckCircle2, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { PagarTesteButton } from '@/components/pagar-teste-button'
import { obterPedidoPorCodigo } from '@/lib/checkout'
import { formatarPreco } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Pedido recebido',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ codigos?: string }> }

export default async function SucessoPage({ searchParams }: Props) {
  const { codigos } = await searchParams
  const t = await getTranslations('checkout')

  const lista = (codigos ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  const pedidos = (
    await Promise.all(lista.map((c) => obterPedidoPorCodigo(c)))
  ).filter((p): p is NonNullable<typeof p> => !!p)

  const todosPagos = pedidos.length > 0 && pedidos.every((p) => p.status === 'pago')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          {todosPagos ? t('sucesso_pago_titulo') : t('sucesso_titulo')}
        </h1>
        <p className="mt-1 text-[14px] text-gray-500">
          {todosPagos ? t('sucesso_pago_dica') : t('sucesso_dica')}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {pedidos.map((p) => {
          const moeda = p.moeda === 'BRL' ? 'BRL' : 'PYG'
          const pago = p.status === 'pago'
          return (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[14px] font-bold text-marca-hover">
                  {p.codigo}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-gray-500">
                  {pago ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {t('status_pago')}
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5 text-amber-500" />
                      {t('status_aguardando')}
                    </>
                  )}
                </div>
              </div>
              <div className="text-[15px] font-bold">
                {formatarPreco(Number(p.total), moeda)}
              </div>
              {!pago && <PagarTesteButton pedidoId={p.id} />}
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-white"
          style={{ background: '#a02237' }}
        >
          {t('voltar_loja')}
        </Link>
      </div>
    </div>
  )
}
