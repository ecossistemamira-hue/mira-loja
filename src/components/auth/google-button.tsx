'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { entrarComGoogle } from '@/app/auth-actions'

export function GoogleButton({ next }: { next?: string }) {
  const t = useTranslations('auth')
  const [pending, start] = useTransition()
  const [erro, setErro] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await entrarComGoogle(next)
            // Sucesso redireciona no server; só chega aqui em erro.
            if (r && !r.ok) setErro(true)
          })
        }
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-[14px] font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
      >
        <GoogleIcon />
        {t('continuar_google')}
      </button>
      {erro && <p className="text-center text-xs text-red-600">{t('erro_google')}</p>}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}
