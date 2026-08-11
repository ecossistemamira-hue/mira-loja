import 'server-only'

import { createServiceClient } from '@/lib/supabase'
import { calcularDescontoCupom, type CupomInfo } from '@/lib/cupom-calculo'
import type { GrupoCarrinho } from '@/lib/types'

export type ErroCupom =
  | 'nao_encontrado'
  | 'fora_validade'
  | 'esgotado'
  | 'nao_aplicavel'
  | 'minimo_nao_atingido'
  | 'limite_pessoa'

export type CupomAplicado = {
  cupomId: string
  codigo: string
  /** Desconto (Gs.) por franquia do carrinho — vira `pedidos.desconto`. */
  descontoPorFranquia: Record<string, number>
  descontoTotal: number
}

export type ResultadoCupom =
  | { ok: true; cupom: CupomAplicado }
  | { ok: false; error: ErroCupom; faltam?: number }

type CupomRow = CupomInfo & {
  id: string
  codigo: string
  valido_de: string | null
  valido_ate: string | null
  limite_usos: number | null
  usos: number
  limite_por_pessoa: number | null
}

const COLUNAS_CUPOM =
  'id, codigo, franquia_id, tipo, valor, moeda, valido_de, valido_ate, ' +
  'limite_usos, usos, escopo_itens, categorias, valor_minimo, ' +
  'limite_por_pessoa, vale_em_promocao'

/** Só caracteres de código válidos — evita curinga de LIKE na busca. */
function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

export function normalizarEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

/**
 * "Hoje" no fuso de Assunção (YYYY-MM-DD). Usar UTC fazia o cupom morrer ~3h
 * antes da meia-noite paraguaia (migration 0104 corrigiu o mesmo no banco).
 */
function hojeEmAssuncion(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Valida um cupom contra o carrinho atual e calcula o desconto por franquia.
 *
 * Leitura com SERVICE ROLE (0104): a policy anon `cupons_publico` foi removida
 * porque permitia LISTAR todos os cupons ativos com a chave pública da loja.
 * O código do cupom volta a ser o segredo — quem não sabe, não descobre.
 *
 * O CONSUMO do uso é atômico e fica no checkout (RPC `consumir_cupom`); aqui é
 * só a prévia/validação.
 */
export async function validarCupomParaCarrinho(
  codigo: string,
  grupos: GrupoCarrinho[],
  email?: string | null,
): Promise<ResultadoCupom> {
  const cod = normalizarCodigo(codigo)
  if (!cod) return { ok: false, error: 'nao_encontrado' }

  const supabase = createServiceClient()
  // ilike sem curinga = igualdade case-insensitive (código já sanitizado).
  // Service role ignora RLS, então filtra ativo/deleted_at explicitamente.
  const { data, error } = await supabase
    .from('cupons')
    .select(COLUNAS_CUPOM)
    .ilike('codigo', cod)
    .eq('ativo', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[loja.validarCupom]', error)
    return { ok: false, error: 'nao_encontrado' }
  }

  const cupom = data as unknown as CupomRow

  // Janela de validade (datas são DATE; compara com o dia em Assunção).
  const hoje = hojeEmAssuncion()
  if (
    (cupom.valido_de && hoje < cupom.valido_de) ||
    (cupom.valido_ate && hoje > cupom.valido_ate)
  ) {
    return { ok: false, error: 'fora_validade' }
  }

  if (cupom.limite_usos != null && cupom.usos >= cupom.limite_usos) {
    return { ok: false, error: 'esgotado' }
  }

  // Limite por pessoa: prévia pelo e-mail digitado (a checagem que vale é a do
  // `consumir_cupom`, atômica, no momento de fechar o pedido).
  const emailNorm = normalizarEmail(email)
  if (cupom.limite_por_pessoa != null && emailNorm) {
    const { count, error: errUsos } = await supabase
      .from('cupom_usos')
      .select('id', { count: 'exact', head: true })
      .eq('cupom_id', cupom.id)
      .eq('email', emailNorm)
    if (!errUsos && (count ?? 0) >= cupom.limite_por_pessoa) {
      return { ok: false, error: 'limite_pessoa' }
    }
  }

  // Escopo por produto: carrega a lista de produtos cobertos.
  let produtosElegiveis = new Set<string>()
  if (cupom.escopo_itens === 'produtos') {
    const { data: vinculos, error: errProd } = await supabase
      .from('cupom_produtos')
      .select('produto_id')
      .eq('cupom_id', cupom.id)
    if (errProd) {
      console.error('[loja.validarCupom.produtos]', errProd)
      return { ok: false, error: 'nao_aplicavel' }
    }
    produtosElegiveis = new Set((vinculos ?? []).map((v) => v.produto_id))
  }

  const calculo = calcularDescontoCupom(cupom, grupos, produtosElegiveis)
  if (!calculo.ok) {
    return { ok: false, error: calculo.motivo, faltam: calculo.faltam }
  }

  const descontoTotal = Object.values(calculo.descontoPorFranquia).reduce(
    (s, v) => s + v,
    0,
  )
  if (descontoTotal <= 0) return { ok: false, error: 'nao_aplicavel' }

  return {
    ok: true,
    cupom: {
      cupomId: cupom.id,
      codigo: cupom.codigo,
      descontoPorFranquia: calculo.descontoPorFranquia,
      descontoTotal,
    },
  }
}
