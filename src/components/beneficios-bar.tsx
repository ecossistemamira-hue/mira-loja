import { MessageCircle, ShieldCheck, Store, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

/**
 * Barra de confiança: um painel único e quieto, itens separados por
 * hairlines — informação de serviço, não quatro cartões disputando atenção.
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
    <section className="grid grid-cols-2 rounded-2xl border border-gray-100 bg-white py-1 lg:grid-cols-4 lg:divide-x lg:divide-gray-100">
      {itens.map(({ icone: Icone, titulo, corpo }) => (
        <div key={titulo} className="flex items-center gap-3 px-4 py-3">
          <Icone className="size-[18px] shrink-0 text-marca" strokeWidth={2.2} />
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-bold text-gray-900">
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
