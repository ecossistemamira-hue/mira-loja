'use client'

import { Loader2, Store, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { finalizarCheckout } from '@/app/checkout/checkout-actions'
import { CheckoutSchema } from '@/lib/checkout-schema'
import { cn } from '@/lib/cn'

type Metodo = 'envio' | 'retirada'

export type CheckoutDefaults = {
  nome?: string
  email?: string
  telefone?: string
  documento?: string
}

export function CheckoutForm({ defaults }: { defaults?: CheckoutDefaults }) {
  const t = useTranslations('checkout')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState(defaults?.nome ?? '')
  const [email, setEmail] = useState(defaults?.email ?? '')
  const [telefone, setTelefone] = useState(defaults?.telefone ?? '')
  const [documento, setDocumento] = useState(defaults?.documento ?? '')
  const [metodo, setMetodo] = useState<Metodo>('envio')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [pais, setPais] = useState('PY')

  const enviar = () => {
    setErro(null)
    const input = {
      nome,
      email,
      telefone,
      documento,
      metodoEntrega: metodo,
      endereco:
        metodo === 'envio'
          ? { cep, logradouro, numero, complemento, bairro, cidade, estado, pais }
          : undefined,
    }
    const parsed = CheckoutSchema.safeParse(input)
    if (!parsed.success) {
      setErro(t('erro_campos'))
      return
    }
    start(async () => {
      const r = await finalizarCheckout(parsed.data)
      if (!r.ok) {
        if (r.error.startsWith('sem_estoque:')) {
          setErro(t('erro_sem_estoque', { produto: r.error.split(':')[1] ?? '' }))
        } else if (r.error === 'carrinho_vazio') {
          setErro(t('erro_carrinho_vazio'))
        } else {
          setErro(t('erro_generico'))
        }
        return
      }
      const codigos = r.pedidos.map((p) => p.codigo).join(',')
      router.push(`/checkout/sucesso?codigos=${encodeURIComponent(codigos)}`)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Identificação */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold">{t('secao_identificacao')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo label={t('nome')} value={nome} onChange={setNome} className="sm:col-span-2" />
          <Campo label={t('email')} value={email} onChange={setEmail} type="email" />
          <Campo label={t('telefone')} value={telefone} onChange={setTelefone} />
          <Campo label={t('documento')} value={documento} onChange={setDocumento} className="sm:col-span-2" />
        </div>
      </section>

      {/* Entrega */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold">{t('secao_entrega')}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <OpcaoEntrega
            ativo={metodo === 'envio'}
            onClick={() => setMetodo('envio')}
            icon={<Truck className="size-4" />}
            label={t('metodo_envio')}
          />
          <OpcaoEntrega
            ativo={metodo === 'retirada'}
            onClick={() => setMetodo('retirada')}
            icon={<Store className="size-4" />}
            label={t('metodo_retirada')}
          />
        </div>

        {metodo === 'envio' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <Campo label={t('cep')} value={cep} onChange={setCep} className="sm:col-span-2" />
            <Campo label={t('logradouro')} value={logradouro} onChange={setLogradouro} className="sm:col-span-3" />
            <Campo label={t('numero')} value={numero} onChange={setNumero} className="sm:col-span-1" />
            <Campo label={t('complemento')} value={complemento} onChange={setComplemento} className="sm:col-span-2" />
            <Campo label={t('bairro')} value={bairro} onChange={setBairro} className="sm:col-span-2" />
            <Campo label={t('cidade')} value={cidade} onChange={setCidade} className="sm:col-span-2" />
            <Campo label={t('estado')} value={estado} onChange={setEstado} className="sm:col-span-3" />
            <Campo label={t('pais')} value={pais} onChange={setPais} className="sm:col-span-3" />
          </div>
        ) : (
          <p className="text-[13px] text-gray-500">{t('retirada_dica')}</p>
        )}
      </section>

      {erro && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-60"
        style={{ background: '#a02237' }}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t('finalizar')}
      </button>
      <p className="-mt-2 text-[12px] text-gray-400">{t('pagamento_teste_aviso')}</p>
    </div>
  )
}

function Campo({
  label,
  value,
  onChange,
  type = 'text',
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[12.5px] font-semibold text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-gray-300 px-3 text-[14px] outline-none focus:border-marca/40"
      />
    </label>
  )
}

function OpcaoEntrega({
  ativo,
  onClick,
  icon,
  label,
}: {
  ativo: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors',
        ativo
          ? 'border-marca bg-marca-50 text-marca-hover'
          : 'border-gray-300 text-gray-600 hover:border-gray-400',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
