# Handoff: Shoppy — Home do Marketplace

## Overview
Home/vitrine do marketplace "Shoppy" (opera no Paraguai; UI em português, preços em guaraníes ₲). Funcionalidades tipo Mercado Livre/Amazon: busca, nav de categorias, hero carrossel, benefícios, ofertas do dia com countdown, grade de produtos (avaliações, frete, cuotas, favoritos, carrinho), banner de vendedor e footer. Identidade profissional e neutra: esmeralda + neutros slate.

## About the Design Files
Os arquivos são **referências de design em HTML** — protótipos de aparência e comportamento, NÃO código de produção. Recrie este design no ambiente da aplicação alvo (React, Vue, etc.) com os padrões do codebase; se não houver stack definida, escolha a mais adequada.

O `Shoppy Home.dc.html` é um formato de componente da ferramenta de design: markup dentro de `<x-dc>…</x-dc>` (estilos inline) e lógica/dados numa classe JS no `<script>` final. Ignore `support.js`; leia `<sc-for>`/`<sc-if>`/`{{ }}` como `map()`/condicionais/interpolação.

## Fidelity
**High-fidelity (hifi)**: cores, tipografia, espaçamentos e interações finais. Recriar fielmente.

## Screens / Views

### Home (desktop, conteúdo max-width 1220px, fundo #F5F6F8)

**1. Barra de anúncio** — #0F172A, texto 12.5px #E2E8F0 centralizado: "Mega Ofertas até 40% OFF | Frete grátis em compras a partir de ₲ 300.000" + link "Ver ofertas →" em #5EEAD4.

