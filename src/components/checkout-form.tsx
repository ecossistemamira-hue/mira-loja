'use client'

import { Check, Loader2, Store, TicketPercent, Truck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState, useTransition } from 'react'

import { finalizarCheckout } from '@/app/checkout/checkout-actions'
import { validarCupom } from '@/app/cupom-actions'
import { cotarFreteCarrinho, type FreteCarrinhoResultado } from '@/app/frete-actions'
import { CheckoutSchema } from '@/lib/checkout-schema'
import { cn } from '@/lib/cn'
import { formatarPreco } from '@/lib/format'
import { cidadesPorDepartamento, obterCidade } from '@/lib/frete'

type Metodo = 'envio' | 'retirada'
type GruposFrete = Extract<FreteCarrinhoResultado, { ok: true }>['grupos']

export type CheckoutDefaults = {
  nome?: string
  email?: string
  telefone?: string
  documento?: string
}

export function CheckoutForm({
  defaults,
  permiteRetirada = true,
}: {
  defaults?: CheckoutDefaults
  /** false quando alguma franquia do carrinho não aceita retirada (0096). */
  permiteRetirada?: boolean
}) {
  const t = useTranslations('checkout')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState(defaults?.nome ?? '')
  const [email, setEmail] = useState(defaults?.email ?? '')
  const [telefone, setTelefone] = useState(defaults?.telefone ?? '')
  const [documento, setDocumento] = useState(defaults?.documento ?? '')
  const [metodo, setMetodo] = useState<Metodo>('envio')
  const [cidadeId, setCidadeId] = useState<number | ''>('')
  const [gruposFrete, setGruposFrete] = useState<GruposFrete | null>(null)
  const [cotando, setCotando] = useState(false)
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [referencia, setReferencia] = useState('')
  const [bairro, setBairro] = useState('')

  // Cupom: digitado → validado no servidor → aplicado (código + desconto).
  const [cupomInput, setCupomInput] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string
    desconto: number
  } | null>(null)
  const [cupomErro, setCupomErro] = useState<string | null>(null)
  const [validandoCupom, setValidandoCupom] = useState(false)

  const aplicarCupom = () => {
    if (!cupomInput.trim()) return
    setCupomErro(null)
    setValidandoCupom(true)
    void validarCupom(cupomInput).then((r) => {
      setValidandoCupom(false)
      if (r.ok) {
        setCupomAplicado({ codigo: r.codigo, desconto: r.descontoTotal })
      } else {
        setCupomAplicado(null)
        setCupomErro(t(`cupom_erro_${r.error}`))
      }
    })
  }

  const removerCupom = () => {
    setCupomAplicado(null)
    setCupomInput('')
    setCupomErro(null)
  }

  const grupos = useMemo(() => cidadesPorDepartamento(), [])
  const cidadeSelecionada = cidadeId === '' ? null : obterCidade(cidadeId)

  // Cota o frete do carrinho pra cidade escolhida (recalculado no servidor).
  const escolherCidade = (id: number | '') => {
    setCidadeId(id)
    setGruposFrete(null)
    if (id === '') return
    setCotando(true)
    void cotarFreteCarrinho(id).then((r) => {
      setCotando(false)
      setGruposFrete(r.ok ? r.grupos : null)
    })
  }

  const enviar = () => {
    setErro(null)
    const input = {
      nome,
      email,
      telefone,
      documento,
      cupom: cupomAplicado?.codigo ?? undefined,
      metodoEntrega: metodo,
      cidadeEntregaId: cidadeId === '' ? undefined : cidadeId,
      endereco:
        metodo === 'envio'
          ? {
              logradouro,
              numero,
              complemento: referencia,
              bairro,
              cidade: cidadeSelecionada?.cidade ?? '',
              estado: cidadeSelecionada?.departamento ?? '',
              pais: 'PY',
            }
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
        } else if (r.error === 'frete:peso_excede') {
          setErro(t('erro_frete_peso'))
        } else if (r.error === 'retirada_indisponivel') {
          setMetodo('envio')
          setErro(t('erro_retirada_indisponivel'))
        } else if (r.error.startsWith('cupom:')) {
          setCupomAplicado(null)
          setErro(t('erro_cupom_finalizar'))
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
          {permiteRetirada && (
            <OpcaoEntrega
              ativo={metodo === 'retirada'}
              onClick={() => setMetodo('retirada')}
              icon={<Store className="size-4" />}
              label={t('metodo_retirada')}
            />
          )}
        </div>

        {metodo === 'envio' ? (
          <>
            {/* Cidade de destino (tabela AEX) */}
            <label className="mb-4 flex flex-col gap-1">
              <span className="text-[12.5px] font-semibold text-gray-700">
                {t('cidade_entrega')}
              </span>
              <select
                value={cidadeId}
                onChange={(e) =>
                  escolherCidade(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-[14px] outline-none focus:border-marca/40"
              >
                <option value="">{t('cidade_placeholder')}</option>
                {grupos.map((g) => (
                  <optgroup key={g.departamento} label={g.departamento}>
                    {g.cidades.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cidade}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {/* Cotação AEX da cidade escolhida */}
            {cidadeId !== '' && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-[13px]">
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-800">
                    {t('frete_servico_aex')}
                  </span>
                  <span className="block text-[12px] text-gray-500">
                    {t('frete_fonte')}
                  </span>
                </span>
                <span className="shrink-0 font-bold">
                  {cotando ? (
                    <Loader2 className="size-4 animate-spin text-gray-400" />
                  ) : (
                    gruposFrete?.map((g, i) =>
                      g.cotacao.ok ? (
                        <span key={i} className="ml-2">
                          {formatarPreco(g.cotacao.valor)}
                        </span>
                      ) : (
                        <span key={i} className="ml-2 text-[12px] font-medium text-amber-700">
                          {t('erro_frete_peso')}
                        </span>
                      ),
                    )
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <Campo label={t('logradouro')} value={logradouro} onChange={setLogradouro} className="sm:col-span-4" />
              <Campo label={t('numero')} value={numero} onChange={setNumero} className="sm:col-span-2" />
              <Campo label={t('referencia')} value={referencia} onChange={setReferencia} className="sm:col-span-4" />
              <Campo label={t('bairro')} value={bairro} onChange={setBairro} className="sm:col-span-2" />
            </div>
          </>
        ) : (
          <p className="text-[13px] text-gray-500">{t('retirada_dica')}</p>
        )}
      </section>

      {/* Cupom de desconto */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <TicketPercent className="size-4 text-gray-400" />
          {t('cupom_titulo')}
        </h2>
        {cupomAplicado ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-2.5">
            <span className="inline-flex min-w-0 items-center gap-2 text-[13px]">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span className="truncate font-semibold text-emerald-800">
                {t('cupom_aplicado', { codigo: cupomAplicado.codigo })}
              </span>
              <span className="shrink-0 font-bold text-emerald-700">
                − {formatarPreco(cupomAplicado.desconto)}
              </span>
            </span>
            <button
              type="button"
              onClick={removerCupom}
              aria-label={t('cupom_remover')}
              className="shrink-0 rounded-full p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={cupomInput}
                onChange={(e) => setCupomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    aplicarCupom()
                  }
                }}
                placeholder={t('cupom_placeholder')}
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 font-mono text-[14px] uppercase outline-none focus:border-marca/40"
              />
              <button
                type="button"
                onClick={aplicarCupom}
                disabled={validandoCupom || !cupomInput.trim()}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:border-marca/40 hover:text-marca disabled:opacity-50"
              >
                {validandoCupom && <Loader2 className="size-3.5 animate-spin" />}
                {t('cupom_aplicar')}
              </button>
            </div>
            {cupomErro && (
              <p className="mt-2 text-[12.5px] font-medium text-red-600">
                {cupomErro}
              </p>
            )}
          </>
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
