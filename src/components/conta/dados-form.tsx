'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { atualizarMeusDados } from '@/app/auth-actions'
import { CampoAuth, INPUT_AUTH } from '@/components/auth/auth-shell'

type Props = {
  nome: string
  email: string
  telefone: string | null
  documento: string | null
}

export function DadosForm({ nome, email, telefone, documento }: Props) {
  const t = useTranslations('conta')
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<'ok' | 'erro' | null>(null)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    start(async () => {
      const r = await atualizarMeusDados({
        nome: String(f.get('nome') ?? ''),
        telefone: String(f.get('telefone') ?? '') || null,
        documento: String(f.get('documento') ?? '') || null,
      })
      setMsg(r.ok ? 'ok' : 'erro')
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <CampoAuth id="nome" label={t('campo_nome')}>
        <input
          id="nome"
          name="nome"
          defaultValue={nome}
          required
          minLength={2}
          className={INPUT_AUTH}
        />
      </CampoAuth>

      <CampoAuth id="email" label={t('campo_email')}>
        <input
          id="email"
          value={email}
          disabled
          className={`${INPUT_AUTH} cursor-not-allowed opacity-60`}
        />
      </CampoAuth>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoAuth id="telefone" label={t('campo_telefone')}>
          <input
            id="telefone"
            name="telefone"
            defaultValue={telefone ?? ''}
            autoComplete="tel"
            className={INPUT_AUTH}
          />
        </CampoAuth>
        <CampoAuth id="documento" label={t('campo_documento')}>
          <input
            id="documento"
            name="documento"
            defaultValue={documento ?? ''}
            className={INPUT_AUTH}
          />
        </CampoAuth>
      </div>

      {msg === 'ok' && (
        <p className="text-[13px] font-medium text-emerald-600">
          {t('dados_salvos')}
        </p>
      )}
      {msg === 'erro' && (
        <p className="text-[13px] text-red-600">{t('dados_erro')}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center rounded-xl bg-marca px-5 text-[13px] font-bold text-white transition-colors hover:bg-marca-hover disabled:opacity-60"
      >
        {pending ? '…' : t('salvar')}
      </button>
    </form>
  )
}
