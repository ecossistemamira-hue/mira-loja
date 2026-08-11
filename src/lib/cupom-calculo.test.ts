import { describe, expect, it } from 'vitest'

import { calcularDescontoCupom, type CupomInfo } from './cupom-calculo'
import type { GrupoCarrinho, ItemCarrinho } from './types'

function item(over: Partial<ItemCarrinho> = {}): ItemCarrinho {
  return {
    itemId: 'i1',
    produtoId: 'p1',
    franquiaId: 'f1',
    nome: 'Produto',
    slug: null,
    imagemUrl: null,
    categoria: null,
    precoPyg: 100_000,
    precoPromocionalPyg: null,
    disponivel: 10,
    quantidade: 1,
    pesoGramas: null,
    alturaCm: null,
    larguraCm: null,
    comprimentoCm: null,
    ...over,
  }
}

function grupo(franquiaId: string, itens: ItemCarrinho[]): GrupoCarrinho {
  return { franquia: null, itens: itens.map((i) => ({ ...i, franquiaId })) }
}

/** Açúcar: só o mapa de desconto (falha o teste se o cupom não colou). */
function descontos(
  cupom: CupomInfo,
  grupos: GrupoCarrinho[],
  elegiveis?: Set<string>,
): Record<string, number> {
  const r = calcularDescontoCupom(cupom, grupos, elegiveis)
  if (!r.ok) throw new Error(`esperava desconto, veio ${r.motivo}`)
  return r.descontoPorFranquia
}

describe('calcularDescontoCupom', () => {
  it('percentual da rede aplica em todos os grupos', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, quantidade: 2 })]), // 200k
      grupo('f2', [item({ precoPyg: 50_000 })]), // 50k
    ]
    expect(
      descontos(
        { franquia_id: null, tipo: 'percentual', valor: 10, moeda: null },
        grupos,
      ),
    ).toEqual({ f1: 20_000, f2: 5_000 })
  })

  it('percentual usa o preço promocional quando válido', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, precoPromocionalPyg: 80_000 })]),
    ]
    expect(
      descontos(
        { franquia_id: null, tipo: 'percentual', valor: 10, moeda: null },
        grupos,
      ),
    ).toEqual({ f1: 8_000 })
  })

  it('cupom de franquia só desconta no grupo dela', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000 })]),
      grupo('f2', [item({ precoPyg: 100_000 })]),
    ]
    expect(
      descontos(
        { franquia_id: 'f2', tipo: 'percentual', valor: 20, moeda: null },
        grupos,
      ),
    ).toEqual({ f2: 20_000 })
  })

  it('cupom de franquia fora do carrinho não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const r = calcularDescontoCupom(
      { franquia_id: 'f9', tipo: 'percentual', valor: 20, moeda: null },
      grupos,
    )
    expect(r).toEqual({ ok: false, motivo: 'nao_aplicavel' })
  })

  it('valor_fixo aplica uma vez, no grupo de maior subtotal', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 50_000 })]),
      grupo('f2', [item({ precoPyg: 300_000 })]),
    ]
    expect(
      descontos(
        { franquia_id: null, tipo: 'valor_fixo', valor: 30_000, moeda: 'PYG' },
        grupos,
      ),
    ).toEqual({ f2: 30_000 })
  })

  it('valor_fixo não passa do subtotal do grupo', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 20_000 })])]
    expect(
      descontos(
        { franquia_id: null, tipo: 'valor_fixo', valor: 50_000, moeda: 'PYG' },
        grupos,
      ),
    ).toEqual({ f1: 20_000 })
  })

  it('valor_fixo em moeda que não é guarani não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const r = calcularDescontoCupom(
      { franquia_id: null, tipo: 'valor_fixo', valor: 10, moeda: 'USD' },
      grupos,
    )
    expect(r).toEqual({ ok: false, motivo: 'nao_aplicavel' })
  })

  it('valor_fixo sem moeda declarada vale como guarani', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 100_000 })])]
    expect(
      descontos(
        { franquia_id: null, tipo: 'valor_fixo', valor: 25_000, moeda: null },
        grupos,
      ),
    ).toEqual({ f1: 25_000 })
  })

  it('percentual acima de 100 trava em 100', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 80_000 })])]
    expect(
      descontos(
        { franquia_id: null, tipo: 'percentual', valor: 150, moeda: null },
        grupos,
      ),
    ).toEqual({ f1: 80_000 })
  })

  it('valor zerado ou negativo não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    for (const valor of [0, -10]) {
      expect(
        calcularDescontoCupom(
          { franquia_id: null, tipo: 'percentual', valor, moeda: null },
          grupos,
        ),
      ).toEqual({ ok: false, motivo: 'nao_aplicavel' })
    }
  })

  it('tipo desconhecido não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const r = calcularDescontoCupom(
      { franquia_id: null, tipo: 'brinde', valor: 10, moeda: null },
      grupos,
    )
    expect(r).toEqual({ ok: false, motivo: 'nao_aplicavel' })
  })
})

