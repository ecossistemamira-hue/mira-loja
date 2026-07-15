import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

/**
 * Proxy (Next 16, substitui o middleware): roteamento de locale do next-intl
 * (es sem prefixo, pt-BR sob /pt) + renovação da sessão Supabase do comprador
 * e proteção da área da conta.
 * - /conta* sem login → /entrar?next=… (preservando o prefixo /pt)
 * - /entrar|/cadastro logado → /conta
 */
export async function proxy(request: NextRequest) {
  // i18n primeiro: redirect (ex.: detecção de idioma na home) sai direto;
  // caso contrário seguimos construindo sobre a response dele (rewrite
  // interno pro segmento [locale] + cookie NEXT_LOCALE).
  let response = handleI18n(request)
  if (response.status >= 300 && response.status < 400) return response

  const { pathname } = request.nextUrl
  // Checks de rota ignoram o prefixo de locale; redirects preservam.
  const semLocale = pathname.replace(/^\/pt(?=\/|$)/, '') || '/'
  const prefixo = semLocale === pathname ? '' : '/pt'

  const redirectPara = (destino: string, search = '') => {
    const url = request.nextUrl.clone()
    url.pathname = `${prefixo}${destino}`
    url.search = search
    return NextResponse.redirect(url)
  }

  // Visitante sem cookie de sessão Supabase: nada a renovar — evita um
  // round-trip de rede ao Auth (Oregon) em TODA page view anônima.
  const temCookieSessao = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  if (!temCookieSessao) {
    if (semLocale.startsWith('/conta')) {
      return redirectPara('/entrar', `?next=${encodeURIComponent(pathname)}`)
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
          // Regera a response do i18n pra propagar os cookies atualizados
          // ao render, preservando o rewrite de locale.
          response = handleI18n(request)
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

  if (semLocale.startsWith('/conta') && !user) {
    return redirectPara('/entrar', `?next=${encodeURIComponent(pathname)}`)
  }

  if ((semLocale === '/entrar' || semLocale === '/cadastro') && user) {
    return redirectPara('/conta')
  }

  return response
}

export const config = {
  // Tudo menos assets estáticos, APIs (webhooks/cron se autenticam sozinhos)
  // e os handlers de /auth/* (fora do segmento [locale] — sem prefixo).
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon\\.ico|logo.*\\.png|robots\\.txt|sitemap\\.xml|api/|auth/).*)',
  ],
}
