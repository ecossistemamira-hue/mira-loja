import { ChevronLeft, MapPin, Store, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'

import { StatusPedidoBadge } from '@/components/conta/status-pedido-badge'
import { formatarPreco } from '@/lib/format'
import { createAuthClient } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ codigo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params
  return { title: codigo, robots: { index: false } }
}

type Item = {
  id: string
  nome_snapshot: string
  preco_snapshot: number
  quantidade: number
}

type Evento = {
  id: string
  status_de: string | null
  status_para: string | null
  origem: string | null
  created_at: string
}

export default async function PedidoContaPage({ params }: Props) {
  const { codigo } = await params
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?next=/conta/pedidos/${codigo}`)

  const t = await getTranslations('conta')
  const fmt = await getFormatter()

  // RLS pedidos_comprador garante que só o dono enxerga.
  const { data: pedido } = await supabase
    .from('pedidos')
    .select(
      'id, codigo, status, subtotal, desconto, frete, total, moeda, metodo_entrega, endereco_entrega, created_at, franquia_id',
    )
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()
  if (!pedido) notFound()

  const [{ data: itens }, { data: eventos }, { data: vendedor }] =
    await Promise.all([
      supabase
        .from('pedido_itens')
        .select('id, nome_snapshot, preco_snapshot, quantidade')
        .eq('pedido_id', pedido.id),
      supabase
        .from('pedido_eventos')
        .select('id, status_de, status_para, origem, created_at')
        .eq('pedido_id', pedido.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('franquias_publicas')
        .select('nome_fantasia, cidade, pais')
        .eq('id', pedido.franquia_id)
        .maybeSingle(),
    ])

  const endereco = pedido.endereco_entrega as Record<string, string> | null
  const tStatus = await getTranslations('conta.status')

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 sm:px-6">
      <Link
        href="/conta#pedidos"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 transition-colors hover:text-marca"
      >
        <ChevronLeft className="size-3.5" />
        {t('voltar_conta')}
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight">
            {pedido.codigo}
          </h1>
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
        <StatusPedidoBadge status={pedido.status} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Itens */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">
            {t('pedido_itens')}
          </h2>
          <ul className="divide-y divide-gray-50">
            {((itens ?? []) as Item[]).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gray-50 font-mono text-[11px] font-bold text-gray-500">
                  {item.quantidade}×
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-800">
                  {item.nome_snapshot}
                </span>
                <span className="shrink-0 font-mono text-[13px] font-bold text-gray-900">
                  {formatarPreco(Number(item.preco_snapshot) * item.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1 border-t border-gray-100 pt-3 text-[13px]">
            <LinhaTotal rotulo={t('pedido_subtotal')} valor={formatarPreco(Number(pedido.subtotal))} />
            {Number(pedido.desconto) > 0 && (
              <LinhaTotal rotulo={t('pedido_desconto')} valor={`− ${formatarPreco(Number(pedido.desconto))}`} />
            )}
            {Number(pedido.frete) > 0 && (
              <LinhaTotal rotulo={t('pedido_frete')} valor={formatarPreco(Number(pedido.frete))} />
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-gray-900">{t('pedido_total')}</span>
              <span className="font-mono text-[16px] font-black text-marca">
                {formatarPreco(Number(pedido.total))}
              </span>
            </div>
          </div>
        </section>

        {/* Entrega + vendedor */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
              {pedido.metodo_entrega === 'retirada' ? (
                <Store className="size-4 text-gray-400" />
              ) : (
                <Truck className="size-4 text-gray-400" />
              )}
              {pedido.metodo_entrega === 'retirada'
                ? t('entrega_retirada')
                : t('entrega_envio')}
            </h2>
            {endereco ? (
              <p className="text-[13px] leading-relaxed text-gray-600">
                {[endereco.logradouro, endereco.numero].filter(Boolean).join(', ')}
                {endereco.complemento ? ` — ${endereco.complemento}` : ''}
                <br />
                {[endereco.bairro, endereco.cidade, endereco.estado]
                  .filter(Boolean)
                  .join(', ')}
                {endereco.cep ? ` · ${endereco.cep}` : ''}
              </p>
            ) : (
              <p className="text-[13px] text-gray-500">{t('retirada_dica')}</p>
            )}
          </div>

          {vendedor && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Store className="size-4 text-gray-400" />
                {t('pedido_vendedor')}
              </h2>
              <p className="text-[13px] font-semibold text-gray-800">
                {vendedor.nome_fantasia}
              </p>
              {vendedor.cidade && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="size-3" />
                  {vendedor.cidade}, {vendedor.pais}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Timeline */}
        {(eventos ?? []).length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900">
              {t('pedido_timeline')}
            </h2>
            <ol className="relative flex flex-col gap-4 border-l border-gray-100 pl-5">
              {((eventos ?? []) as Evento[]).map((ev) => (
                <li key={ev.id} className="relative">
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
