import { defineRouting } from 'next-intl/routing'

// 'es' primeiro: espanhol é o idioma oficial (foco no Paraguai) e vive SEM
// prefixo na URL (as-needed) — nenhuma URL existente muda. pt-BR é a
// tradução secundária e vive sob /pt.
export const routing = defineRouting({
  locales: ['es', 'pt-BR'],
  defaultLocale: 'es',
  localePrefix: { mode: 'as-needed', prefixes: { 'pt-BR': '/pt' } },
})
