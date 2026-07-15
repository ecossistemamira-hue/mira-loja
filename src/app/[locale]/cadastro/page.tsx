'use client'

import { MailCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { cadastrar } from '@/app/auth-actions'
import { Link, useRouter } from '@/i18n/navigation'
import {
  AuthShell,
  BOTAO_AUTH,
  CampoAuth,
  INPUT_AUTH,
} from '@/components/auth/auth-shell'
import { GoogleButton } from '@/components/auth/google-button'

export default function CadastroPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const senha = String(f.get('senha') ?? '')
    if (senha.length < 8) {
      setErro('erro_senha_curta')
      return
    }
    start(async () => {
      const r = await cadastrar({
        nome: String(f.get('nome') ?? ''),
        email: String(f.get('email') ?? ''),
        senha,
      })
      if (!r.ok) {
        setErro(r.error === 'email_em_uso' ? 'erro_email_em_uso' : 'erro_generico')
        return
      }
      if (r.confirmarEmail) {
        setConfirmarEmail(true)
        return
      }
      router.push('/conta')
      router.refresh()
    })
  }

  if (confirmarEmail) {
    return (
      <AuthShell titulo={t('confirmar_titulo')}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-marca/10 text-marca">
            <MailCheck className="size-7" />
          </span>
          <p className="max-w-xs text-[13px] leading-relaxed text-gray-600">
            {t('confirmar_dica')}
          </p>
          <Link
            href="/"
            className="mt-2 text-[13px] font-semibold text-marca hover:underline"
          >
            {t('voltar_loja')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell titulo={t('cadastro_titulo')} subtitulo={t('cadastro_subtitulo')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CampoAuth id="nome" label={t('nome')}>
          <input
            id="nome"
            name="nome"
            required
            minLength={2}
            autoComplete="name"
            className={INPUT_AUTH}
          />
        </CampoAuth>
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
        <CampoAuth id="senha" label={t('senha_nova')}>
          <input
            id="senha"
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={INPUT_AUTH}
          />
        </CampoAuth>

        {erro && <p className="text-[13px] text-red-600">{t(erro)}</p>}

        <button type="submit" disabled={pending} className={BOTAO_AUTH}>
          {pending ? '…' : t('criar_conta')}
        </button>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-gray-300">
          <span className="h-px flex-1 bg-gray-100" />
          {t('ou')}
          <span className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleButton />

        <p className="pt-1 text-center text-[13px] text-gray-500">
          {t('ja_tem_conta')}{' '}
          <Link href="/entrar" className="font-semibold text-marca hover:underline">
            {t('entrar')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
