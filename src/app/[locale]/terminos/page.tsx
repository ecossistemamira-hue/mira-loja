import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { LegalArticle, LegalVerTambem } from '@/components/legal-article'
import { Link } from '@/i18n/navigation'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

// Conteúdo legal mantido como TSX por idioma (texto longo não vai pro messages
// json — mesmo padrão do Creators). RASCUNHO para revisão jurídica: razão
// social/RUC da entidade paraguaia, prazo de despacho e inclusão do IVA são
// decisões de negócio ainda abertas (ver PENDENCIAS).

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'pt-BR' ? 'Termos e Condições' : 'Términos y Condiciones',
  }
}

export default async function TerminosPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return locale === 'pt-BR' ? <TermosPt /> : <TerminosEs />
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

function TerminosEs() {
  return (
    <LegalArticle
      titulo="Términos y Condiciones"
      atualizado="Última actualización: 18 de agosto de 2026"
    >
      <h2>1. Quiénes somos y aceptación</h2>
      <p>
        Shoppy (la «Plataforma») es el marketplace de la red de franquicias Mira,
        operado por Mira Marketing (Foz do Iguaçu, Brasil) junto con las franquicias
        de su red en Paraguay. Los datos de la entidad local (razón social y RUC) se
        publicarán en esta página al completarse su registro.
      </p>
      <p>
        Al navegar en la Plataforma, crear una cuenta o realizar un pedido, aceptás
        estos Términos y Condiciones. Si no estás de acuerdo con alguna parte, no
        utilices la Plataforma.
      </p>

      <h2>2. Naturaleza del marketplace</h2>
      <p>
        Cada producto publicado en Shoppy es vendido por una <strong>franquicia
        vendedora</strong> de la red Mira, identificada en la ficha del producto
        («Vendido por»). El contrato de compraventa se celebra entre vos y la
        franquicia vendedora; la Plataforma organiza la vitrina, el carrito, el
        pedido y la comunicación, y la matriz de la red garantiza el estándar de
        atención.
      </p>

      <h2>3. Cuenta y registro</h2>
      <ul>
        <li>Podés comprar como invitado o con una cuenta (e-mail y contraseña, o acceso con Google).</li>
        <li>Debés ser mayor de 18 años y proporcionar datos verdaderos, completos y actualizados.</li>
        <li>Sos responsable de la confidencialidad de tu contraseña y de la actividad realizada con tu cuenta.</li>
        <li>Podemos suspender cuentas utilizadas de forma fraudulenta o que violen estos Términos.</li>
      </ul>

      <h2>4. Precios y moneda</h2>
      <p>
        Todos los precios se expresan en <strong>guaraníes (Gs.)</strong> e incluyen
        los impuestos aplicables, salvo indicación expresa en contrario. Los precios
        promocionales («antes/ahora») indican el precio anterior real del producto.
        Nos reservamos el derecho de cancelar pedidos generados sobre errores
        manifiestos de precio o de stock, con reintegro total de lo abonado.
      </p>

      <h2>5. Pedidos y reserva de stock</h2>
      <p>
        Al confirmar el pedido, el stock queda <strong>reservado</strong> a tu favor
        durante el plazo indicado en el checkout. Si el pago no se acredita dentro de
        ese plazo, el pedido expira automáticamente y el stock vuelve a estar
        disponible, sin costo para vos.
      </p>

      <h2>6. Pagos</h2>
      <p>
        Los medios de pago habilitados se muestran en el checkout al momento de la
        compra. El pedido se procesa recién con la <strong>confirmación del pago</strong>,
        que te informamos por e-mail. Ningún integrante de la red te pedirá tu
        contraseña ni datos completos de tarjeta por WhatsApp o teléfono.
      </p>

      <h2>7. Cupones de descuento</h2>
      <ul>
        <li>Se admite <strong>un cupón por pedido</strong>, aplicado sobre los productos alcanzados por sus condiciones.</li>
        <li>Cada cupón puede tener validez, alcance (productos o categorías), monto mínimo de compra, límite de usos y límite por persona.</li>
        <li>Los cupones no son canjeables por dinero ni acumulables con otros cupones.</li>
      </ul>

      <h2>8. Envíos y retiro</h2>
      <ul>
        <li>Los envíos se realizan por transportadora (AEX) desde la ciudad de la franquicia vendedora, a todo el Paraguay.</li>
        <li>El costo del envío se calcula en el checkout según la ciudad de destino y el peso del paquete. Pedidos de más de 30 kg se cotizan por consulta.</li>
        <li>Cuando la franquicia vendedora lo habilita, podés optar por el <strong>retiro gratis</strong> en su local.</li>
        <li>La franquicia vendedora despacha el pedido dentro de los 3 (tres) días hábiles siguientes a la confirmación del pago. El plazo de entrega de la transportadora depende de la ciudad de destino.</li>
      </ul>

      <h2>9. Cambios y devoluciones</h2>
      <p>
        Tenés derecho a retractarte de la compra dentro de los 7 (siete) días
        corridos desde la recepción del producto, conforme a la Ley N° 1334/98 de
        Defensa del Consumidor. Las condiciones y el procedimiento están en la{' '}
        <Link href="/cambios-y-devoluciones">Política de Cambios y Devoluciones</Link>.
      </p>

      <h2>10. Reseñas</h2>
      <ul>
        <li>Las reseñas con el sello «compra verificada» corresponden a compradores con un pedido pagado del producto.</li>
        <li>No se permiten reseñas falsas, ofensivas, con datos personales de terceros o ajenas al producto. Podemos moderar o remover el contenido que viole estas reglas.</li>
      </ul>

      <h2>11. Propiedad intelectual</h2>
      <p>
        Las marcas, logos, textos e imágenes de la Plataforma pertenecen a la red
        Mira o a sus licenciantes. Las fotos y descripciones de los productos son
        responsabilidad de la franquicia vendedora. No está permitido reproducir el
        contenido de la Plataforma con fines comerciales sin autorización.
      </p>

      <h2>12. Responsabilidad</h2>
      <p>
        La franquicia vendedora responde por el producto vendido (estado, garantía y
        entrega en el plazo de despacho). La Plataforma responde por el
        funcionamiento del sitio, la exactitud del pedido registrado y la gestión del
        pago según el medio habilitado. Nada en estos Términos limita los derechos
        que te reconoce la Ley N° 1334/98, que son irrenunciables.
      </p>

      <h2>13. Ley aplicable y contacto</h2>
      <p>
        Estos Términos se rigen por las leyes de la República del Paraguay,
        especialmente la Ley N° 1334/98 de Defensa del Consumidor y del Usuario.
      </p>
      <ul>
        <ContatoWhatsApp texto="Atención por WhatsApp" />
        <li>
          Preguntas frecuentes: <Link href="/faq">Shoppy — FAQ</Link>
        </li>
        <li>
          Sobre la red de franquicias:{' '}
          <a href="https://mirafranquicia.com" target="_blank" rel="noopener noreferrer">
            mirafranquicia.com
          </a>
        </li>
      </ul>

      <LegalVerTambem
        rotulo="Ver también"
        links={[
          { href: '/privacidad', texto: 'Política de Privacidad' },
          { href: '/cambios-y-devoluciones', texto: 'Cambios y Devoluciones' },
          { href: '/faq', texto: 'Preguntas frecuentes' },
        ]}
      />
    </LegalArticle>
  )
}

