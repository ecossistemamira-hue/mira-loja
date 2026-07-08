// Cálculo de frete da loja. Tabela própria por zona (origem: Ciudad del
// Este/Foz do Iguaçu — fronteira PR) até integrar gateway real (Melhor Envio,
// Fase 3). Regras:
//   - Zona sai do CEP: PY nacional, BR por região (1º dígito do CEP).
//   - Peso taxável = max(peso real, peso cubado A×L×C/6000), mínimo 1 kg.
//   - Serviços: econômico e expresso (mais caro, prazo menor).
//   - Frete grátis no econômico acima do teto por moeda.
// Sem conversão de câmbio: cada moeda tem a própria tabela.

export type MoedaFrete = 'BRL' | 'PYG'
export type ServicoFrete = 'economico' | 'expresso'

export type ZonaFrete = 'py' | 'br_sul' | 'br_sudeste' | 'br_centro' | 'br_norte_ne'

export type OpcaoFrete = {
  servico: ServicoFrete
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

// Econômico grátis a partir deste subtotal (por moeda).
export const FRETE_GRATIS_MINIMO: Record<MoedaFrete, number> = {
  BRL: 500,
  PYG: 700_000,
}

// base + porKg (peso taxável arredondado pra cima), por zona e moeda.
const TABELA: Record<
  MoedaFrete,
  Record<ZonaFrete, { base: number; porKg: number }>
> = {
  BRL: {
    py: { base: 25, porKg: 5 },
    br_sul: { base: 20, porKg: 6 },
    br_sudeste: { base: 28, porKg: 8 },
    br_centro: { base: 32, porKg: 9 },
    br_norte_ne: { base: 38, porKg: 11 },
  },
  PYG: {
    py: { base: 35_000, porKg: 7_000 },
    br_sul: { base: 28_000, porKg: 8_500 },
    br_sudeste: { base: 40_000, porKg: 11_000 },
    br_centro: { base: 45_000, porKg: 13_000 },
    br_norte_ne: { base: 55_000, porKg: 16_000 },
  },
}

const PRAZOS: Record<ZonaFrete, Record<ServicoFrete, { min: number; max: number }>> = {
  py: { economico: { min: 1, max: 3 }, expresso: { min: 1, max: 1 } },
  br_sul: { economico: { min: 3, max: 6 }, expresso: { min: 2, max: 3 } },
  br_sudeste: { economico: { min: 5, max: 9 }, expresso: { min: 3, max: 5 } },
  br_centro: { economico: { min: 6, max: 10 }, expresso: { min: 4, max: 6 } },
  br_norte_ne: { economico: { min: 8, max: 14 }, expresso: { min: 5, max: 8 } },
}

const MULTIPLICADOR_EXPRESSO = 1.6

/**
 * Detecta a zona de entrega pelo código postal digitado.
 * BR: 8 dígitos (com ou sem hífen), zona pelo 1º dígito.
 * PY: 4 a 6 dígitos (código postal paraguaio).
 * Retorna null pra entrada que não parece CEP nenhum.
 */
export function detectarZona(cepBruto: string): ZonaFrete | null {
  const cep = cepBruto.replace(/\D/g, '')
  if (cep.length === 8) {
    const d = cep[0]
    if (d === '8' || d === '9') return 'br_sul'
    if (d === '0' || d === '1' || d === '2' || d === '3') return 'br_sudeste'
    if (d === '7') return 'br_centro'
    return 'br_norte_ne' // 4, 5, 6
  }
  if (cep.length >= 4 && cep.length <= 6) return 'py'
  return null
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

/**
 * Opções de frete pra um destino. `subtotal` decide o frete grátis do
 * econômico. Retorna null se o código postal não for reconhecido.
 */
export function calcularFrete(params: {
  cep: string
  itens: ItemFrete[]
  moeda: MoedaFrete
  subtotal: number
}): OpcaoFrete[] | null {
  const zona = detectarZona(params.cep)
  if (!zona) return null

  const { base, porKg } = TABELA[params.moeda][zona]
  const kg = pesoTaxavelKg(params.itens)
  const economico = base + porKg * kg
  const expresso = Math.round(economico * MULTIPLICADOR_EXPRESSO)
  const gratis = params.subtotal >= FRETE_GRATIS_MINIMO[params.moeda]

  return [
    {
      servico: 'economico',
      valor: gratis ? 0 : economico,
      prazoDias: PRAZOS[zona].economico,
      gratis,
    },
    {
      servico: 'expresso',
      valor: expresso,
      prazoDias: PRAZOS[zona].expresso,
      gratis: false,
    },
  ]
}
