import { describe, expect, it } from 'vitest'

import { levenshteinLimitado, normalizar, pontuarBusca } from './busca-fuzzy'

describe('normalizar', () => {
  it('remove acentos e baixa a caixa', () => {
    expect(normalizar('Asunción')).toBe('asuncion')
    expect(normalizar('CAIXA de Som')).toBe('caixa de som')
  })
})

describe('levenshteinLimitado', () => {
  it('calcula distâncias pequenas', () => {
    expect(levenshteinLimitado('caixa', 'caixa', 2)).toBe(0)
    expect(levenshteinLimitado('cajxa', 'caixa', 2)).toBe(1)
    expect(levenshteinLimitado('kaixa', 'caixa', 2)).toBe(1)
    expect(levenshteinLimitado('caia', 'caixa', 2)).toBe(1)
  })

  it('corta cedo quando estoura o limite', () => {
    expect(levenshteinLimitado('abcdef', 'zzzzzz', 1)).toBe(2)
    expect(levenshteinLimitado('a', 'abcd', 1)).toBe(2)
  })
})

describe('pontuarBusca', () => {
  const NOME = 'Caixa de Som Bluetooth Mira Sound 40W'

  it('acha por substring exata', () => {
    expect(pontuarBusca('caixa', NOME, null)).toBeGreaterThan(0)
    expect(pontuarBusca('bluetooth', NOME, null)).toBeGreaterThan(0)
  })

  it('ignora acentos e caixa', () => {
    expect(pontuarBusca('CAIXA', NOME, null)).toBeGreaterThan(0)
    expect(pontuarBusca('sóm', NOME, null)).toBeGreaterThan(0)
  })

  it('tolera 1 typo em tokens de 4+ letras', () => {
    expect(pontuarBusca('cajxa', NOME, null)).toBeGreaterThan(0)
    expect(pontuarBusca('bluetoth', NOME, null)).toBeGreaterThan(0)
  })

  it('tolera 2 typos em tokens longos (7+)', () => {
    expect(pontuarBusca('bluetouth', NOME, null)).toBeGreaterThan(0)
  })

  it('NÃO tolera typo em token curto (< 4)', () => {
    expect(pontuarBusca('sam', NOME, null)).toBe(0)
  })

  it('exige TODOS os tokens (AND)', () => {
    expect(pontuarBusca('caixa som', NOME, null)).toBeGreaterThan(0)
    expect(pontuarBusca('caixa geladeira', NOME, null)).toBe(0)
  })

  it('casa também pela categoria', () => {
    expect(pontuarBusca('eletronicos', 'Fone XYZ', 'Eletrônicos')).toBeGreaterThan(0)
  })

  it('match exato pontua mais que match com typo', () => {
    const exato = pontuarBusca('caixa', NOME, null)
    const typo = pontuarBusca('cajxa', NOME, null)
    expect(exato).toBeGreaterThan(typo)
  })

  it('frase inteira no nome ganha bônus sobre tokens espalhados', () => {
    const frase = pontuarBusca('caixa de som', NOME, null)
    const espalhado = pontuarBusca('som caixa', NOME, null)
    expect(frase).toBeGreaterThan(espalhado)
  })

  it('consulta vazia não casa', () => {
    expect(pontuarBusca('', NOME, null)).toBe(0)
    expect(pontuarBusca('  ', NOME, null)).toBe(0)
  })
})
