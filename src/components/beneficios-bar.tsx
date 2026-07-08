import { MessageCircle, ShieldCheck, Store, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/** Barra de confiança (padrão de marketplace): entrega, retiro, pagamento, atendimento. */
export async function BeneficiosBar() {
  const t = await getTranslations('beneficios')

  const itens = [
    { icone: Truck, titulo: t('envio_titulo'), corpo: t('envio_corpo') },
    { icone: Store, titulo: t('retiro_titulo'), corpo: t('retiro_corpo') },
    { icone: ShieldCheck, titulo: t('pago_titulo'), corpo: t('pago_corpo') },
    { icone: MessageCircle, titulo: t('atencion_titulo'), corpo: t('atencion_corpo') },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {itens.map(({ icone: Icone, titulo, corpo }) => (
        <div
          key={titulo}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marca/10 text-marca">
            <Icone className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-gray-900">
              {titulo}
            </span>
            <span className="block truncate text-[11.5px] text-gray-500">
              {corpo}
            </span>
          </span>
        </div>
      ))}
    </section>
  )
}