function TermosPt() {
  return (
    <LegalArticle
      titulo="Termos e Condições"
      atualizado="Última atualização: 18 de agosto de 2026"
    >
      <h2>1. Quem somos e aceitação</h2>
      <p>
        A Shoppy (a «Plataforma») é o marketplace da rede de franquias Mira, operado
        pela Mira Marketing (Foz do Iguaçu, Brasil) junto com as franquias da sua
        rede no Paraguai. Os dados da entidade local (razão social e RUC) serão
        publicados nesta página quando o registro for concluído.
      </p>
      <p>
        Ao navegar na Plataforma, criar uma conta ou fazer um pedido, você aceita
        estes Termos e Condições. Se não concordar com alguma parte, não utilize a
        Plataforma.
      </p>

      <h2>2. Natureza do marketplace</h2>
      <p>
        Cada produto publicado na Shoppy é vendido por uma <strong>franquia
        vendedora</strong> da rede Mira, identificada na página do produto («Vendido
        por»). O contrato de compra e venda é celebrado entre você e a franquia
        vendedora; a Plataforma organiza a vitrine, o carrinho, o pedido e a
        comunicação, e a matriz da rede garante o padrão de atendimento.
      </p>

      <h2>3. Conta e cadastro</h2>
      <ul>
        <li>Você pode comprar como convidado ou com uma conta (e-mail e senha, ou acesso com Google).</li>
        <li>É preciso ser maior de 18 anos e fornecer dados verdadeiros, completos e atualizados.</li>
        <li>Você é responsável pela confidencialidade da sua senha e pela atividade realizada com a sua conta.</li>
        <li>Podemos suspender contas usadas de forma fraudulenta ou que violem estes Termos.</li>
      </ul>

      <h2>4. Preços e moeda</h2>
      <p>
        Todos os preços são expressos em <strong>guaranis (Gs.)</strong> e incluem os
        impostos aplicáveis, salvo indicação expressa em contrário. Preços
        promocionais («de/por») indicam o preço anterior real do produto.
        Reservamo-nos o direito de cancelar pedidos gerados sobre erros manifestos de
        preço ou de estoque, com reembolso total do valor pago.
      </p>

      <h2>5. Pedidos e reserva de estoque</h2>
      <p>
        Ao confirmar o pedido, o estoque fica <strong>reservado</strong> para você
        durante o prazo indicado no checkout. Se o pagamento não for confirmado
        dentro desse prazo, o pedido expira automaticamente e o estoque volta a ficar
        disponível, sem custo para você.
      </p>

      <h2>6. Pagamentos</h2>
      <p>
        Os meios de pagamento habilitados são mostrados no checkout no momento da
        compra. O pedido é processado apenas com a <strong>confirmação do
        pagamento</strong>, informada por e-mail. Ninguém da rede vai pedir sua senha
        nem dados completos de cartão por WhatsApp ou telefone.
      </p>

      <h2>7. Cupons de desconto</h2>
      <ul>
        <li>É aceito <strong>um cupom por pedido</strong>, aplicado sobre os produtos alcançados pelas suas condições.</li>
        <li>Cada cupom pode ter validade, alcance (produtos ou categorias), valor mínimo de compra, limite de usos e limite por pessoa.</li>
        <li>Cupons não são conversíveis em dinheiro nem cumulativos com outros cupons.</li>
      </ul>

      <h2>8. Envios e retirada</h2>
      <ul>
        <li>Os envios são feitos por transportadora (AEX) a partir da cidade da franquia vendedora, para todo o Paraguai.</li>
        <li>O custo do frete é calculado no checkout conforme a cidade de destino e o peso do pacote. Pedidos com mais de 30 kg são cotados sob consulta.</li>
        <li>Quando a franquia vendedora habilita, você pode optar pela <strong>retirada grátis</strong> no local dela.</li>
        <li>A franquia vendedora despacha o pedido em até 3 (três) dias úteis após a confirmação do pagamento. O prazo de entrega da transportadora depende da cidade de destino.</li>
      </ul>

      <h2>9. Trocas e devoluções</h2>
      <p>
        Você tem direito de se arrepender da compra em até 7 (sete) dias corridos a
        partir do recebimento do produto, conforme a Lei N° 1334/98 de Defesa do
        Consumidor (Paraguai). As condições e o procedimento estão na{' '}
        <Link href="/cambios-y-devoluciones">Política de Trocas e Devoluções</Link>.
      </p>

      <h2>10. Avaliações</h2>
      <ul>
        <li>Avaliações com o selo «compra verificada» são de compradores com pedido pago do produto.</li>
        <li>Não são permitidas avaliações falsas, ofensivas, com dados pessoais de terceiros ou sem relação com o produto. Podemos moderar ou remover conteúdo que viole essas regras.</li>
      </ul>

      <h2>11. Propriedade intelectual</h2>
      <p>
        As marcas, logos, textos e imagens da Plataforma pertencem à rede Mira ou a
        seus licenciantes. As fotos e descrições dos produtos são de responsabilidade
        da franquia vendedora. Não é permitido reproduzir o conteúdo da Plataforma
        com fins comerciais sem autorização.
      </p>

      <h2>12. Responsabilidade</h2>
      <p>
        A franquia vendedora responde pelo produto vendido (estado, garantia e
        despacho no prazo). A Plataforma responde pelo funcionamento do site, pela
        exatidão do pedido registrado e pela gestão do pagamento conforme o meio
        habilitado. Nada nestes Termos limita os direitos que a Lei N° 1334/98
        reconhece ao consumidor, que são irrenunciáveis.
      </p>

      <h2>13. Lei aplicável e contato</h2>
      <p>
        Estes Termos são regidos pelas leis da República do Paraguai, especialmente a
        Lei N° 1334/98 de Defesa do Consumidor e do Usuário.
      </p>
      <ul>
        <ContatoWhatsApp texto="Atendimento por WhatsApp" />
        <li>
          Perguntas frequentes: <Link href="/faq">Shoppy — FAQ</Link>
        </li>
        <li>
          Sobre a rede de franquias:{' '}
          <a href="https://mirafranquicia.com" target="_blank" rel="noopener noreferrer">
            mirafranquicia.com
          </a>
        </li>
      </ul>

      <LegalVerTambem
        rotulo="Veja também"
        links={[
          { href: '/privacidad', texto: 'Política de Privacidade' },
          { href: '/cambios-y-devoluciones', texto: 'Trocas e Devoluções' },
          { href: '/faq', texto: 'Perguntas frequentes' },
        ]}
      />
    </LegalArticle>
  )
}
