import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { LegalArticle, LegalVerTambem } from '@/components/legal-article'
import { Link } from '@/i18n/navigation'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

// Conteúdo legal em TSX por idioma (padrão do Creators). RASCUNHO para revisão
// jurídica: quem paga o frete de devolução e o prazo de reembolso são
// decisões de negócio ainda abertas (defaults razoáveis marcados abaixo).

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'pt-BR' ? 'Trocas e Devoluções' : 'Cambios y Devoluciones',
  }
}

export default async function DevolucionesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return locale === 'pt-BR' ? <DevolucoesPt /> : <DevolucionesEs />
}

function ContatoWhatsApp({ texto }: { texto: string }) {
  if (!WHATSAPP) return null
  return (
    <li>
      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
        {texto}
      </a>
    </li>
  )
}

function DevolucionesEs() {
  return (
    <LegalArticle
      titulo="Cambios y Devoluciones"
      atualizado="Última actualización: 18 de agosto de 2026"
    >
      <h2>1. Derecho de retracto (7 días)</h2>
      <p>
        Comprando a distancia tenés derecho a <strong>retractarte de la compra
        dentro de los 7 (siete) días corridos</strong> desde la recepción del
        producto, sin necesidad de justificar el motivo, conforme a la Ley N°
        1334/98 de Defensa del Consumidor y del Usuario. Ejercido el retracto en
        plazo, se te restituye lo abonado.
      </p>
      <h3>Condiciones</h3>
      <ul>
        <li>El producto no debe haber sido usado ni presentar deterioro, y debe devolverse completo, con sus accesorios, manuales y — de ser posible — su embalaje original.</li>
        <li>Por higiene y seguridad, los productos de uso personal abiertos (por ejemplo, perfumes o auriculares in-ear con precinto roto) solo se aceptan si el defecto es de fábrica.</li>
        <li>En el retracto sin defecto, el costo del envío de devolución corre por cuenta del comprador.</li>
      </ul>

      <h2>2. Producto defectuoso, dañado o equivocado</h2>
      <p>
        Si el producto llegó con defecto, dañado en el transporte, o recibiste un
        producto distinto al pedido, avisanos dentro de los 7 días de recibido. En
        estos casos la franquicia vendedora asume el <strong>costo total de la
        devolución</strong> y te ofrece, a tu elección:
      </p>
      <ul>
        <li>el reemplazo por un producto igual (sujeto a stock),</li>
        <li>o la devolución total de lo abonado, incluido el envío original.</li>
      </ul>
      <p>
        Esta política no limita la garantía legal ni las garantías del fabricante
        indicadas en la ficha del producto.
      </p>

      <h2>3. Cómo solicitar</h2>
      <ul>
        <ContatoWhatsApp texto="Escribinos por WhatsApp con el código de tu pedido (MIRA-…)" />
        <li>Tené a mano el código del pedido y el e-mail usado en la compra — son los mismos datos del <Link href="/rastreio">rastreo de pedido</Link>.</li>
        <li>Si el paquete llegó visiblemente dañado, sacá fotos del embalaje y del producto: aceleran el reclamo con la transportadora.</li>
      </ul>
      <p>
        Te confirmamos la recepción del reclamo y te indicamos cómo devolver el
        producto (envío por transportadora o entrega en el local de la franquicia
        vendedora, si ofrece retiro).
      </p>

      <h2>4. Reembolsos</h2>
      <ul>
        <li>El reembolso se procesa una vez recibido y verificado el producto devuelto.</li>
        <li>Se realiza por el mismo medio en que pagaste, dentro de los 10 (diez) días hábiles siguientes a la verificación.</li>
        <li>Si usaste un cupón, se reembolsa lo efectivamente abonado; el cupón se restituye cuando sus condiciones siguen vigentes.</li>
      </ul>

      <h2>5. Pedidos no pagados</h2>
      <p>
        Los pedidos sin pago confirmado expiran automáticamente dentro del plazo
        indicado en el checkout y el stock se libera. No hace falta pedir la
        cancelación ni genera costo alguno.
      </p>

      <LegalVerTambem
        rotulo="Ver también"
        links={[
          { href: '/terminos', texto: 'Términos y Condiciones' },
          { href: '/privacidad', texto: 'Política de Privacidad' },
          { href: '/faq', texto: 'Preguntas frecuentes' },
        ]}
      />
    </LegalArticle>
  )
}

