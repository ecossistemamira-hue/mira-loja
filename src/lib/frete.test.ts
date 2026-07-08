import { describe, expect, it } from 'vitest'

import {
  caixaDoPeso,
  CIDADES_AEX,
  cidadesPorDepartamento,
  cotarFrete,
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

const cidadePorNome = (nome: string) =>
  CIDADES_AEX.find((c) => c.cidade === nome)!

describe('tabela AEX', () => {
  it('tem as praças principais com preços crescentes por caixa', () => {
    for (const nome of ['Ciudad del Este', 'Asunción', 'Encarnación']) {
      const c = cidadePorNome(nome)
      expect(c).toBeDefined()
      expect(c.precos).toHaveLength(4)
      // caixa maior nunca custa menos
      for (let i = 1; i < 4; i++) {
        expect(c.precos[i]).toBeGreaterThanOrEqual(c.precos[i - 1])
      }
    }
  })

  it('agrupa por departamento sem perder cidade', () => {
    const grupos = cidadesPorDepartamento()
    const total = grupos.reduce((s, g) => s + g.cidades.length, 0)
    expect(total).toBe(CIDADES_AEX.length)
    expect(grupos.map((g) => g.departamento)).toContain('Alto Paraná')
  })
})

describe('caixaDoPeso (cajas AEX: 3/10/20/30 kg)', () => {
  it('classifica nos limites', () => {
    expect(caixaDoPeso(0.5)).toBe(0)
    expect(caixaDoPeso(3)).toBe(0)
    expect(caixaDoPeso(3.1)).toBe(1)
    expect(caixaDoPeso(10)).toBe(1)
    expect(caixaDoPeso(20)).toBe(2)
    expect(caixaDoPeso(30)).toBe(3)
  })

  it('acima de 30 kg é sob consulta (null)', () => {
    expect(caixaDoPeso(30.5)).toBeNull()
  })
})

describe('pesoTaxavelKg', () => {
  it('usa peso real quando não há dimensões', () => {
    expect(pesoTaxavelKg([item({ pesoGramas: 2500 })])).toBe(2.5)
  })

  it('usa 500g padrão quando produto não tem peso', () => {
    expect(pesoTaxavelKg([item({ pesoGramas: null, quantidade: 2 })])).toBe(1)
  })

  it('usa peso cubado quando maior que o real (A×L×C/6000)', () => {
    // 60×40×50/6000 = 20 kg cubado vs 1 kg real
    const it2 = item({ alturaCm: 60, larguraCm: 40, comprimentoCm: 50 })
    expect(pesoTaxavelKg([it2])).toBe(20)
  })
})

describe('cotarFrete (tabela real AEX, origem CDE)', () => {
  it('cota Asunción na caixa certa pelo peso', () => {
    const asu = cidadePorNome('Asunción')
    // 1,2 kg → caixa 0 (0-3 kg)
    const r = cotarFrete(asu.id, [item({ pesoGramas: 1200 })])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.caixa).toBe(0)
      expect(r.valor).toBe(asu.precos[0])
    }
  })

  it('quantidade maior sobe de caixa', () => {
    const asu = cidadePorNome('Asunción')
    // 4 × 1,2 kg = 4,8 kg → caixa 1 (3-10 kg)
    const r = cotarFrete(asu.id, [item({ pesoGramas: 1200, quantidade: 4 })])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.caixa).toBe(1)
      expect(r.valor).toBe(asu.precos[1])
    }
  })

  it('recusa cidade inexistente', () => {
    const r = cotarFrete(99999, [item()])
    expect(r).toEqual({ ok: false, error: 'cidade_invalida' })
  })

  it('acima de 30 kg vira sob consulta', () => {
    const asu = cidadePorNome('Asunción')
    const r = cotarFrete(asu.id, [item({ pesoGramas: 31_000 })])
    expect(r).toEqual({ ok: false, error: 'peso_excede' })
  })
})
