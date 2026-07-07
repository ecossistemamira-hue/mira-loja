import { NextResponse, type NextRequest } from 'next/server'

import { createAuthClient } from '@/lib/supabase-auth'

/**
 * Callback de auth: troca o `code` (confirmação de e-mail, OAuth Google,
 * recovery de senha) por sessão em cookie e redireciona pro destino.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/conta'
  // Só caminhos internos — evita open redirect.
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/conta'

  if (code) {
    const supabase = await createAuthClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(destino, request.url))
    }
  }

  return NextResponse.redirect(new URL('/entrar?error=callback', request.url))
}
