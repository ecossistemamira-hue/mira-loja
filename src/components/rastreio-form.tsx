'use client'

import { Loader2, PackageSearch, Store, Truck } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import {
  rastrearPedido,
  type PedidoRastreado,
} from '@/app/rastreio-actions'
import { ESTILO_STATUS } from '@/components/conta/status-estilo'
import { cn } from '@/lib/cn'
import { formatarPreco } from '@/lib/format'

export function RastreioForm() {
  const t = useTranslations('rastreio')
  const tStatus = useTranslations('conta.status')
  const fmt = useFormatter()
  const [pending, start] = useTransition()

  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [pedido, setPedido] = useState<PedidoRastreado | null>(null)
  const [erro, setErro] = useState(false)

  const buscar = () => {
    setErro(false)
    setPedido(null)
    if (!codigo.trim() || !email.trim()) {
      setErro(true)
      return
    }
    start(async () => {
      const r = await rastrearPedido({ codigo, email })
      if (r.ok) setPedido(r.pedido)
      else setErro(true)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Formulário */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-semibold text-gray-700">
              {t('campo_codigo')}
            </span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="MIRA-2026-000123"
              className="h-10 rounded-lg border border-gray-300 px-3 font-mono text-[14px] uppercase outline-none focus:border-marca/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-semibold text-gray-700">
              {t('campo_email')}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              className="h-10 rounded-lg border border-gray-300 px-3 text-[14px] outline-none focus:border-marca/40"
            />
          </label>
          <button
            type="button"
            onClick={buscar}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg px-5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
            style={{ background: '#a02237' }}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageSearch className="size-4" />
            )}
            {t('buscar')}
          </button>
        </div>
        <p className="mt-3 text-[12px] text-gray-400">{t('dica')}</p>
      </div>

      {erro && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800">
          {t('nao_encontrado')}
        </p>
      )}

      {/* Resultado */}
      {pedido && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-mono text-lg font-bold tracking-tight">
                {pedido.codigo}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {fmt.dateTime(new Date(pedido.created_at), {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                ESTILO_STATUS[pedido.status] ??
                  'bg-gray-100 text-gray-600 border-gray-200',
              )}
            >
              {tStatus(pedido.status)}
            </span>
          </div>

          {/* Itens + totais */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <ul className="divide-y divide-gray-50">
              {pedido.itens.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gray-50 font-mono text-[11px] font-bold text-gray-500">
                    {item.quantidade}×
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-800">
                    {item.nome}
                  </span>
                  <span className="shrink-0 font-mono text-[13px] font-bold text-gray-900">
                    {formatarPreco(item.preco * item.quantidade)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3 text-[13px]">
              <LinhaTotal
                rotulo={t('subtotal')}
                valor={formatarPreco(pedido.subtotal)}
              />
              {pedido.desconto > 0 && (
                <LinhaTotal
                  rotulo={t('desconto')}
                  valor={`− ${formatarPreco(pedido.desconto)}`}
                />
              )}
              {pedido.frete > 0 && (
                <LinhaTotal
                  rotulo={t('frete')}
                  valor={formatarPreco(pedido.frete)}
                />
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-gray-900">{t('total')}</span>
                <span className="font-mono text-[16px] font-black text-marca">
                  {formatarPreco(pedido.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Entrega + vendedor */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                {pedido.metodo_entrega === 'retirada' ? (
                  <Store className="size-4 text-gray-400" />
                ) : (
                  <Truck className="size-4 text-gray-400" />
                )}
                {pedido.metodo_entrega === 'retirada'
                  ? t('entrega_retirada')
                  : t('entrega_envio')}
              </h3>
            </div>
            {pedido.vendedor && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Store className="size-4 text-gray-400" />
                  {t('vendedor')}
                </h3>
                <p className="text-[13px] font-semibold text-gray-800">
                  {pedido.vendedor.nome_fantasia}
                </p>
                {pedido.vendedor.cidade && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {pedido.vendedor.cidade}, {pedido.vendedor.pais}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Timeline */}
          {pedido.eventos.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                {t('timeline')}
              </h3>
              <ol className="relative flex flex-col gap-4 border-l border-gray-100 pl-5">
                {pedido.eventos.map((ev, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1 size-2.5 rounded-full border-2 border-white bg-marca shadow-[0_0_0_2px_rgba(160,34,55,0.15)]" />
                    <p className="text-[13px] font-semibold text-gray-800">
                      {ev.status_para ? tStatus(ev.status_para) : '—'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {fmt.dateTime(new Date(ev.created_at), {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function LinhaTotal({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <span>{rotulo}</span>
      <span className="font-mono">{valor}</span>
    </div>
  )
}
