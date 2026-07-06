'use client'

import { Check, Loader2, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { adicionarAoCarrinho } from '@/app/cart-actions'

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
      setTimeout(() => setOk(false), 1800)
    })
  }

  return (
    <button
      type="button"
      onClick={adicionar}
      disabled={pending || desabilitado}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
      style={{ background: '#0004ff' }}
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
