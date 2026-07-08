'use client'

import { Loader2, Store, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { finalizarCheckout } from '@/app/checkout/checkout-actions'
import { cotarFreteCarrinho, type FreteCarrinhoResultado } from '@/app/frete-actions'
import { CheckoutSchema } from '@/lib/checkout-schema'
import { cn } from '@/lib/cn'
import { formatarPreco } from '@/lib/format'
import type { ServicoFrete } from '@/lib/frete'

type Metodo = 'envio' | 'retirada'
type GruposFrete = Extract<FreteCarrinhoResultado, { ok: true }>['grupos']

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
  const [servicoFrete, setServicoFrete] = useState<ServicoFrete>('economico')
  const [gruposFrete, setGruposFrete] = useState<GruposFrete | null>(null)
  const [cotando, setCotando] = useState(false)
  const [erroFrete, setErroFrete] = useState(false)
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [pais, setPais] = useState('PY')

  // Cota o frete quando o comprador sai do campo de CEP (e ao trocar de CEP).
  const cotarFrete = async (cepAtual: string) => {
    if (cepAtual.replace(/\D/g, '').length < 4) return
    setCotando(true)
    setErroFrete(false)
    const r = await cotarFreteCarrinho(cepAtual)
    setCotando(false)
    if (!r.ok) {
      setGruposFrete(null)
      setErroFrete(r.error === 'cep_invalido')
      return
    }
    setGruposFrete(r.grupos)
  }

  const enviar = () => {
    setErro(null)
    const input = {
      nome,
      email,
      telefone,
      documento,
      metodoEntrega: metodo,
      servicoFrete,
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
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <Campo
                label={t('cep')}
                value={cep}
                onChange={setCep}
                onBlur={() => void cotarFrete(cep)}
                className="sm:col-span-2"
              />
              <Campo label={t('logradouro')} value={logradouro} onChange={setLogradouro} className="sm:col-span-3" />
              <Campo label={t('numero')} value={numero} onChange={setNumero} className="sm:col-span-1" />
              <Campo label={t('complemento')} value={complemento} onChange={setComplemento} className="sm:col-span-2" />
              <Campo label={t('bairro')} value={bairro} onChange={setBairro} className="sm:col-span-2" />
              <Campo label={t('cidade')} value={cidade} onChange={setCidade} className="sm:col-span-2" />
              <Campo label={t('estado')} value={estado} onChange={setEstado} className="sm:col-span-3" />
              <Campo label={t('pais')} value={pais} onChange={setPais} className="sm:col-span-3" />
            </div>

            {/* Cotação de frete */}
            <div className="mt-4">
              {cotando && (
                <p className="inline-flex items-center gap-2 text-[13px] text-gray-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t('frete_cotando')}
                </p>
              )}
              {erroFrete && !cotando && (
                <p className="text-[13px] font-medium text-red-600">
                  {t('frete_cep_invalido')}
                </p>
              )}
              {gruposFrete && !cotando && (
                <div className="flex flex-col gap-2">
                  <p className="text-[12.5px] font-semibold text-gray-700">
                    {t('frete_escolha')}
                  </p>
                  {(['economico', 'expresso'] as const).map((servico) => {
                    const linhas = gruposFrete.map((g) => {
                      const op = g.opcoes.find((o) => o.servico === servico)
                      return { g, op }
                    })
                    const prazo = linhas[0]?.op?.prazoDias
                    return (
                      <label
                        key={servico}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-[13px] transition-colors',
                          servicoFrete === servico
                            ? 'border-marca bg-marca-50'
                            : 'border-gray-300 hover:border-gray-400',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="servico-frete"
                            checked={servicoFrete === servico}
                            onChange={() => setServicoFrete(servico)}
                            className="accent-[#a02237]"
                          />
                          <span className="font-semibold">
                            {t(`frete_${servico}`)}
                            {prazo && (
                              <span className="ml-2 font-normal text-gray-500">
                                {t('frete_prazo', { min: prazo.min, max: prazo.max })}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold">
                          {linhas.map(({ g, op }, i) =>
                            op ? (
                              <span key={i} className="ml-2">
                                {op.gratis ? (
                                  <span className="text-emerald-600">
                                    {t('frete_gratis')}
                                  </span>
                                ) : (
                                  formatarPreco(op.valor, g.moeda)
                                )}
                              </span>
                            ) : null,
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </>
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
  onBlur,
  type = 'text',
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
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
        onBlur={onBlur}
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
