'use client'

import { BellRing, Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { registrarAvisoEstoque } from '@/app/avisos-actions'
import { cn } from '@/lib/cn'

type Props = {
  produtoId: string
  /** E-mail do comprador logado (prefill), se houver. */
  emailInicial?: string | null
}

/**
 * "Avisáme cuando vuelva": form exibido na página do produto esgotado.
 * Grava em `produto_avisos_estoque`; o e-mail sai quando a franquia repõe.
 */
export function AvisoEstoque({ produtoId, emailInicial }: Props) {
  const t = useTranslations('aviso_estoque')
  const [email, setEmail] = useState(emailInicial ?? '')
  const [estado, setEstado] = useState<'idle' | 'ok' | 'erro'>('idle')
  const [pendente, startTrans] = useTransition()

  const enviar = () => {
    if (!email.trim() || pendente) return
    startTrans(async () => {
      const r = await registrarAvisoEstoque({ produtoId, email: email.trim() })
      setEstado(r.ok ? 'ok' : 'erro')
    })
  }

  if (estado === 'ok') {
    return (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-800">
        <Check className="size-4 shrink-0" />
        {t('confirmado')}
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-900">
        <BellRing className="size-4 text-marca" />
        {t('titulo')}
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (estado === 'erro') setEstado('idle')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enviar()
          }}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-[14px] outline-none transition-colors focus:border-marca"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={pendente || !email.trim()}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-marca px-4 text-[13px] font-bold text-white transition-opacity',
            'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {pendente && <Loader2 className="size-3.5 animate-spin" />}
          {t('botao')}
        </button>
      </div>
      {estado === 'erro' && (
        <p className="mt-2 text-[12px] font-semibold text-red-600">
          {t('erro')}
        </p>
      )}
    </div>
  )
}
