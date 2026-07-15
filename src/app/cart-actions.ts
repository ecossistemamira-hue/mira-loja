'use server'

import { revalidatePath } from 'next/cache'

import { gravarCarrinhoId, lerCarrinhoId } from '@/lib/cart'
import { createLojaClient } from '@/lib/supabase'

type Resultado = { ok: true } | { ok: false; error: string }

const ERRO = 'Não foi possível atualizar o carrinho.'

/** Garante que existe um carrinho e devolve o id (criando + gravando cookie). */
async function garantirCarrinho(
  supabase: ReturnType<typeof createLojaClient>,
): Promise<string | null> {
  const existente = await lerCarrinhoId()
  if (existente) return existente

  const expira = new Date()
  expira.setDate(expira.getDate() + 30)
  const { data, error } = await supabase
    .from('carrinhos')
    .insert({ expira_em: expira.toISOString() })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[loja.garantirCarrinho]', error)
    return null
  }
  await gravarCarrinhoId(data.id)
  return data.id
}

export async function adicionarAoCarrinho(
  produtoId: string,
  quantidade = 1,
): Promise<Resultado> {
  const qtd = Math.max(1, Math.trunc(quantidade))
  const supabase = createLojaClient()

  const carrinhoId = await garantirCarrinho(supabase)
  if (!carrinhoId) return { ok: false, error: ERRO }

  // Já existe esse produto no carrinho? Então incrementa.
  const { data: existente } = await supabase
    .from('carrinho_itens')
    .select('id, quantidade')
    .eq('carrinho_id', carrinhoId)
    .eq('produto_id', produtoId)
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('carrinho_itens')
      .update({ quantidade: existente.quantidade + qtd })
      .eq('id', existente.id)
    if (error) return { ok: false, error: ERRO }
  } else {
    const { error } = await supabase
      .from('carrinho_itens')
      .insert({ carrinho_id: carrinhoId, produto_id: produtoId, quantidade: qtd })
    if (error) {
      console.error('[loja.adicionarAoCarrinho]', error)
      return { ok: false, error: ERRO }
    }
  }

  revalidatePath('/carrinho')
  revalidatePath('/pt/carrinho')
  return { ok: true }
}

export async function definirQuantidade(
  itemId: string,
  quantidade: number,
): Promise<Resultado> {
  const supabase = createLojaClient()
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return { ok: false, error: ERRO }

  const qtd = Math.trunc(quantidade)
  if (qtd <= 0) return removerItem(itemId)

  const { error } = await supabase
    .from('carrinho_itens')
    .update({ quantidade: qtd })
    .eq('id', itemId)
    .eq('carrinho_id', carrinhoId)
  if (error) return { ok: false, error: ERRO }

  revalidatePath('/carrinho')
  revalidatePath('/pt/carrinho')
  return { ok: true }
}

export async function removerItem(itemId: string): Promise<Resultado> {
  const supabase = createLojaClient()
  const carrinhoId = await lerCarrinhoId()
  if (!carrinhoId) return { ok: false, error: ERRO }

  const { error } = await supabase
    .from('carrinho_itens')
    .delete()
    .eq('id', itemId)
    .eq('carrinho_id', carrinhoId)
  if (error) return { ok: false, error: ERRO }

  revalidatePath('/carrinho')
  revalidatePath('/pt/carrinho')
  return { ok: true }
}
