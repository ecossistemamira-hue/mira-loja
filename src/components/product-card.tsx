import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { estoqueDisponivel, precoExibicao } from '@/lib/format'
import type { ProdutoVitrine } from '@/lib/types'

export async function ProductCard({ produto }: { produto: ProdutoVitrine }) {
  const t = await getTranslations('produto')
  const preco = precoExibicao(produto)
  const disponivel = estoqueDisponivel(produto)
  const semEstoque = disponivel <= 0

  return (
    <Link
      href={`/p/${produto.slug ?? produto.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-[0_6px_20px_-6px_rgba(0,0,61,0.15)]"
    >
      <div className="relative aspect-square bg-gray-100">
        {produto.imagem_url ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
            className="object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">📦</div>
        )}
        {semEstoque && (
          <span className="absolute right-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            {t('sem_estoque')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {produto.categoria && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {produto.categoria}
          </span>
        )}
        <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-tight text-gray-900">
          {produto.nome}
        </h3>
        <div className="mt-auto pt-1.5">
          {preco ? (
            <span className="text-[15px] font-bold text-gray-900">
              {preco.texto}
            </span>
          ) : (
            <span className="text-[13px] text-gray-400">{t('sem_preco')}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
