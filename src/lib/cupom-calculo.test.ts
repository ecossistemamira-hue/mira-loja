import { describe, expect, it } from 'vitest'

import { calcularDescontoCupom } from './cupom-calculo'
import type { GrupoCarrinho, ItemCarrinho } from './types'

function item(over: Partial<ItemCarrinho> = {}): ItemCarrinho {
  return {
    itemId: 'i1',
    produtoId: 'p1',
    franquiaId: 'f1',
    nome: 'Produto',
    slug: null,
    imagemUrl: null,
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

describe('calcularDescontoCupom', () => {
  it('percentual da rede aplica em todos os grupos', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000, quantidade: 2 })]), // 200k
      grupo('f2', [item({ precoPyg: 50_000 })]), // 50k
    ]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'percentual', valor: 10, moeda: null },
      grupos,
    )
    expect(d).toEqual({ f1: 20_000, f2: 5_000 })
  })

  it('percentual usa o preço promocional quando válido', () => {
    const grupos = [
      grupo('f1', [
        item({ precoPyg: 100_000, precoPromocionalPyg: 80_000 }),
      ]),
    ]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'percentual', valor: 10, moeda: null },
      grupos,
    )
    expect(d).toEqual({ f1: 8_000 })
  })

  it('cupom de franquia só desconta no grupo dela', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 100_000 })]),
      grupo('f2', [item({ precoPyg: 100_000 })]),
    ]
    const d = calcularDescontoCupom(
      { franquia_id: 'f2', tipo: 'percentual', valor: 20, moeda: null },
      grupos,
    )
    expect(d).toEqual({ f2: 20_000 })
  })

  it('cupom de franquia fora do carrinho não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const d = calcularDescontoCupom(
      { franquia_id: 'f9', tipo: 'percentual', valor: 20, moeda: null },
      grupos,
    )
    expect(d).toBeNull()
  })

  it('valor_fixo aplica uma vez, no grupo de maior subtotal', () => {
    const grupos = [
      grupo('f1', [item({ precoPyg: 50_000 })]),
      grupo('f2', [item({ precoPyg: 300_000 })]),
    ]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'valor_fixo', valor: 30_000, moeda: 'PYG' },
      grupos,
    )
    expect(d).toEqual({ f2: 30_000 })
  })

  it('valor_fixo não passa do subtotal do grupo', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 20_000 })])]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'valor_fixo', valor: 50_000, moeda: 'PYG' },
      grupos,
    )
    expect(d).toEqual({ f1: 20_000 })
  })

  it('valor_fixo em moeda que não é guarani não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'valor_fixo', valor: 10, moeda: 'USD' },
      grupos,
    )
    expect(d).toBeNull()
  })

  it('valor_fixo sem moeda declarada vale como guarani', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 100_000 })])]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'valor_fixo', valor: 25_000, moeda: null },
      grupos,
    )
    expect(d).toEqual({ f1: 25_000 })
  })

  it('percentual acima de 100 trava em 100', () => {
    const grupos = [grupo('f1', [item({ precoPyg: 80_000 })])]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'percentual', valor: 150, moeda: null },
      grupos,
    )
    expect(d).toEqual({ f1: 80_000 })
  })

  it('valor zerado ou negativo não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    for (const valor of [0, -10]) {
      expect(
        calcularDescontoCupom(
          { franquia_id: null, tipo: 'percentual', valor, moeda: null },
          grupos,
        ),
      ).toBeNull()
    }
  })

  it('tipo desconhecido não se aplica', () => {
    const grupos = [grupo('f1', [item()])]
    const d = calcularDescontoCupom(
      { franquia_id: null, tipo: 'brinde', valor: 10, moeda: null },
      grupos,
    )
    expect(d).toBeNull()
  })
})
