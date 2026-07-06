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
