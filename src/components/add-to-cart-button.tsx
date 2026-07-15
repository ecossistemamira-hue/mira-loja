'use client'

import { Check, Loader2, Minus, Plus, ShoppingCart, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { adicionarAoCarrinho } from '@/app/cart-actions'
import { useRouter } from '@/i18n/navigation'
import { notificarHeaderInfo } from '@/components/header-conta-carrinho'

/** Botão simples (mantido pra usos fora da PDP). */
export function AddToCartButton({
  produtoId,
  desabilitado,
}: {
  produtoId: string
  desabilitado?: boolean
}) {
  const t = useTranslations('carrinho')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [ok, setOk] = useState(false)

  const adicionar = () => {
    start(async () => {
      const r = await adicionarAoCarrinho(produtoId, 1)
      if (!r.ok) return
      setOk(true)
      router.refresh()
      notificarHeaderInfo()
      setTimeout(() => setOk(false), 1800)
    })
  }

  return (
    <button
      type="button"
      onClick={adicionar}
      disabled={pending || desabilitado}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
      style={{ background: '#a02237' }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : ok ? (
        <Check className="size-4" />
      ) : (
        <ShoppingCart className="size-4" />
      )}
      {ok ? t('adicionado') : t('adicionar')}
    </button>
  )
}

/**
 * Caixa de compra da PDP: seletor de quantidade + Adicionar ao carrinho +
 * Comprar agora (adiciona e vai direto pro checkout).
 */
export function CompraBox({
  produtoId,
  maxQtd,
}: {
  produtoId: string
  /** Estoque disponível — teto do stepper. */
  maxQtd: number
}) {
  const t = useTranslations('carrinho')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [indo, startIr] = useTransition()
  const [ok, setOk] = useState(false)
  const [qtd, setQtd] = useState(1)

  const teto = Math.max(1, maxQtd)

  const adicionar = () => {
    start(async () => {
      const r = await adicionarAoCarrinho(produtoId, qtd)
      if (!r.ok) return
      setOk(true)
      router.refresh()
      notificarHeaderInfo()
      setTimeout(() => setOk(false), 1800)
    })
  }

  const comprarAgora = () => {
    startIr(async () => {
      const r = await adicionarAoCarrinho(produtoId, qtd)
      if (!r.ok) return
      router.push('/checkout')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Quantidade */}
      <div className="inline-flex h-12 items-center rounded-full border border-gray-300">
        <button
          type="button"
          onClick={() => setQtd((q) => Math.max(1, q - 1))}
          disabled={qtd <= 1 || pending || indo}
          className="grid size-11 place-items-center text-gray-600 hover:text-gray-900 disabled:opacity-40"
          aria-label="-"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-9 text-center text-[15px] font-bold tabular-nums">
          {qtd}
        </span>
        <button
          type="button"
          onClick={() => setQtd((q) => Math.min(teto, q + 1))}
          disabled={qtd >= teto || pending || indo}
          className="grid size-11 place-items-center text-gray-600 hover:text-gray-900 disabled:opacity-40"
          aria-label="+"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={comprarAgora}
        disabled={pending || indo}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
        style={{ background: '#a02237' }}
      >
        {indo ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
        {t('comprar_agora')}
      </button>

      <button
        type="button"
        onClick={adicionar}
        disabled={pending || indo}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-marca/70 px-5 text-[14px] font-semibold text-marca transition-colors hover:bg-marca-50 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : ok ? (
          <Check className="size-4" />
        ) : (
          <ShoppingCart className="size-4" />
        )}
        {ok ? t('adicionado') : t('adicionar')}
      </button>
    </div>
  )
}
