import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { LegalArticle, LegalVerTambem } from '@/components/legal-article'
import { Link } from '@/i18n/navigation'

export const revalidate = 3600

type Props = { params: Promise<{ locale: string }> }

// Conteúdo legal em TSX por idioma (padrão do Creators). RASCUNHO para revisão
// jurídica — reflete o tratamento REAL de dados da loja hoje (checkout,
// conta, newsletter, aviso de estoque, cookies técnicos, localStorage).

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? ''

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'pt-BR' ? 'Política de Privacidade' : 'Política de Privacidad',
  }
}

export default async function PrivacidadPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return locale === 'pt-BR' ? <PrivacidadePt /> : <PrivacidadEs />
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

function PrivacidadEs() {
  return (
    <LegalArticle
      titulo="Política de Privacidad"
      atualizado="Última actualización: 18 de agosto de 2026"
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        Shoppy es operado por Mira Marketing (Foz do Iguaçu, Brasil) junto con las
        franquicias de la red Mira en Paraguay. La franquicia vendedora de tu pedido
        accede a los datos necesarios para prepararlo y despacharlo. Los datos de la
        entidad local (razón social y RUC) se publicarán en esta página al
        completarse su registro.
      </p>

      <h2>2. Qué datos recolectamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre, e-mail y contraseña (guardada cifrada). Si elegís el acceso con Google, recibimos tu nombre y e-mail de Google.</li>
        <li><strong>Pedido:</strong> nombre, e-mail y — si los informás — teléfono y documento (CI/RUC); para envíos, la dirección de entrega y la ciudad de destino.</li>
        <li><strong>Reseñas:</strong> la calificación, el texto y el nombre de exhibición que elijas mostrar.</li>
        <li><strong>Newsletter y avisos de stock:</strong> tu e-mail, solo si te suscribís o pedís el aviso.</li>
        <li><strong>Rastreo de pedido:</strong> el código del pedido y el e-mail del comprador, usados juntos como credencial de consulta.</li>
      </ul>

      <h2>3. Cookies y datos en tu navegador</h2>
      <ul>
        <li><strong>Cookies técnicas:</strong> el contenido del carrito, tu idioma preferido y — si iniciás sesión — la sesión de tu cuenta. No usamos cookies de publicidad de terceros.</li>
        <li><strong>Solo en tu navegador:</strong> tus favoritos y los productos vistos recientemente se guardan en el almacenamiento local de tu dispositivo y no se envían a nuestros servidores.</li>
      </ul>

      <h2>4. Para qué usamos los datos</h2>
      <ul>
        <li>Procesar tu pedido, calcular el envío y coordinar la entrega o el retiro.</li>
        <li>Enviarte e-mails transaccionales (pedido recibido, pago confirmado) y los avisos que pediste (vuelta de stock, newsletter).</li>
        <li>Atender consultas, prevenir fraude y mejorar la tienda.</li>
      </ul>
      <p>No vendemos ni alquilamos tus datos personales.</p>

      <h2>5. Con quién compartimos</h2>
      <ul>
        <li><strong>Franquicia vendedora:</strong> los datos del pedido que le corresponde preparar.</li>
        <li><strong>Transportadora (AEX):</strong> nombre, dirección y teléfono, para la entrega.</li>
        <li><strong>Procesador de pago:</strong> cuando el pago en línea esté habilitado, el procesador recibe los datos necesarios para cobrar; nosotros no almacenamos números de tarjeta.</li>
        <li><strong>Proveedores de infraestructura:</strong> Supabase (base de datos y autenticación), Vercel (hosting) y Resend (envío de e-mails), que tratan los datos por cuenta nuestra.</li>
        <li><strong>Google:</strong> solo si elegís iniciar sesión con Google.</li>
      </ul>

      <h2>6. Conservación</h2>
      <p>
        Los datos de pedidos se conservan por los plazos exigidos por obligaciones
        contables y fiscales. Los datos de tu cuenta se conservan mientras la cuenta
        exista; podés pedir la baja en cualquier momento. Las suscripciones
        (newsletter, avisos) se eliminan cuando te dás de baja.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Conforme a la Ley N° 7593/2025 de Protección de Datos Personales (Paraguay)
        — y, en lo que aplique al operador, la LGPD brasileña — tenés derecho a
        acceder, rectificar, actualizar y suprimir tus datos personales, y a retirar
        tu consentimiento. Para ejercerlos, contactanos por los canales del punto 9.
      </p>

      <h2>8. Seguridad y menores</h2>
      <p>
        Los datos viajan cifrados (HTTPS), las contraseñas se guardan con hash y el
        acceso interno está segmentado por franquicia. La Plataforma no está dirigida
        a menores de 18 años.
      </p>

      <h2>9. Contacto</h2>
      <ul>
        <ContatoWhatsApp texto="Atención por WhatsApp" />
        <li>
          Preguntas frecuentes: <Link href="/faq">Shoppy — FAQ</Link>
        </li>
      </ul>
      <p>
        Podemos actualizar esta política; la fecha de la última actualización figura
        arriba. Los cambios relevantes se comunicarán en la Plataforma.
      </p>

      <LegalVerTambem
        rotulo="Ver también"
        links={[
          { href: '/terminos', texto: 'Términos y Condiciones' },
          { href: '/cambios-y-devoluciones', texto: 'Cambios y Devoluciones' },
          { href: '/faq', texto: 'Preguntas frecuentes' },
        ]}
      />
    </LegalArticle>
  )
}

