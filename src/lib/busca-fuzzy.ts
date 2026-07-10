/**
 * Busca com tolerância a erro de digitação, feita em JS: o catálogo é pequeno
 * (centenas de produtos), então dá pra normalizar + rankear em memória em vez
 * de depender de extensão do Postgres.
 *
 * Regras de match por token da consulta (AND — todo token precisa casar):
 *   - substring de alguma palavra do texto → pontua mais (match "exato")
 *   - prefixo aproximado / Levenshtein ≤ 1 (token ≥ 4 letras) → pontua menos
 *   - Levenshtein ≤ 2 (token ≥ 7 letras) → pontua ainda menos
 * Acentos e caixa são ignorados ("asuncion" acha "Asunción").
 */

/** Minúsculas + sem diacríticos — mesma normalização do slugify. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Distância de Levenshtein limitada: devolve `limite + 1` assim que estoura,
 * pra cortar cedo (só nos importam distâncias 0..2).
 */
export function levenshteinLimitado(
  a: string,
  b: string,
  limite: number,
): number {
  if (Math.abs(a.length - b.length) > limite) return limite + 1
  if (a === b) return 0

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const atual = [i]
    let menorDaLinha = i
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + custo,
      )
      if (atual[j] < menorDaLinha) menorDaLinha = atual[j]
    }
    if (menorDaLinha > limite) return limite + 1
    anterior = atual
  }
  return anterior[b.length]
}

/** Pontuação de UM token da consulta contra as palavras do texto (0 = não casa). */
function pontuarToken(token: string, palavras: string[]): number {
  let melhor = 0
  for (const palavra of palavras) {
    if (palavra.includes(token)) {
      // Substring: palavra inteira > prefixo > pedaço interno.
      melhor = Math.max(melhor, palavra === token ? 4 : 3)
      continue
    }
    if (token.length >= 4) {
      // Typo no prefixo do usuário ("cajxa" → "caixa"): compara com o começo
      // da palavra do produto, do tamanho do token.
      const prefixo = palavra.slice(0, token.length)
      if (levenshteinLimitado(token, prefixo, 1) <= 1) {
        melhor = Math.max(melhor, 2)
        continue
      }
    }
    if (
      token.length >= 7 &&
      levenshteinLimitado(token, palavra, 2) <= 2
    ) {
      melhor = Math.max(melhor, 1)
    }
  }
  return melhor
}

/**
 * Pontua um produto contra a consulta. 0 = fora do resultado.
 * Todo token da consulta precisa casar em nome OU categoria (AND).
 */
export function pontuarBusca(
  consulta: string,
  nome: string,
  categoria: string | null,
): number {
  const tokens = tokenizar(consulta)
  if (tokens.length === 0) return 0

  const palavras = [...tokenizar(nome), ...tokenizar(categoria ?? '')]
  if (palavras.length === 0) return 0

  let total = 0
  for (const token of tokens) {
    const p = pontuarToken(token, palavras)
    if (p === 0) return 0
    total += p
  }

  // Bônus: a consulta inteira como substring do nome (ordem preservada).
  if (normalizar(nome).includes(normalizar(consulta).trim())) total += 2

  return total
}
