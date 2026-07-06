'use client'

import { Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { definirQuantidade, removerItem } from '@/app/cart-actions'
import { formatarPreco } from '@/lib/format'
import type { ItemCarrinho } from '@/lib/types'

export function CartItemRow({
  item,
  moeda,
}: {
  item: ItemCarrinho
  moeda: 'BRL' | 'PYG'
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const preco = moeda === 'PYG' ? item.precoPyg : item.precoBrl
  const subtotal = preco != null ? Number(preco) * item.quantidade : null
  const noLimite = item.quantidade >= item.disponivel

  const mudar = (novaQtd: number) => {
    start(async () => {
      await definirQuantidade(item.itemId, novaQtd)
      router.refresh()
    })
  }

  const remover = () => {
    start(async () => {
      await removerItem(item.itemId)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3 py-3">
      <Link
        href={`/p/${item.slug ?? item.produtoId}`}
        className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
      >
        {item.imagemUrl ? (
          <Image
            src={item.imagemUrl}
            alt={item.nome}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-xl">📦</div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/p/${item.slug ?? item.produtoId}`}
          className="line-clamp-2 text-[13.5px] font-semibold leading-tight hover:text-[#0004ff]"
        >
          {item.nome}
        </Link>
        {preco != null && (
          <span className="mt-0.5 text-[12px] text-gray-500">
            {formatarPreco(Number(preco), moeda)}
          </span>
        )}

        <div className="mt-auto flex items-center gap-3 pt-2">
          <div className="inline-flex items-center rounded-lg border border-gray-300">
            <button
              type="button"
              onClick={() => mudar(item.quantidade - 1)}
              disabled={pending}
              className="grid size-8 place-items-center text-gray-600 hover:text-gray-900 disabled:opacity-50"
              aria-label="-"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-[13px] font-semibold tabular-nums">
              {pending ? (
                <Loader2 className="mx-auto size-3.5 animate-spin text-gray-400" />
              ) : (
                item.quantidade
              )}
            </span>
            <button
              type="button"
              onClick={() => mudar(item.quantidade + 1)}
              disabled={pending || noLimite}
              className="grid size-8 place-items-center text-gray-600 hover:text-gray-900 disabled:opacity-40"
              aria-label="+"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={remover}
            disabled={pending}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
            aria-label="Remover"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {subtotal != null && (
        <div className="shrink-0 text-right text-[14px] font-bold text-gray-900">
          {formatarPreco(subtotal, moeda)}
        </div>
      )}
    </div>
  )
}
