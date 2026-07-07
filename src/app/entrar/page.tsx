'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Suspense, useState, useTransition } from 'react'

import { entrarComSenha } from '@/app/auth-actions'
import {
  AuthShell,
  BOTAO_AUTH,
  CampoAuth,
  INPUT_AUTH,
} from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  )
}

function EntrarForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/conta'
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(
    searchParams.get('error') ? 'erro_generico' : null,
  )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    start(async () => {
      const r = await entrarComSenha({
        email: String(f.get('email') ?? ''),
        senha: String(f.get('senha') ?? ''),
      })
      if (!r.ok) {
        setErro(
          r.error === 'email_nao_confirmado'
            ? 'erro_email_nao_confirmado'
            : 'erro_credenciais',
        )
        return
      }
      router.push(next.startsWith('/') ? next : '/conta')
      router.refresh()
    })
  }

  return (
    <AuthShell titulo={t('entrar_titulo')} subtitulo={t('entrar_subtitulo')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CampoAuth id="email" label={t('email')}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={INPUT_AUTH}
          />
        </CampoAuth>
        <CampoAuth id="senha" label={t('senha')}>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className={INPUT_AUTH}
          />
        </CampoAuth>

        {erro && <p className="text-[13px] text-red-600">{t(erro)}</p>}

        <button type="submit" disabled={pending} className={BOTAO_AUTH}>
          {pending ? '…' : t('entrar')}
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-gray-300">
          <span className="h-px flex-1 bg-gray-100" />
          {t('ou')}
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleButton next={next} />

        <div className="flex flex-col items-center gap-1.5 pt-1 text-[13px]">
          <Link
            href="/recuperar-senha"
            className="text-gray-500 transition-colors hover:text-marca"
          >
            {t('esqueci_senha')}
          </Link>
          <span className="text-gray-500">
            {t('sem_conta')}{' '}
            <Link
              href="/cadastro"
              className="font-semibold text-marca hover:underline"
            >
              {t('criar_conta')}
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  )
}
