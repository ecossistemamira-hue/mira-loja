import 'server-only'

import { createLojaClient } from '@/lib/supabase'
import { calcularDescontoCupom, type CupomInfo } from '@/lib/cupom-calculo'
import type { GrupoCarrinho } from '@/lib/types'

export type ErroCupom =
  | 'nao_encontrado'
  | 'fora_validade'
  | 'esgotado'
  | 'nao_aplicavel'

export type CupomAplicado = {
  cupomId: string
  codigo: string
  /** Desconto (Gs.) por franquia do carrinho — vira `pedidos.desconto`. */
  descontoPorFranquia: Record<string, number>
  descontoTotal: number
}

export type ResultadoCupom =
  | { ok: true; cupom: CupomAplicado }
  | { ok: false; error: ErroCupom }

type CupomRow = CupomInfo & {
  id: string
  codigo: string
  valido_de: string | null
  valido_ate: string | null
  limite_usos: number | null
  usos: number
}

/** Só caracteres de código válidos — evita curinga de LIKE na busca. */
function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

/**
 * Valida um cupom contra o carrinho atual e calcula o desconto por franquia.
 * Leitura via anon (policy `cupons_publico` só expõe ativos e não-deletados);
 * o CONSUMO do uso é atômico e fica no checkout (RPC `usar_cupom`, service
 * role) — aqui é só a prévia/validação.
 */
export async function validarCupomParaCarrinho(
  codigo: string,
  grupos: GrupoCarrinho[],
): Promise<ResultadoCupom> {
  const cod = normalizarCodigo(codigo)
  if (!cod) return { ok: false, error: 'nao_encontrado' }

  const supabase = createLojaClient()
  // ilike sem curinga = igualdade case-insensitive (código já sanitizado).
  const { data, error } = await supabase
    .from('cupons')
    .select(
      'id, codigo, franquia_id, tipo, valor, moeda, valido_de, valido_ate, limite_usos, usos',
    )
    .ilike('codigo', cod)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[loja.validarCupom]', error)
    return { ok: false, error: 'nao_encontrado' }
  }

  const cupom = data as CupomRow

  // Janela de validade (datas são DATE; compara com o dia de hoje).
  const hoje = new Date().toISOString().slice(0, 10)
  if (
    (cupom.valido_de && hoje < cupom.valido_de) ||
    (cupom.valido_ate && hoje > cupom.valido_ate)
  ) {
    return { ok: false, error: 'fora_validade' }
  }

  if (cupom.limite_usos != null && cupom.usos >= cupom.limite_usos) {
    return { ok: false, error: 'esgotado' }
  }

  const descontoPorFranquia = calcularDescontoCupom(cupom, grupos)
  if (!descontoPorFranquia) return { ok: false, error: 'nao_aplicavel' }

  const descontoTotal = Object.values(descontoPorFranquia).reduce(
    (s, v) => s + v,
    0,
  )
  if (descontoTotal <= 0) return { ok: false, error: 'nao_aplicavel' }

  return {
    ok: true,
    cupom: {
      cupomId: cupom.id,
      codigo: cupom.codigo,
      descontoPorFranquia,
      descontoTotal,
    },
  }
}
