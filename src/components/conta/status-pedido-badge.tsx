import { getTranslations } from 'next-intl/server'

import { ESTILO_STATUS } from '@/components/conta/status-estilo'
import { cn } from '@/lib/cn'

export async function StatusPedidoBadge({ status }: { status: string }) {
  const t = await getTranslations('conta.status')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        ESTILO_STATUS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200',
      )}
    >
      {t(status)}
    </span>
  )
}
