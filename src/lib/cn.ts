/** Junta classes condicionais (versão mínima, sem dependência). */
export function cn(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}
