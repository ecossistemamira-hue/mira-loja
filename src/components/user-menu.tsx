'use client'

import { LogOut, Package, UserRound } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

import { sair } from '@/app/auth-actions'
import { cn } from '@/lib/cn'

type Props = {
  /** Nome (ou e-mail) do comprador logado; null = deslogado. */
  usuarioNome: string | null
}

export function UserMenu({ usuarioNome }: Props) {
  const t = useTranslations('auth')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  if (!usuarioNome) {
    return (
      <Link
        href="/entrar"
        className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:border-marca/40 hover:text-marca sm:inline-flex"
      >
        <UserRound className="size-4" />
        {t('entrar')}
      </Link>
    )
  }


  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={t('minha_conta')}
        className={cn(
          'grid size-9 place-items-center rounded-full bg-marca/10 text-[12px] font-extrabold text-marca transition-all hover:bg-marca hover:text-white',
          aberto && 'bg-marca text-white',
        )}
      >
        <UserRound className="size-4" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-gray-900">
              {usuarioNome}
            </p>
          </div>
          <Link
            href="/conta"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50 hover:text-marca"
          >
            <UserRound className="size-4 text-gray-400" />
            {t('minha_conta')}
          </Link>
          <Link
            href="/conta#pedidos"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50 hover:text-marca"
          >
            <Package className="size-4 text-gray-400" />
            {t('meus_pedidos')}
          </Link>
          <button
            type="button"
            onClick={() => sair()}
            className="flex w-full items-center gap-2.5 border-t border-gray-50 px-4 py-2.5 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut className="size-4 text-gray-400" />
            {t('sair')}
          </button>
        </div>
      )}
    </div>
  )
}
