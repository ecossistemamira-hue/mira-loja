// Tipos mínimos das linhas que a vitrine consome. Espelham as colunas públicas
// de `produtos` / `produto_fotos` no Supabase da Mira (fonte da verdade é o
// mira-platform; aqui só o que a loja lê).

export type ProdutoVitrine = {
  id: string
  nome: string
  slug: string | null
  descricao: string | null
  categoria: string | null
  // Marketplace PY vende só em guarani (preco_brl/preco_usd = legado no banco).
  preco_pyg: number | null
  // Quando < preco_pyg, vitrine mostra "de X por Y" e o carrinho cobra este.
  preco_promocional_pyg: number | null
  imagem_url: string | null
  estoque: number
  estoque_reservado: number
  permite_envio: boolean
  permite_retirada: boolean
  created_at: string
}

export type ProdutoFotoVitrine = {
  id: string
  url: string
  ordem: number
  alt: string | null
}

export type ProdutoComFotos = ProdutoVitrine & {
  fotos: ProdutoFotoVitrine[]
}

/** Detalhe do produto: vitrine + ficha técnica + vendedor (franquia). */
export type ProdutoDetalhe = ProdutoComFotos & {
  peso_gramas: number | null
  altura_cm: number | null
  largura_cm: number | null
  comprimento_cm: number | null
  franquia_id: string
  /** Selos de confiança editados pela franquia (ex.: "Original"). */
  selos: string[]
  vendedor: FranquiaPublica | null
}

export type FranquiaPublica = {
  id: string
  nome_fantasia: string
  slug: string | null
  cidade: string | null
  pais: string
  logo_url: string | null
  moeda: string
}

// Item do carrinho já resolvido com dados do produto (pra render).
export type ItemCarrinho = {
  itemId: string
  produtoId: string
  franquiaId: string
  nome: string
  slug: string | null
  imagemUrl: string | null
  precoPyg: number | null
  precoPromocionalPyg: number | null
  disponivel: number
  quantidade: number
  // Dados de frete (peso real + dimensões pro cubado).
  pesoGramas: number | null
  alturaCm: number | null
  larguraCm: number | null
  comprimentoCm: number | null
}

// Carrinho agrupado por franquia (um pedido por franquia no checkout — §2.3).
export type GrupoCarrinho = {
  franquia: FranquiaPublica | null
  itens: ItemCarrinho[]
}

export type CarrinhoResolvido = {
  grupos: GrupoCarrinho[]
  totalItens: number
}
