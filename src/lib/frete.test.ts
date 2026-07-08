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

describe('calcularFrete (zonas do Paraguai, Gs.)', () => {
  it('delivery em CDE/Alto Paraná', () => {
    const op = calcularFrete({
      zona: 'cde',
      itens: [item({ pesoGramas: 2000 })],
      subtotal: 100_000,
    })
    expect(op.servico).toBe('delivery')
    expect(op.valor).toBe(20_000 + 2_000 * 2) // 24.000
    expect(op.prazoDias).toEqual({ min: 1, max: 1 })
  })

  it('courier pra Asunción', () => {
    const op = calcularFrete({
      zona: 'asuncion',
      itens: [item({ pesoGramas: 1000 })],
      subtotal: 100_000,
    })
    expect(op.servico).toBe('courier')
    expect(op.valor).toBe(44_000)
    expect(op.prazoDias.max).toBe(3)
  })

  it('encomienda pro interior', () => {
    const op = calcularFrete({
      zona: 'interior',
      itens: [item({ pesoGramas: 3000 })],
      subtotal: 100_000,
    })
    expect(op.servico).toBe('encomienda')
    expect(op.valor).toBe(35_000 + 3_000 * 3) // 44.000
  })

  it('envio grátis acima do teto', () => {
    const op = calcularFrete({
      zona: 'asuncion',
      itens: [item()],
      subtotal: FRETE_GRATIS_MINIMO,
    })
    expect(op.gratis).toBe(true)
    expect(op.valor).toBe(0)
  })
})

describe('cotarTodasZonas', () => {
  it('devolve as 3 zonas na ordem cde → asuncion → interior', () => {
    const opcoes = cotarTodasZonas({
      itens: [item()],
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
