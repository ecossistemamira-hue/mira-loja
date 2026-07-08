import { describe, expect, it } from 'vitest'

import {
  calcularFrete,
  cotarTodasZonas,
  FRETE_GRATIS_MINIMO,
  pesoTaxavelKg,
} from './frete'

const item = (over: Partial<Parameters<typeof pesoTaxavelKg>[0][number]> = {}) => ({
  pesoGramas: 1000,
  alturaCm: null,
  larguraCm: null,
  comprimentoCm: null,
  quantidade: 1,
  ...over,
})

describe('pesoTaxavelKg', () => {
  it('usa peso real quando não há dimensões', () => {
    expect(pesoTaxavelKg([item({ pesoGramas: 2500 })])).toBe(3) // ceil
  })

  it('usa 500g padrão quando produto não tem peso', () => {
    expect(pesoTaxavelKg([item({ pesoGramas: null, quantidade: 2 })])).toBe(1)
  })

  it('usa peso cubado quando maior que o real (A×L×C/6000)', () => {
    // 60×40×50/6000 = 20 kg cubado vs 1 kg real
    const it2 = item({ alturaCm: 60, larguraCm: 40, comprimentoCm: 50 })
    expect(pesoTaxavelKg([it2])).toBe(20)
  })

  it('multiplica pela quantidade e soma itens', () => {
    expect(
      pesoTaxavelKg([
        item({ pesoGramas: 1000, quantidade: 2 }),
        item({ pesoGramas: 500 }),
      ]),
    ).toBe(3) // 2,5 kg → ceil 3
  })

  it('mínimo de 1 kg', () => {
    expect(pesoTaxavelKg([item({ pesoGramas: 100 })])).toBe(1)
  })
})

describe('calcularFrete (zonas do Paraguai)', () => {
  it('delivery em CDE/Alto Paraná em guarani', () => {
    const op = calcularFrete({
      zona: 'cde',
      itens: [item({ pesoGramas: 2000 })],
      moeda: 'PYG',
      subtotal: 100_000,
    })
    expect(op.servico).toBe('delivery')
    expect(op.valor).toBe(20_000 + 2_000 * 2) // 24.000
    expect(op.prazoDias).toEqual({ min: 1, max: 1 })
  })

  it('courier pra Asunción em guarani', () => {
    const op = calcularFrete({
      zona: 'asuncion',
      itens: [item({ pesoGramas: 1000 })],
      moeda: 'PYG',
      subtotal: 100_000,
    })
    expect(op.servico).toBe('courier')
    expect(op.valor).toBe(44_000)
    expect(op.prazoDias.max).toBe(3)
  })

  it('encomienda pro interior em dólar', () => {
    const op = calcularFrete({
      zona: 'interior',
      itens: [item({ pesoGramas: 3000 })],
      moeda: 'USD',
      subtotal: 50,
    })
    expect(op.servico).toBe('encomienda')
    expect(op.valor).toBe(5 + 0.5 * 3) // 6.5
  })

  it('envio grátis acima do teto da moeda', () => {
    const gsGratis = calcularFrete({
      zona: 'asuncion',
      itens: [item()],
      moeda: 'PYG',
      subtotal: FRETE_GRATIS_MINIMO.PYG,
    })
    expect(gsGratis.gratis).toBe(true)
    expect(gsGratis.valor).toBe(0)

    const usdGratis = calcularFrete({
      zona: 'interior',
      itens: [item()],
      moeda: 'USD',
      subtotal: FRETE_GRATIS_MINIMO.USD,
    })
    expect(usdGratis.gratis).toBe(true)
    expect(usdGratis.valor).toBe(0)
  })
})

describe('cotarTodasZonas', () => {
  it('devolve as 3 zonas na ordem cde → asuncion → interior', () => {
    const opcoes = cotarTodasZonas({
      itens: [item()],
      moeda: 'PYG',
      subtotal: 100_000,
    })
    expect(opcoes.map((o) => o.zona)).toEqual(['cde', 'asuncion', 'interior'])
    expect(opcoes.map((o) => o.servico)).toEqual([
      'delivery',
      'courier',
      'encomienda',
    ])
  })
})
