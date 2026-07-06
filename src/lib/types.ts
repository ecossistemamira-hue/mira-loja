// Tipos mínimos das linhas que a vitrine consome. Espelham as colunas públicas
// de `produtos` / `produto_fotos` no Supabase da Mira (fonte da verdade é o
// mira-platform; aqui só o que a loja lê).

export type ProdutoVitrine = {
  id: string
  nome: string
  slug: string | null
  descricao: string | null
  categoria: string | null
  preco_brl: number | null
  preco_pyg: number | null
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

export type FranquiaPublica = {
  id: string
  nome_fantasia: string
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
  precoBrl: number | null
  disponivel: number
  quantidade: number
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
