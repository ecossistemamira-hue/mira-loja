// Cores por status de pedido — espelha a paleta da tela /vendas/pedidos do
// gestor. Módulo separado (sem deps de servidor) pra servir tanto o badge
// server-side da conta quanto o resultado client-side do /rastreio.
export const ESTILO_STATUS: Record<string, string> = {
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