**2. Header branco (border-bottom #E2E8F0), 2 linhas**
- Linha 1 — grid `170px / minmax(0,1fr) / minmax(0,auto)`, gap 24px, padding 14px 16px:
  - Logo: ícone sacola SVG stroke #087F5B 30px + wordmark "shoppy" 700 22px #0F172A.
  - Busca: h 44px, border 1px #CBD5E1 radius 10 (focus #087F5B); input 14.5px; botão lupa SVG 52px fundo #087F5B (hover #066649).
  - Direita: "Olá, entre / Conta e pedidos" com ícone user (hover bg #F1F5F9, radius 10); ícone coração 42px; carrinho SVG com badge #087F5B (borda branca 1.5px, contador).
- Linha 2 (nav, border-top #F1F5F9): "☰ Todas as categorias" 600 13.5px + divisor + links 13.5px 500 #475569 (hover #087F5B): Ofertas, Cupons, Supermercado, Eletrônicos, Moda, Casa & Deco, Esportes, Beleza; à direita "Venda na Shoppy" #087F5B 600. Overflow-x auto.

**3. Hero carrossel** — dentro do container, card radius 14, h 300px, shadow `0 1px 3px rgba(15,23,42,.08)`; 3 slides com gradientes sóbrios: esmeralda `#066649→#0A8F68`, grafite `#1E293B→#334155`, marrom `#6B4226→#8A5A33`. Slide: grid `1fr/360px`, padding 0 64px; eyebrow uppercase 11.5px `rgba(255,255,255,.65)`; título 700 36px ls -1px; texto 15px `rgba(255,255,255,.78)`; botão branco (texto na cor escura do slide, 600, radius 9). Slot de imagem 220px tracejado. Setas: círculos brancos 40px com chevron SVG #0F172A. Dots: ativo 20×6px branco, inativos 6px `rgba(255,255,255,.45)`. Autoplay 6s, transição `.5s ease`.

**4. Benefícios** — card branco border #E2E8F0 radius 14, 4 colunas (divisórias #F1F5F9). Item: quadrado 42px radius 11 fundo #E6F4EF com ícone SVG stroke #087F5B (cartão/caminhão/escudo/carteira) + título 13.5px 600 #0F172A + sub 12px #64748B. Itens: Cuotas sem juros / Frete grátis ₲ 300.000 / Compra protegida / Tigo Money e Zimple.

**5. Ofertas do dia** — card branco radius 14 padding 22px. Título 700 19px; chip countdown bg #FEF2F2, "Termina em" #991B1B + HH:MM:SS 700 #DC2626 tabular-nums; link "Ver todas as ofertas →". Carrossel horizontal, cards 195px border #E2E8F0 radius 12 (hover border #94A3B8 + shadow): imagem 140px com badge "-26%" #DC2626 radius 6 no canto sup. esquerdo; preço antigo riscado 11.5px #94A3B8; preço 700 18px #0F172A; título 12.5px 2 linhas #475569; "Frete grátis" 12px 600 #087F5B.

**6. Categorias** — card branco radius 14; grid `minmax(112px,1fr)`; item: quadrado 54px radius 14 bg #F1F5F9 com inicial 700 20px #0F172A + label 12.5px 600; hover: border #E2E8F0, bg #F8FAFC, texto #087F5B.

**7. Mais vendidos** — grid `repeat(auto-fill, minmax(228px,1fr))` gap 14px. Card branco border #E2E8F0 radius 12 (hover border #94A3B8 + shadow `0 6px 18px rgba(15,23,42,.08)`):
- Imagem 200px, badge desconto vermelho, coração SVG em círculo branco 32px border #E2E8F0 (inativo stroke #94A3B8; ativo fill+stroke #DC2626).
- Título 13.5px 2 linhas #334155; estrela SVG #F59E0B + nota 600 #0F172A + (reviews) #94A3B8 + vendedor #64748B.
- Preço antigo riscado; preço 700 20px; "ou 12x ₲ … sem juros" 12.5px #64748B; "Frete grátis · chega amanhã" (verde + cinza).
- Botão "Adicionar ao carrinho" #087F5B, hover #066649, radius 9, 600 13.5px.

**8. Banner vendedor** — card #0F172A radius 14, grid `1fr/300px`; eyebrow "PARA VENDEDORES" #5EEAD4; título 700 27px; texto #94A3B8; botão #087F5B.

**9. Footer** — branco border-top #E2E8F0; 4 colunas (marca + Comprar/Vender/Ajuda); links 12.5px #64748B hover #087F5B; "🛡 Compra 100% protegida" (ícone SVG); barra final 11.5px #94A3B8 com © e "Pagamentos: Visa · Mastercard · Tigo Money · Zimple".

## Interactions & Behavior
- Carrossel: prev/next wrap-around, dots clicáveis, autoplay 6s.
- Countdown: 1s, inicia 08:42:15, reinicia em 24h ao zerar.
- Favoritar: toggle coração (outline cinza ↔ preenchido vermelho), `stopPropagation`.
- Adicionar ao carrinho: incrementa badge.
- Hovers: cards trocam borda p/ #94A3B8 + shadow; botões escurecem; links → esmeralda.
- Preço: milhar com ponto (`2.150.000`), prefixo `₲ `.
- Responsivo: grids auto-fill; header `minmax(0,…)`; navs overflow-x.

## State Management
- `cartCount`, `favs: Record<id,bool>`, `secs` (countdown), `slide` (carrossel).
- Flags: `showCuotas`, `fastDeliveryBadges`.
- Produto: id, título, seller, rating, reviews, price, old, discount, frete, fast.

## Design Tokens
**Cores**
- Esmeralda primária (CTA/links/badge carrinho): #087F5B · hover #066649 · tint #E6F4EF · claro #5EEAD4 (sobre escuro)
- Neutros: texto #0F172A / #334155 / #475569 / #64748B / #94A3B8 · bordas #E2E8F0 / #F1F5F9 / #CBD5E1 · bg página #F5F6F8 · bg suave #F8FAFC / #F1F5F9 · escuro #0F172A
- Vermelho (desconto/countdown/favorito): #DC2626 · texto escuro #991B1B · tint #FEF2F2
- Âmbar (estrela): #F59E0B
- Hero: #066649→#0A8F68 · #1E293B→#334155 · #6B4226→#8A5A33

**Tipografia** — 'Instrument Sans' (Google Fonts) 400–700. Títulos de seção 19px/700; hero 36px/700; preços 18–20px/700; corpo 12–15px.

**Forma/espaço** — max-width 1220px; gap seções 24px; radius: cards grandes 14, cards produto 12, botões 9-10, badges 6; shadows leves apenas em hover.

## Assets
- Fotos = placeholders rotulados (`foto: celular`…). Substituir por imagens reais.
- Ícones: SVGs inline stroke 2px (estilo lucide) — mapear para a lib de ícones do codebase (lucide/feather).
- Logo sacola = SVG simples; substituir por marca oficial se existir.

## Files
- `Shoppy Home.dc.html` — protótipo hifi da home (markup + lógica).
