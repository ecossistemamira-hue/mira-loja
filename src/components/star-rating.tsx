import { Star } from 'lucide-react'

import { cn } from '@/lib/cn'

/** Estrelas de exibição (0-5, meia estrela arredonda pra cheia no visual). */
export function StarRating({
  nota,
  className,
  tamanho = 16,
}: {
  nota: number
  className?: string
  tamanho?: number
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: tamanho, height: tamanho }}
          className={
            n <= Math.round(nota)
              ? 'fill-oro text-oro'
              : 'fill-gray-200 text-gray-200'
          }
        />
      ))}
    </span>
  )
}