// ── Escopo por produto/categoria, mínimo e promoção (migration 0104) ─────────

describe('escopo por produto', () => {
  const cupom: CupomInfo = {
    franquia_id: null,
    tipo: 'percentual',
    valor: 10,
    moeda: null,
    escopo_itens: 'produtos',
  }

  it('desconta só o subtotal dos produtos da lista', () => {
    const grupos = [
      grupo('f1', [
        item({ produtoId: 'p1', precoPyg: 100_000 }),
        item({ itemId: 'i2', produtoId: 'p2', precoPyg: 300_000 }),
      ]),
    ]
    // 10% de 100k (só p1), não de 400k.
    expect(descontos(cupom, grupos, new Set(['p1']))).toEqual({ f1: 10_000 })
  })

  it('não se aplica quando nenhum produto do carrinho está na lista', () => {
    const grupos = [grupo('f1', [item({ produtoId: 'p9' })])]
    const r = calcularDescontoCupom(cupom, grupos, new Set(['p1']))
    expect(r).toEqual({ ok: false, motivo: 'nao_aplicavel' })
  })

  it('lista vazia não vira desconto no carrinho todo', () => {
    const grupos = [grupo('f1', [item({ produtoId: 'p1' })])]
    const r = calcularDescontoCupom(cupom, grupos, new Set())
    expect(r).toEqual({ ok: false, motivo: 'nao_aplicavel' })
  })

  it('valor_fixo escolhe o grupo de maior subtotal ELEGÍVEL, não o maior', () => {
    const grupos = [
      grupo('f1', [item({ produtoId: 'p1', precoPyg: 100_000 })]),
      grupo('f2', [item({ itemId: 'i2', produtoId: 'p9', precoPyg: 900_000 })]),
    ]
    expect(
      descontos(
        { ...cupom, tipo: 'valor_fixo', valor: 30_000, moeda: 'PYG' },
        grupos,
        new Set(['p1']),
      ),
    ).toEqual({ f1: 30_000 })
  })
})

describe('escopo por categoria', () => {
  const cupom: CupomInfo = {
    franquia_id: null,
    tipo: 'percentual',
    valor: 20,
    moeda: null,
    escopo_itens: 'categorias',
    categorias: ['Perfumes'],
  }

  it('desconta só os itens da categoria', () => {
    const grupos = [
      grupo('f1', [
        item({ categoria: 'Perfumes', precoPyg: 200_000 }),
        item({ itemId: 'i2', categoria: 'Hogar', precoPyg: 500_000 }),
      ]),
    ]
    expect(descontos(cupom, grupos)).toEqual({ f1: 40_000 })
  })

  it('compara sem acento e sem caixa', () => {
    const grupos = [grupo('f1', [item({ categoria: 'electrónica' })])]
    expect(
      descontos({ ...cupom, categorias: ['Electronica'] }, grupos),
    ).toEqual({ f1: 20_000 })
  })

  it('aceita mais de uma categoria', () => {
    const grupos = [
      grupo('f1', [
        item({ categoria: 'Perfumes', precoPyg: 100_000 }),
        item({ itemId: 'i2', categoria: 'Hogar', precoPyg: 100_000 }),
        item({ itemId: 'i3', categoria: 'Tereré', precoPyg: 100_000 }),
      ]),
    ]
    expect(
      descontos({ ...cupom, categorias: ['Perfumes', 'Hogar'] }, grupos),
    ).toEqual({ f1: 40_000 })
  })

  it('item sem categoria não entra', () => {
    const grupos = [grupo('f1', [item({ categoria: null })])]
    expect(calcularDescontoCupom(cupom, grupos)).toEqual({
      ok: false,
      motivo: 'nao_aplicavel',
    })
  })

  it('cupom de categorias sem nenhuma categoria definida não desconta nada', () => {
    const grupos = [grupo('f1', [item({ categoria: 'Perfumes' })])]
    expect(calcularDescontoCupom({ ...cupom, categorias: [] }, grupos)).toEqual({
      ok: false,
      motivo: 'nao_aplicavel',
    })
  })
})

