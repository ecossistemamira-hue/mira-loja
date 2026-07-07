import { ShoppingCart, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { CartItemRow } from '@/components/cart-item-row'
import { obterCarrinho } from '@/lib/cart-queries'
import { formatarPreco } from '@/lib/format'
import type { GrupoCarrinho } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Carrinho',
  robots: { index: false },
}

// Carrinho depende do cookie do usuário — sempre dinâmico.
export const dynamic = 'force-dynamic'

// Moeda do grupo = a da franquia, mas cai pra moeda que os itens realmente têm
// preço (evita subtotal R$ 0,00 quando o produto só foi precificado na outra).
function moedaDoGrupo(grupo: GrupoCarrinho): 'BRL' | 'PYG' {
  const preferida: 'BRL' | 'PYG' =
    grupo.franquia?.moeda === 'BRL' ? 'BRL' : 'PYG'
  const temPreco = (m: 'BRL' | 'PYG') =>
    grupo.itens.some((i) => (m === 'BRL' ? i.precoBrl : i.precoPyg) != null)
  if (temPreco(preferida)) return preferida
  const outra: 'BRL' | 'PYG' = preferida === 'BRL' ? 'PYG' : 'BRL'
  return temPreco(outra) ? outra : preferida
}

function subtotalGrupo(grupo: GrupoCarrinho, moeda: 'BRL' | 'PYG'): number {
  return grupo.itens.reduce((soma, i) => {
    const preco = moeda === 'PYG' ? i.precoPyg : i.precoBrl
    return soma + (preco != null ? Number(preco) * i.quantidade : 0)
  }, 0)
}

export default async function CarrinhoPage() {
  const t = await getTranslations('carrinho')
  const { grupos, totalItens } = await obterCarrinho()

  if (totalItens === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto size-10 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold">{t('vazio_titulo')}</h1>
        <p className="mt-1 text-[13px] text-gray-500">{t('vazio_dica')}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-white"
          style={{ background: '#a02237' }}
        >
          {t('continuar_comprando')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">
        {t('titulo')}
      </h1>
      <p className="mb-6 text-[13px] text-gray-500">
        {t('n_itens', { n: totalItens })} · {t('aviso_grupos')}
      </p>

      <div className="flex flex-col gap-4">
        {grupos.map((grupo, i) => {
          const moeda = moedaDoGrupo(grupo)
          const subtotal = subtotalGrupo(grupo, moeda)
          return (
            <section
              key={grupo.franquia?.id ?? i}
              className="rounded-xl border border-gray-200 bg-white"
            >
              <header className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <Store className="size-4 text-gray-400" />
                <span className="text-[13px] font-semibold">
                  {grupo.franquia?.nome_fantasia ?? t('vendedor')}
                </span>
                {grupo.franquia?.cidade && (
                  <span className="text-[12px] text-gray-400">
                    · {grupo.franquia.cidade}
                  </span>
                )}
              </header>

              <div className="divide-y divide-gray-100 px-4">
                {grupo.itens.map((item) => (
                  <CartItemRow key={item.itemId} item={item} moeda={moeda} />
                ))}
              </div>

              <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <span className="text-[13px] text-gray-500">
                  {t('subtotal_vendedor')}
                </span>
                <span className="text-[15px] font-bold">
                  {formatarPreco(subtotal, moeda)}
                </span>
              </footer>
            </section>
          )
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href="/checkout"
          className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95"
          style={{ background: '#a02237' }}
        >
          {t('ir_checkout')}
        </Link>
      </div>
    </div>
  )
}
