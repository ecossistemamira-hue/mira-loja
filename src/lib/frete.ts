// Entrega da loja — 100% Paraguai, preços SÓ em guarani (moeda oficial; o
// user decidiu 2026-07-08 vender numa moeda única). Sem CEP (não se usa por
// lá): o comprador escolhe a ZONA e cada zona tem a forma de entrega que o
// mercado paraguaio já pratica:
//   - cde:      delivery próprio (moto) em Ciudad del Este e Alto Paraná
//   - asuncion: courier (tipo AEX) pra Asunción e Gran Asunción
//   - interior: encomienda — retira na terminal de ônibus mais próxima
// Peso taxável = max(peso real, peso cubado A×L×C/6000), mínimo 1 kg.
// Envio grátis acima do teto.

export type ZonaEntrega = 'cde' | 'asuncion' | 'interior'
export const ZONAS_ENTREGA: ZonaEntrega[] = ['cde', 'asuncion', 'interior']

/** Forma de entrega usada em cada zona. */
export type ServicoEntrega = 'delivery' | 'courier' | 'encomienda'

export const SERVICO_DA_ZONA: Record<ZonaEntrega, ServicoEntrega> = {
  cde: 'delivery',
  asuncion: 'courier',
  interior: 'encomienda',
}

export type OpcaoFrete = {
  zona: ZonaEntrega
  servico: ServicoEntrega
  valor: number
  prazoDias: { min: number; max: number }
  gratis: boolean
}

export type ItemFrete = {
  pesoGramas: number | null
  alturaCm: number | null
  larguraCm: number | null
  comprimentoCm: number | null
  quantidade: number
}

// Peso assumido quando o produto não tem peso cadastrado.
const PESO_PADRAO_GRAMAS = 500

// Envio grátis a partir deste subtotal (Gs.).
export const FRETE_GRATIS_MINIMO = 700_000

// base + porKg (peso taxável arredondado pra cima), em guarani.
const TABELA: Record<ZonaEntrega, { base: number; porKg: number }> = {
  cde: { base: 20_000, porKg: 2_000 },
  asuncion: { base: 40_000, porKg: 4_000 },
  interior: { base: 35_000, porKg: 3_000 },
}

const PRAZOS: Record<ZonaEntrega, { min: number; max: number }> = {
  cde: { min: 1, max: 1 }, // delivery no dia/24h
  asuncion: { min: 1, max: 3 },
  interior: { min: 2, max: 5 },
}

/** Peso taxável em kg (inteiro, mínimo 1): max(real, cubado A×L×C/6000). */
export function pesoTaxavelKg(itens: ItemFrete[]): number {
  let gramas = 0
  for (const it of itens) {
    const real = it.pesoGramas ?? PESO_PADRAO_GRAMAS
    const cubado =
      it.alturaCm != null && it.larguraCm != null && it.comprimentoCm != null
        ? ((Number(it.alturaCm) * Number(it.larguraCm) * Number(it.comprimentoCm)) /
            6000) *
          1000
        : 0
    gramas += Math.max(real, cubado) * it.quantidade
  }
  return Math.max(1, Math.ceil(gramas / 1000))
}

/** Frete de UMA zona, em guarani. `subtotal` decide o envio grátis. */
export function calcularFrete(params: {
  zona: ZonaEntrega
  itens: ItemFrete[]
  subtotal: number
}): OpcaoFrete {
  const { base, porKg } = TABELA[params.zona]
  const kg = pesoTaxavelKg(params.itens)
  const valor = base + porKg * kg
  const gratis = params.subtotal >= FRETE_GRATIS_MINIMO

  return {
    zona: params.zona,
    servico: SERVICO_DA_ZONA[params.zona],
    valor: gratis ? 0 : valor,
    prazoDias: PRAZOS[params.zona],
    gratis,
  }
}

/** Frete das 3 zonas de uma vez (tabela da página do produto). */
export function cotarTodasZonas(params: {
  itens: ItemFrete[]
  subtotal: number
}): OpcaoFrete[] {
  return ZONAS_ENTREGA.map((zona) => calcularFrete({ ...params, zona }))
}
