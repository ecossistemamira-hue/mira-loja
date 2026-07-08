import { ChevronRight, Package, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'

import { garantirComprador } from '@/app/auth-actions'
import { DadosForm } from '@/components/conta/dados-form'
import { StatusPedidoBadge } from '@/components/conta/status-pedido-badge'
import { formatarPreco } from '@/lib/format'
import { createAuthClient } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('conta')
  return { title: t('titulo'), robots: { index: false } }
}

type PedidoResumo = {
  id: string
  codigo: string
  status: string
  total: number
  moeda: string
  metodo_entrega: string
  created_at: string
}

export default async function ContaPage() {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?next=/conta')

  // Primeiro acesso: cria/adota o registro de comprador.
  await garantirComprador()

  const t = await getTranslations('conta')
  const fmt = await getFormatter()

  const [{ data: comprador }, { data: pedidos }] = await Promise.all([
    supabase
      .from('compradores')
      .select('id, nome, email, telefone, documento')
      .eq('auth_user_id', user.id)
      .maybeSingle(),
    supabase
      .from('pedidos')
      .select('id, codigo, status, total, moeda, metodo_entrega, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const listaPedidos = (pedidos ?? []) as PedidoResumo[]

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t('titulo')}</h1>

      <div className="flex flex-col gap-5">
        {/* Dados */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-marca/10 text-marca">
              <UserRound className="size-4" />
            </span>
            <h2 className="font-display text-[16px] font-bold text-gray-900">
              {t('secao_dados')}
            </h2>
          </div>
          {comprador ? (
            <DadosForm
              nome={comprador.nome}
              email={comprador.email}
              telefone={comprador.telefone}
              documento={comprador.documento}
            />
          ) : (
            <p className="text-[13px] text-gray-500">{t('dados_erro')}</p>
          )}
        </section>

        {/* Pedidos */}
        <section
          id="pedidos"
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-marca/10 text-marca">
              <Package className="size-4" />
            </span>
            <h2 className="font-display text-[16px] font-bold text-gray-900">
              {t('secao_pedidos')}
            </h2>
          </div>

          {listaPedidos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
              <p className="text-[13px] text-gray-500">{t('sem_pedidos')}</p>
              <Link
                href="/"
                className="mt-3 inline-flex h-9 items-center rounded-lg bg-marca px-4 text-[12px] font-bold text-white transition-colors hover:bg-marca-hover"
              >
                {t('ir_comprar')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {listaPedidos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/conta/pedidos/${p.codigo}`}
                    className="group flex items-center gap-3 py-3.5 transition-colors hover:bg-gray-50/60 sm:px-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-gray-900">
                          {p.codigo}
                        </span>
                        <StatusPedidoBadge status={p.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {fmt.dateTime(new Date(p.created_at), {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        {' · '}
                        {p.metodo_entrega === 'retirada'
                          ? t('entrega_retirada')
                          : t('entrega_envio')}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[14px] font-bold text-gray-900">
                      {formatarPreco(Number(p.total), p.moeda === 'USD' ? 'USD' : 'PYG')}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-gray-300 transition-colors group-hover:text-marca" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
