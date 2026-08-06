import { MessageCircle, ShieldCheck, Store, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/**
 * Card de confiança do design Shoppy: 4 colunas com divisórias, ícone num
 * quadradinho esmeralda-claro — informação de serviço real (AEX, retirada,
 * estoque reservado, WhatsApp), sem promessa que a loja não cumpre.
 */
export async function BeneficiosBar() {
  const t = await getTranslations('beneficios')

  const itens = [
    { icone: Truck, titulo: t('envio_titulo'), corpo: t('envio_corpo') },
    { icone: Store, titulo: t('retiro_titulo'), corpo: t('retiro_corpo') },
    { icone: ShieldCheck, titulo: t('pago_titulo'), corpo: t('pago_corpo') },
    { icone: MessageCircle, titulo: t('atencion_titulo'), corpo: t('atencion_corpo') },
  ]

  return (
    <section className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white sm:grid-cols-2 sm:divide-x sm:divide-[#F1F5F9] lg:grid-cols-4">
      {itens.map(({ icone: Icone, titulo, corpo }) => (
        <div key={titulo} className="flex items-center gap-3.5 px-5 py-4">
          <span className="grid size-[42px] shrink-0 place-items-center rounded-[11px] bg-marca-50 text-marca">
            <Icone className="size-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-noite">
              {titulo}
            </span>
            <span className="block truncate text-[12px] leading-snug text-[#64748B]">
              {corpo}
            </span>
          </span>
        </div>
      ))}
    </section>
  )
}
