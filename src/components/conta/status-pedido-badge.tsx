import { getTranslations } from 'next-intl/server'

import { cn } from '@/lib/cn'

// Cores por status — espelha a paleta da tela /vendas/pedidos do gestor.
const ESTILO: Record<string, string> = {
  aguardando_pagamento: 'bg-amber-50 text-amber-700 border-amber-200',
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  em_separacao: 'bg-blue-50 text-blue-700 border-blue-200',
  enviado: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  pronto_retirada: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  entregue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-gray-100 text-gray-500 border-gray-200',
  expirado: 'bg-gray-100 text-gray-500 border-gray-200',
  reembolsado: 'bg-red-50 text-red-700 border-red-200',
}

export async function StatusPedidoBadge({ status }: { status: string }) {
  const t = await getTranslations('conta.status')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        ESTILO[status] ?? 'bg-gray-100 text-gray-600 border-gray-200',
      )}
    >
      {t(status)}
    </span>
  )
}
