'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { redefinirSenha } from '@/app/auth-actions'
import {
  AuthShell,
  BOTAO_AUTH,
  CampoAuth,
  INPUT_AUTH,
} from '@/components/auth/auth-shell'

export default function RedefinirSenhaPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const senha = String(f.get('senha') ?? '')
    if (senha !== String(f.get('confirmar') ?? '')) {
      setErro('erro_senhas_diferentes')
      return
    }
    start(async () => {
      const r = await redefinirSenha(senha)
      if (!r.ok) {
        setErro(r.error === 'senha_curta' ? 'erro_senha_curta' : 'erro_generico')
        return
      }
      router.push('/conta')
      router.refresh()
    })
  }

  return (
    <AuthShell
      titulo={t('redefinir_titulo')}
      subtitulo={t('redefinir_subtitulo')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        <CampoAuth id="confirmar" label={t('senha_confirmar')}>
          <input
            id="confirmar"
            name="confirmar"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={INPUT_AUTH}
          />
        </CampoAuth>

        {erro && <p className="text-[13px] text-red-600">{t(erro)}</p>}

        <button type="submit" disabled={pending} className={BOTAO_AUTH}>
          {pending ? '…' : t('redefinir_salvar')}
        </button>
      </form>
    </AuthShell>
  )
}
