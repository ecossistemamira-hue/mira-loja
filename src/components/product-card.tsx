import { Store } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

import { StarRating } from '@/components/star-rating'
import { WishlistButton } from '@/components/wishlist-button'
import { cn } from '@/lib/cn'
import { estoqueDisponivel, precoExibicao } from '@/lib/format'
import type { ProdutoVitrine } from '@/lib/types'

type Props = {
  produto: ProdutoVitrine
  /** Largura fixa pra uso em carrossel horizontal (w-52 shrink-0). */
  compacto?: boolean
  /** Média/total de avaliações (batch da página via listarMediasAvaliacoes). */
  avaliacao?: { media: number; total: number } | null
  /** Franquia vendedora (batch da página via mapaFranquiasPublicas). Texto,
   *  não link — o card inteiro já é um <Link> pra PDP. */
  vendedor?: {
    nome: string
    slug: string | null
    aceitaRetirada: boolean
  } | null
}

export async function ProductCard({
  produto,
  compacto = false,
  avaliacao,
  vendedor,
}: Props) {
  const t = await getTranslations('produto')
  const preco = precoExibicao(produto)
  const disponivel = estoqueDisponivel(produto)
  const semEstoque = disponivel <= 0

  return (
    <Link
      href={`/p/${produto.slug ?? produto.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_10px_30px_-12px_rgb(74_12_26_/_0.18)]',
        compacto && 'w-52 shrink-0',
      )}
    >
      {/* Imagem em protagonismo — fundo branco limpo, zoom sutil no hover */}
      <div className="relative flex h-48 items-center justify-center bg-white px-5 pb-2 pt-5">
        {produto.imagem_url ? (
          <div className="relative h-36 w-full">
            <Image
              src={produto.imagem_url}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, 208px"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.06]"
            />
          </div>
        ) : (
          <span className="text-4xl">📦</span>
        )}

        {semEstoque ? (
          <span className="absolute left-0 top-3 bg-gray-900/85 py-1 pl-2.5 pr-2 text-[10px] font-bold text-white [clip-path:polygon(0_0,100%_0,calc(100%-6px)_50%,100%_100%,0_100%)]">
            {t('sem_estoque')}
          </span>
        ) : (
          preco?.descontoPct != null && (
            <span className="absolute left-0 top-3 bg-marca py-1 pl-2.5 pr-3 font-display text-[11px] font-bold text-white [clip-path:polygon(0_0,100%_0,calc(100%-7px)_50%,100%_100%,0_100%)]">
              -{preco.descontoPct}%
            </span>
          )
        )}

        <WishlistButton
          className="absolute right-2.5 top-2.5"
          item={{
            id: produto.id,
            slug: produto.slug,
            nome: produto.nome,
            imagemUrl: produto.imagem_url,
            precoTexto: preco?.texto ?? null,
            categoria: produto.categoria,
          }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100/80 px-4 pb-4 pt-3">
        {produto.categoria && (
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            {produto.categoria}
          </span>
        )}
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-800">
          {produto.nome}
        </h3>

        {avaliacao && avaliacao.total > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <StarRating nota={avaliacao.media} tamanho={11} />
            <span className="font-semibold text-gray-600">{avaliacao.media}</span>
            <span>({avaliacao.total})</span>
          </span>
        )}

        {vendedor && (
          <span className="truncate text-[11px] text-gray-400">
            {t('card_por')}{' '}
            <span className="font-semibold text-gray-600">{vendedor.nome}</span>
          </span>
        )}

        <div className="mt-auto pt-1.5">
          {preco ? (
            <>
              {preco.textoAntigo && (
                <span className="block text-[11.5px] text-gray-400 line-through">
                  {preco.textoAntigo}
                </span>
              )}
              <span
                className={cn(
                  'font-display text-[17.5px] font-bold tracking-tight',
                  preco.textoAntigo ? 'text-marca' : 'text-gray-900',
                )}
              >
                {preco.texto}
              </span>
            </>
          ) : (
            <span className="text-[12px] text-gray-400">{t('sem_preco')}</span>
          )}
          {/* Retirada exige o produto permitir E a franquia ter balcão (0096) */}
          {produto.permite_retirada &&
            vendedor?.aceitaRetirada &&
            !semEstoque && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <Store className="size-3" />
                {t('card_retiro')}
              </span>
            )}
        </div>
      </div>
    </Link>
  )
}

/** Skeleton do card pros estados de loading dos carrosséis. */
export function ProductCardSkeleton({ compacto = false }: { compacto?: boolean }) {
  return (
    <div
      className={cn(
        'animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white',
        compacto && 'w-52 shrink-0',
      )}
    >
      <div className="h-48 bg-gray-100" />
      <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
        <div className="h-2.5 w-16 rounded bg-gray-100" />
        <div className="h-3.5 w-full rounded bg-gray-100" />
        <div className="h-5 w-24 rounded bg-gray-100" />
      </div>
    </div>
  )
}
