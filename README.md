# Mira Shop — vitrine pública (mira-loja)

Loja pública do Marketplace Mira (**Fase 1** do `planejamento-market/plano-marketplace-mira.md`). App Next.js separado que **lê** produtos publicados do mesmo Supabase da Mira via **anon key** — o `mira-platform` continua sendo o back-office (fonte da verdade).

## O que já tem (Fase 1)

- Home com destaques + categorias.
- Página de produto (`/p/[slug]`) com galeria, preço, estoque, entrega e **CTA temporário de WhatsApp** (sem carrinho ainda — isso é Fase 2).
- Busca (`/buscar?q=&categoria=`).
- SEO: metadata dinâmica, Open Graph, **JSON-LD `Product`**, `sitemap.xml`, `robots.txt`.
- i18n ES (padrão) / PT-BR por cookie, com seletor no header.

## Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript strict · Tailwind v4 · next-intl 4 · `@supabase/supabase-js` (read-only, anon).

## Rodar

```bash
cp .env.local.example .env.local   # preencha URL + ANON key do Supabase da Mira
npm install
npm run dev                        # http://localhost:3100
```

### Variáveis

| Var | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase da Mira (mesmo do mira-platform) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key — RLS `produtos_publico`/`produto_fotos_publico` garantem que só vem o publicado |
| `NEXT_PUBLIC_SITE_URL` | URL pública (canonical, sitemap, JSON-LD) |
| `NEXT_PUBLIC_WHATSAPP` | WhatsApp do CTA (só dígitos, com DDI) |

## Como um produto aparece aqui

No back-office (`mira-platform`), a franquia cadastra o produto, define peso/dimensões, envia fotos e liga **Publicado na loja**. Ele só aparece na vitrine quando `status = 'aprovado'` **e** `publicado_loja = true` (moderação da matriz). A vitrine lê exatamente isso via RLS.

## Próximas fases

- **Fase 2:** carrinho + checkout (Mercado Pago split BR), contas de comprador, pedidos.
- **Fase 3:** frete (Melhor Envio) + rastreio.
- **Fase 4:** cupons/atribuição de influencer.

Detalhe completo no plano em `../mira-platform/planejamento-market/`.
