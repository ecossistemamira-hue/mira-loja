import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy (Next 16, substitui o middleware): renova a sessão Supabase do
 * comprador a cada request e protege a área da conta.
 * - /conta* sem login → /entrar?next=…
 * - /entrar|/cadastro logado → /conta
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const { pathname } = request.nextUrl

  // Visitante sem cookie de sessão Supabase: nada a renovar — evita um
  // round-trip de rede ao Auth (Oregon) em TODA page view anônima.
  const temCookieSessao = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  if (!temCookieSessao) {
    if (pathname.startsWith('/conta')) {
      const url = request.nextUrl.clone()
      url.pathname = '/entrar'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith('/conta') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    url.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  if ((pathname === '/entrar' || pathname === '/cadastro') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/conta'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Tudo menos assets estáticos e APIs (webhooks/cron se autenticam sozinhos).
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo.*\\.png|robots\\.txt|sitemap\\.xml|api/).*)',
  ],
}
