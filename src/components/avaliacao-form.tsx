'use client'

import { CheckCircle2, Loader2, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useTransition } from 'react'

import { enviarAvaliacao, obterMinhaAvaliacao } from '@/app/avaliacoes-actions'
import { cn } from '@/lib/cn'
import { createBrowserSupabase } from '@/lib/supabase-browser'

/**
 * Form de avaliação do produto. Exige login (sessão Supabase do comprador);
 * deslogado vê o convite pra entrar. Quem já avaliou edita a própria avaliação.
 */
export function AvaliacaoForm({ produtoId }: { produtoId: string }) {
  const t = useTranslations('avaliacoes')
  const router = useRouter()
  const [pending, start] = useTransition()

  const [logado, setLogado] = useState<boolean | null>(null)
  const [jaAvaliou, setJaAvaliou] = useState(false)
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [comentario, setComentario] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    let ativo = true
    const supabase = createBrowserSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!ativo) return
      setLogado(Boolean(user))
      if (user) {
        const minha = await obterMinhaAvaliacao(produtoId)
        if (ativo && minha) {
          setJaAvaliou(true)
          setNota(minha.nota)
          setTitulo(minha.titulo ?? '')
          setComentario(minha.comentario ?? '')
        }
      }
    })
    return () => {
      ativo = false
    }
  }, [produtoId])

  const enviar = () => {
    setErro(null)
    if (nota < 1) {
      setErro(t('erro_nota'))
      return
    }
    start(async () => {
      const r = await enviarAvaliacao({ produtoId, nota, titulo, comentario })
      if (!r.ok) {
        setErro(r.error === 'nao_logado' ? t('erro_login') : t('erro_generico'))
        return
      }
      setSucesso(true)
      setJaAvaliou(true)
      router.refresh()
    })
  }

  if (logado === null) return null

  if (!logado) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <p className="text-[13.5px] text-gray-600">
          {t('login_convite')}{' '}
          <Link href="/entrar" className="font-semibold text-marca hover:underline">
            {t('login_link')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold">
        {jaAvaliou ? t('titulo_editar') : t('titulo_nova')}
      </h3>

      {/* Seletor de nota */}
      <div className="mb-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={t('nota_aria', { n })}
            className="p-0.5"
          >
            <Star
              className={cn(
                'size-7 transition-colors',
                n <= (hover || nota)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200',
              )}
            />
          </button>
        ))}
        {nota > 0 && (
          <span className="ml-2 text-[13px] font-semibold text-gray-600">
            {t(`nota_${nota}`)}
          </span>
        )}
      </div>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={t('titulo_placeholder')}
        maxLength={80}
        className="mb-2.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-[14px] outline-none focus:border-marca/40"
      />
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder={t('comentario_placeholder')}
        maxLength={2000}
        rows={3}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] outline-none focus:border-marca/40"
      />

      {erro && <p className="mb-3 text-[13px] font-medium text-red-600">{erro}</p>}
      {sucesso && (
        <p className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
          <CheckCircle2 className="size-4" />
          {t('sucesso')}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
        style={{ background: '#a02237' }}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {jaAvaliou ? t('atualizar') : t('enviar')}
      </button>
    </div>
  )
}