describe('valor mínimo de compra', () => {
  const cupom: CupomInfo = {
    franquia_id: null,
    tipo: 'valor_fixo',
    valor: 50_000,
    moeda: 'PYG',
    valor_minimo: 300_000,
  }

  it('barra abaixo do mínimo e diz quanto falta', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 250_000 })])]
    expect(calcularDescontoCupom(cupom, grupos)).toEqual({
      ok: false,
      motivo: 'minimo_nao_atingido',
      faltam: 50_000,
    })
  })

  it('libera no valor exato do mínimo', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 300_000 })])]
    expect(descontos(cupom, grupos)).toEqual({ f1: 50_000 })
  })

  it('soma os grupos do carrinho pra medir o mínimo', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 200_000 })]),
      grupo('f2', [item({ itemId: 'i2', precoPyg: 150_000 })]),
    ]
    expect(descontos(cupom, grupos)).toEqual({ f1: 50_000 })
  })

  it('mede o mínimo só com o que o cupom cobre', () => {
    // Carrinho tem 600k, mas só 100k é da categoria do cupom → não atinge 300k.
    const grupos = [
      grupo('f1', [
        item({ categoria: 'Perfumes', precoPyg: 100_000 }),
        item({ itemId: 'i2', categoria: 'Hogar', precoPyg: 500_000 }),
      ]),
    ]
    const r = calcularDescontoCupom(
      { ...cupom, escopo_itens: 'categorias', categorias: ['Perfumes'] },
      grupos,
    )
    expect(r).toEqual({
      ok: false,
      motivo: 'minimo_nao_atingido',
      faltam: 200_000,
    })
  })
})

describe('cupom que não acumula com promoção', () => {
  const cupom: CupomInfo = {
    franquia_id: null,
    tipo: 'percentual',
    valor: 10,
    moeda: null,
    vale_em_promocao: false,
  }

  it('ignora o item que está em promoção', () => {
    const grupos = [
      grupo('f1', [
        item({ precoPyg: 100_000, precoPromocionalPyg: 80_000 }),
        item({ itemId: 'i2', precoPyg: 200_000 }),
      ]),
    ]
    // Só os 200k do item sem promo entram.
    expect(descontos(cupom, grupos)).toEqual({ f1: 20_000 })
  })

  it('não se aplica quando o carrinho é só promoção', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, precoPromocionalPyg: 80_000 })]),
    ]
    expect(calcularDescontoCupom(cupom, grupos)).toEqual({
      ok: false,
      motivo: 'nao_aplicavel',
    })
  })

  it('promo "de/por" inválida (promo >= preço) não conta como promoção', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, precoPromocionalPyg: 120_000 })]),
    ]
    expect(descontos(cupom, grupos)).toEqual({ f1: 10_000 })
  })

  it('por padrão o cupom continua valendo em item promocional', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, precoPromocionalPyg: 80_000 })]),
    ]
    expect(
      descontos(
        { franquia_id: null, tipo: 'percentual', valor: 10, moeda: null },
        grupos,
      ),
    ).toEqual({ f1: 8_000 })
  })
})
