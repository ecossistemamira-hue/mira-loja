'use server'

import { getLocale } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
// redirect do next/navigation: só pra URL EXTERNA do OAuth (o do next-intl
// localizaria o href). Navegação interna usa o redirect de @/i18n/navigation.
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { redirect as redirectLocalizado } from '@/i18n/navigation'

import { createAuthClient } from '@/lib/supabase-auth'
import { createServiceClient } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'

export type AuthResult =
  | { ok: true; confirmarEmail?: boolean }
  | { ok: false; error: string }

const CredenciaisSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(8).max(72),
})

const CadastroSchema = CredenciaisSchema.extend({
  nome: z.string().min(2).max(160),
})

// Mensagens genéricas — o texto amigável vem do i18n no client.
const ERRO_CREDENCIAIS = 'credenciais'
const ERRO_GENERICO = 'generico'
const ERRO_EMAIL_EM_USO = 'email_em_uso'

export async function entrarComSenha(input: {
  email: string
  senha: string
}): Promise<AuthResult> {
  const parsed = CredenciaisSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: ERRO_CREDENCIAIS }

  const supabase = await createAuthClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  })
  if (error) {
    return {
      ok: false,
      error: error.code === 'email_not_confirmed' ? 'email_nao_confirmado' : ERRO_CREDENCIAIS,
    }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function cadastrar(input: {
  nome: string
  email: string
  senha: string
}): Promise<AuthResult> {
  const parsed = CadastroSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: ERRO_GENERICO }

  const supabase = await createAuthClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/conta`,
      // Sem franquia_id no metadata: o trigger handle_new_user (0002) ignora
      // o signup — comprador NÃO vira linha em usuarios.
      data: { nome_completo: parsed.data.nome },
    },
  })
  if (error) {
    return {
      ok: false,
      error: error.code === 'user_already_exists' ? ERRO_EMAIL_EM_USO : ERRO_GENERICO,
    }
  }
  // identities vazio = e-mail já cadastrado (Supabase não vaza por erro).
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: ERRO_EMAIL_EM_USO }
  }
  const confirmarEmail = !data.session
  if (!confirmarEmail) revalidatePath('/', 'layout')
  return { ok: true, confirmarEmail }
}

export async function entrarComGoogle(next?: string): Promise<never | AuthResult> {
  const supabase = await createAuthClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next || '/conta')}`,
    },
  })
  if (error || !data.url) return { ok: false, error: 'google_indisponivel' }
  redirect(data.url)
}

export async function sair(): Promise<void> {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirectLocalizado({ href: '/', locale: await getLocale() })
}

export async function recuperarSenha(email: string): Promise<AuthResult> {
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return { ok: false, error: ERRO_GENERICO }

  const supabase = await createAuthClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${SITE_URL}/auth/callback?next=/redefinir-senha`,
  })
  if (error) return { ok: false, error: ERRO_GENERICO }
  return { ok: true }
}

export async function redefinirSenha(senha: string): Promise<AuthResult> {
  const parsed = z.string().min(8).max(72).safeParse(senha)
  if (!parsed.success) return { ok: false, error: 'senha_curta' }

  const supabase = await createAuthClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) return { ok: false, error: ERRO_GENERICO }
  revalidatePath('/', 'layout')
  return { ok: true }
}

const PerfilSchema = z.object({
  nome: z.string().min(2).max(160),
  telefone: z.string().max(40).optional().nullable(),
  documento: z.string().max(40).optional().nullable(),
})

/** Atualiza os dados do comprador logado (RLS compradores_self). */
export async function atualizarMeusDados(input: {
  nome: string
  telefone?: string | null
  documento?: string | null
}): Promise<AuthResult> {
  const parsed = PerfilSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: ERRO_GENERICO }

  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: ERRO_GENERICO }

  const { error } = await supabase
    .from('compradores')
    .update({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone || null,
      documento: parsed.data.documento || null,
    })
    .eq('auth_user_id', user.id)
  if (error) return { ok: false, error: ERRO_GENERICO }

  revalidatePath('/conta')
  revalidatePath('/pt/conta')
  return { ok: true }
}

/**
 * Garante a linha em `compradores` pro usuário logado (primeiro acesso à
 * conta). Service role justificado: o INSERT do comprador não tem policy
 * anon/self de INSERT (0082 só dá self SELECT/UPDATE via FOR ALL — mas o
 * upsert idempotente aqui evita corrida com o checkout convidado).
 */
export async function garantirComprador(): Promise<void> {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return

  const svc = createServiceClient()
  const { data: existente } = await svc
    .from('compradores')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (existente) return

  const nome =
    (user.user_metadata?.nome_completo as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email

  // Se já comprou como convidado com esse e-mail, adota o registro.
  const { data: convidado } = await svc
    .from('compradores')
    .select('id')
    .eq('email', user.email)
    .is('auth_user_id', null)
    .maybeSingle()

  if (convidado) {
    await svc
      .from('compradores')
      .update({ auth_user_id: user.id })
      .eq('id', convidado.id)
    return
  }

  await svc.from('compradores').insert({
    auth_user_id: user.id,
    nome,
    email: user.email,
    pais: 'PY',
  })
}
