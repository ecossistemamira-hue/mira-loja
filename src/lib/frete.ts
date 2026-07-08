// Frete da loja: cotação REAL pela tabela oficial da AEX (courier líder do
// Paraguai, representante FedEx), origem Ciudad del Este. O comprador escolhe
// a CIDADE de destino — é assim que o próprio cotizador da AEX funciona (lá
// não se usa CEP). Dados em `frete-aex-tabela.ts` (fonte + data lá).
// Preços em guarani; pedidos sempre PYG.

// Import relativo de propósito: o vitest não resolve o alias @/.
import { CIDADES_AEX, type CidadeAex } from './frete-aex-tabela'

export { CIDADES_AEX, type CidadeAex }

/** Faixas de peso ("cajas") da AEX, em kg. Acima da última = sob consulta. */
export const CAIXAS_KG = [3, 10, 20, 30] as const

export type ItemFrete = {
  pesoGramas: number | null
  alturaCm: number | null
  larguraCm: number | null
  comprimentoCm: number | null
  quantidade: number
}

export type CotacaoFrete =
  | {
      ok: true
      cidade: CidadeAex
      valor: number
      /** Índice da caixa (0-3) usada na cotação. */
      caixa: number
      pesoKg: number
    }
  | { ok: false; error: 'cidade_invalida' | 'peso_excede' }

// Peso assumido quando o produto não tem peso cadastrado.
const PESO_PADRAO_GRAMAS = 500

/** Peso taxável em kg: max(peso real, peso cubado A×L×C/6000) somado. */
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
  return Math.max(0.1, gramas / 1000)
}

/** Índice da caixa AEX pro peso, ou null se passa de 30 kg (sob consulta). */
export function caixaDoPeso(pesoKg: number): number | null {
  const i = CAIXAS_KG.findIndex((max) => pesoKg <= max)
  return i === -1 ? null : i
}

export function obterCidade(cidadeId: number): CidadeAex | null {
  return CIDADES_AEX.find((c) => c.id === cidadeId) ?? null
}

/** Cotação AEX: cidade de destino + itens → preço real da tabela. */
export function cotarFrete(cidadeId: number, itens: ItemFrete[]): CotacaoFrete {
  const cidade = obterCidade(cidadeId)
  if (!cidade) return { ok: false, error: 'cidade_invalida' }

  const pesoKg = pesoTaxavelKg(itens)
  const caixa = caixaDoPeso(pesoKg)
  if (caixa == null) return { ok: false, error: 'peso_excede' }

  return { ok: true, cidade, valor: cidade.precos[caixa], caixa, pesoKg }
}

/** Cidades agrupadas por departamento (pros selects), em ordem alfabética. */
export function cidadesPorDepartamento(): {
  departamento: string
  cidades: CidadeAex[]
}[] {
  const grupos = new Map<string, CidadeAex[]>()
  for (const c of CIDADES_AEX) {
    const lista = grupos.get(c.departamento) ?? []
    lista.push(c)
    grupos.set(c.departamento, lista)
  }
  return [...grupos.entries()].map(([departamento, cidades]) => ({
    departamento,
    cidades,
  }))
}
