import { describe, expect, it } from 'vitest'

import {
  calcularFrete,
  detectarZona,
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

describe('detectarZona', () => {
  it('classifica CEP brasileiro por região', () => {
    expect(detectarZona('85850-000')).toBe('br_sul') // Foz do Iguaçu
    expect(detectarZona('90000000')).toBe('br_sul') // Porto Alegre
    expect(detectarZona('01310-100')).toBe('br_sudeste') // São Paulo
    expect(detectarZona('30110000')).toBe('br_sudeste') // BH
    expect(detectarZona('70040-010')).toBe('br_centro') // Brasília
    expect(detectarZona('40020-000')).toBe('br_norte_ne') // Salvador
    expect(detectarZona('60060-170')).toBe('br_norte_ne') // Fortaleza
  })

  it('classifica código postal paraguaio (4-6 dígitos)', () => {
    expect(detectarZona('7000')).toBe('py') // Ciudad del Este
    expect(detectarZona('1209')).toBe('py') // Asunción
    expect(detectarZona('100101')).toBe('py')
  })

  it('rejeita entrada que não é CEP', () => {
    expect(detectarZona('')).toBeNull()
    expect(detectarZona('12')).toBeNull()
    expect(detectarZona('1234567')).toBeNull()
    expect(detectarZona('123456789')).toBeNull()
  })
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

describe('calcularFrete', () => {
  it('calcula econômico e expresso pra zona sul em BRL', () => {
    const opcoes = calcularFrete({
      cep: '85850-000',
      itens: [item({ pesoGramas: 2000 })],
      moeda: 'BRL',
      subtotal: 100,
    })
    expect(opcoes).not.toBeNull()
    const [eco, exp] = opcoes!
    expect(eco.servico).toBe('economico')
    expect(eco.valor).toBe(20 + 6 * 2) // base 20 + 6/kg × 2 kg = 32
    expect(exp.servico).toBe('expresso')
    expect(exp.valor).toBe(Math.round(32 * 1.6)) // 51
    expect(eco.prazoDias.max).toBeGreaterThanOrEqual(exp.prazoDias.max)
  })

  it('econômico sai grátis acima do teto da moeda', () => {
    const opcoes = calcularFrete({
      cep: '01310-100',
      itens: [item()],
      moeda: 'BRL',
      subtotal: FRETE_GRATIS_MINIMO.BRL,
    })!
    expect(opcoes[0].gratis).toBe(true)
    expect(opcoes[0].valor).toBe(0)
    expect(opcoes[1].valor).toBeGreaterThan(0) // expresso nunca é grátis
  })

  it('calcula em PYG pra código postal paraguaio', () => {
    const opcoes = calcularFrete({
      cep: '7000',
      itens: [item({ pesoGramas: 1000 })],
      moeda: 'PYG',
      subtotal: 100_000,
    })!
    expect(opcoes[0].valor).toBe(35_000 + 7_000)
  })

  it('retorna null pra código postal inválido', () => {
    expect(
      calcularFrete({ cep: 'abc', itens: [item()], moeda: 'BRL', subtotal: 10 }),
    ).toBeNull()
  })
})