function DevolucoesPt() {
  return (
    <LegalArticle
      titulo="Trocas e Devoluções"
      atualizado="Última atualização: 18 de agosto de 2026"
    >
      <h2>1. Direito de arrependimento (7 dias)</h2>
      <p>
        Comprando a distância você tem direito de <strong>se arrepender da compra em
        até 7 (sete) dias corridos</strong> a partir do recebimento do produto, sem
        precisar justificar o motivo, conforme a Lei N° 1334/98 de Defesa do
        Consumidor e do Usuário (Paraguai). Exercido o arrependimento no prazo, o
        valor pago é restituído.
      </p>
      <h3>Condições</h3>
      <ul>
        <li>O produto não pode ter sido usado nem apresentar deterioração, e deve ser devolvido completo, com acessórios, manuais e — se possível — a embalagem original.</li>
        <li>Por higiene e segurança, produtos de uso pessoal abertos (por exemplo, perfumes ou fones in-ear com lacre rompido) só são aceitos se o defeito for de fábrica.</li>
        <li>No arrependimento sem defeito, o custo do envio de devolução é do comprador.</li>
      </ul>

      <h2>2. Produto com defeito, danificado ou errado</h2>
      <p>
        Se o produto chegou com defeito, danificado no transporte, ou você recebeu um
        produto diferente do pedido, avise em até 7 dias do recebimento. Nesses casos
        a franquia vendedora assume o <strong>custo total da devolução</strong> e
        oferece, à sua escolha:
      </p>
      <ul>
        <li>a troca por um produto igual (sujeito a estoque),</li>
        <li>ou a devolução total do valor pago, incluído o frete original.</li>
      </ul>
      <p>
        Esta política não limita a garantia legal nem as garantias do fabricante
        indicadas na página do produto.
      </p>

      <h2>3. Como solicitar</h2>
      <ul>
        <ContatoWhatsApp texto="Fale conosco pelo WhatsApp com o código do seu pedido (MIRA-…)" />
        <li>Tenha em mãos o código do pedido e o e-mail usado na compra — são os mesmos dados do <Link href="/rastreio">rastreio de pedido</Link>.</li>
        <li>Se o pacote chegou visivelmente danificado, tire fotos da embalagem e do produto: elas aceleram a reclamação com a transportadora.</li>
      </ul>
      <p>
        Confirmamos o recebimento da solicitação e indicamos como devolver o produto
        (envio por transportadora ou entrega no local da franquia vendedora, se ela
        oferecer retirada).
      </p>

      <h2>4. Reembolsos</h2>
      <ul>
        <li>O reembolso é processado após o recebimento e a verificação do produto devolvido.</li>
        <li>É feito pelo mesmo meio em que você pagou, em até 10 (dez) dias úteis após a verificação.</li>
        <li>Se você usou um cupom, é reembolsado o valor efetivamente pago; o cupom é restituído quando suas condições seguirem vigentes.</li>
      </ul>

      <h2>5. Pedidos não pagos</h2>
      <p>
        Pedidos sem pagamento confirmado expiram automaticamente dentro do prazo
        indicado no checkout e o estoque é liberado. Não é preciso pedir o
        cancelamento e não há custo algum.
      </p>

      <LegalVerTambem
        rotulo="Veja também"
        links={[
          { href: '/terminos', texto: 'Termos e Condições' },
          { href: '/privacidad', texto: 'Política de Privacidade' },
          { href: '/faq', texto: 'Perguntas frequentes' },
        ]}
      />
    </LegalArticle>
  )
}
