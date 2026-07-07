import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { CheckoutForm } from '@/components/checkout-form'
import { obterCarrinho } from '@/lib/cart-queries'
import { formatarPreco, moedaDoGrupo, precoNaMoeda } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
}

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const t = await getTranslations('checkout')
  const { grupos, totalItens } = await obterCarrinho()

  // Sem itens não há o que finalizar.
  if (totalItens === 0) redirect('/carrinho')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/carrinho"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-marca"
      >
        <ChevronLeft className="size-3.5" />
        {t('voltar_carrinho')}
      </Link>

      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">{t('titulo')}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CheckoutForm />

        {/* Resumo */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold">{t('resumo')}</h2>
            <div className="flex flex-col gap-3">
              {grupos.map((grupo, i) => {
                const moeda = moedaDoGrupo(grupo.itens, grupo.franquia?.moeda)
                const subtotal = grupo.itens.reduce((s, it) => {
                  const p = precoNaMoeda(it, moeda)
                  return s + (p != null ? p * it.quantidade : 0)
                }, 0)
                return (
                  <div key={grupo.franquia?.id ?? i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="mb-1 text-[12px] font-semibold text-gray-500">
                      {grupo.franquia?.nome_fantasia ?? t('vendedor')}
                    </div>
                    {grupo.itens.map((it) => (
                      <div key={it.itemId} className="flex justify-between gap-2 text-[13px]">
                        <span className="min-w-0 truncate text-gray-600">
                          {it.quantidade}× {it.nome}
                        </span>
                        <span className="shrink-0 font-medium">
                          {formatarPreco(
                            (precoNaMoeda(it, moeda) ?? 0) * it.quantidade,
                            moeda,
                          )}
                        </span>
                      </div>
                    ))}
                    <div className="mt-1.5 flex justify-between text-[13px] font-bold">
                      <span>{t('subtotal')}</span>
                      <span>{formatarPreco(subtotal, moeda)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] text-gray-400">{t('frete_aviso')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
