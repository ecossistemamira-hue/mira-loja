'use client'

import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { UserMenu } from '@/components/user-menu'

const EVENTO_CARRINHO = 'mira:carrinho'

/** Chamar após mutações de carrinho/sessão pro badge do header atualizar. */
export function notificarHeaderInfo() {
  window.dispatchEvent(new Event(EVENTO_CARRINHO))
}

/**
 * Ilha client do header: badge do carrinho + menu do comprador. Os dados
 * por-visitante saem do caminho de renderização do servidor (que agora só
 * monta o shell público) e chegam via /api/header-info depois do paint.
 * Re-busca ao trocar de rota e no evento de mutação do carrinho.
 */
export function HeaderContaCarrinho() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [info, setInfo] = useState<{ itens: number; nome: string | null }>({
    itens: 0,
    nome: null,
  })
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    let ativo = true
    const buscar = () =>
      fetch('/api/header-info')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (ativo && d) setInfo({ itens: d.itens ?? 0, nome: d.nome ?? null })
        })
        .catch(() => {})
        .finally(() => {
          if (ativo) setCarregou(true)
        })

    buscar()
    const onEvento = () => buscar()
    window.addEventListener(EVENTO_CARRINHO, onEvento)
    return () => {
      ativo = false
      window.removeEventListener(EVENTO_CARRINHO, onEvento)
    }
    // pathname na dependência: login/logout e navegações re-validam o estado.
  }, [pathname])

  return (
    <>
      <Link
        href="/carrinho"
        className="relative grid size-9 place-items-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-marca"
        aria-label={t('carrinho')}
      >
        <ShoppingCart className="size-[18px]" />
        {info.itens > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-marca px-1 text-[10px] font-bold leading-4 text-white">
            {info.itens}
          </span>
        )}
      </Link>

      {/* Evita flash "Entrar" pra quem está logado: segura o slot até saber. */}
      {carregou ? (
        <UserMenu usuarioNome={info.nome} />
      ) : (
        <span className="hidden h-9 w-[88px] sm:block" aria-hidden />
      )}
    </>
  )
}