function PrivacidadePt() {
  return (
    <LegalArticle
      titulo="Política de Privacidade"
      atualizado="Última atualização: 18 de agosto de 2026"
    >
      <h2>1. Responsável pelo tratamento</h2>
      <p>
        A Shoppy é operada pela Mira Marketing (Foz do Iguaçu, Brasil) junto com as
        franquias da rede Mira no Paraguai. A franquia vendedora do seu pedido acessa
        os dados necessários para prepará-lo e despachá-lo. Os dados da entidade
        local (razão social e RUC) serão publicados nesta página quando o registro
        for concluído.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome, e-mail e senha (guardada cifrada). Se você escolher o acesso com Google, recebemos seu nome e e-mail do Google.</li>
        <li><strong>Pedido:</strong> nome, e-mail e — se você informar — telefone e documento (CI/RUC); para envios, o endereço de entrega e a cidade de destino.</li>
        <li><strong>Avaliações:</strong> a nota, o texto e o nome de exibição que você escolher mostrar.</li>
        <li><strong>Newsletter e avisos de estoque:</strong> seu e-mail, apenas se você se inscrever ou pedir o aviso.</li>
        <li><strong>Rastreio de pedido:</strong> o código do pedido e o e-mail do comprador, usados juntos como credencial de consulta.</li>
      </ul>

      <h2>3. Cookies e dados no seu navegador</h2>
      <ul>
        <li><strong>Cookies técnicos:</strong> o conteúdo do carrinho, seu idioma preferido e — se você entrar — a sessão da sua conta. Não usamos cookies de publicidade de terceiros.</li>
        <li><strong>Somente no seu navegador:</strong> seus favoritos e os produtos vistos recentemente ficam no armazenamento local do seu dispositivo e não são enviados aos nossos servidores.</li>
      </ul>

      <h2>4. Para que usamos os dados</h2>
      <ul>
        <li>Processar seu pedido, calcular o frete e coordenar a entrega ou a retirada.</li>
        <li>Enviar e-mails transacionais (pedido recebido, pagamento confirmado) e os avisos que você pediu (volta ao estoque, newsletter).</li>
        <li>Atender consultas, prevenir fraude e melhorar a loja.</li>
      </ul>
      <p>Não vendemos nem alugamos seus dados pessoais.</p>

      <h2>5. Com quem compartilhamos</h2>
      <ul>
        <li><strong>Franquia vendedora:</strong> os dados do pedido que cabe a ela preparar.</li>
        <li><strong>Transportadora (AEX):</strong> nome, endereço e telefone, para a entrega.</li>
        <li><strong>Processador de pagamento:</strong> quando o pagamento on-line estiver habilitado, o processador recebe os dados necessários para a cobrança; nós não armazenamos números de cartão.</li>
        <li><strong>Provedores de infraestrutura:</strong> Supabase (banco de dados e autenticação), Vercel (hosting) e Resend (envio de e-mails), que tratam os dados por nossa conta.</li>
        <li><strong>Google:</strong> apenas se você escolher entrar com Google.</li>
      </ul>

      <h2>6. Conservação</h2>
      <p>
        Os dados de pedidos são conservados pelos prazos exigidos por obrigações
        contábeis e fiscais. Os dados da sua conta são mantidos enquanto a conta
        existir; você pode pedir a exclusão a qualquer momento. As inscrições
        (newsletter, avisos) são removidas quando você se descadastra.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        Conforme a Lei N° 7593/2025 de Proteção de Dados Pessoais (Paraguai) — e, no
        que se aplicar ao operador, a LGPD brasileira — você tem direito de acessar,
        retificar, atualizar e excluir seus dados pessoais, e de retirar seu
        consentimento. Para exercê-los, fale conosco pelos canais do ponto 9.
      </p>

      <h2>8. Segurança e menores</h2>
      <p>
        Os dados trafegam cifrados (HTTPS), as senhas são guardadas com hash e o
        acesso interno é segmentado por franquia. A Plataforma não é dirigida a
        menores de 18 anos.
      </p>

      <h2>9. Contato</h2>
      <ul>
        <ContatoWhatsApp texto="Atendimento por WhatsApp" />
        <li>
          Perguntas frequentes: <Link href="/faq">Shoppy — FAQ</Link>
        </li>
      </ul>
      <p>
        Podemos atualizar esta política; a data da última atualização aparece acima.
        Mudanças relevantes serão comunicadas na Plataforma.
      </p>

      <LegalVerTambem
        rotulo="Veja também"
        links={[
          { href: '/terminos', texto: 'Termos e Condições' },
          { href: '/cambios-y-devoluciones', texto: 'Trocas e Devoluções' },
          { href: '/faq', texto: 'Perguntas frequentes' },
        ]}
      />
    </LegalArticle>
  )
}
