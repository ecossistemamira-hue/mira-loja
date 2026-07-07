'use client'

import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { recuperarSenha } from '@/app/auth-actions'
import {
  AuthShell,
  BOTAO_AUTH,
  CampoAuth,
  INPUT_AUTH,
} from '@/components/auth/auth-shell'

export default function RecuperarSenhaPage() {
  const t = useTranslations('auth')
  const [pending, start] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    start(async () => {
      const r = await recuperarSenha(String(f.get('email') ?? ''))
      if (!r.ok) {
        setErro(true)
        return
      }
      setEnviado(true)
    })
  }

  if (enviado) {
    return (
      <AuthShell titulo={t('recuperar_enviado_titulo')}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-marca/10 text-marca">
            <MailCheck className="size-7" />
          </span>
          <p className="max-w-xs text-[13px] leading-relaxed text-gray-600">
            {t('recuperar_enviado_dica')}
          </p>
          <Link
            href="/entrar"
            className="mt-2 text-[13px] font-semibold text-marca hover:underline"
          >
            {t('voltar_login')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      titulo={t('recuperar_titulo')}
      subtitulo={t('recuperar_subtitulo')}
    >
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

        {erro && <p className="text-[13px] text-red-600">{t('erro_generico')}</p>}

        <button type="submit" disabled={pending} className={BOTAO_AUTH}>
          {pending ? '…' : t('recuperar_enviar')}
        </button>

        <p className="pt-1 text-center text-[13px] text-gray-500">
          <Link href="/entrar" className="font-semibold text-marca hover:underline">
            {t('voltar_login')}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
