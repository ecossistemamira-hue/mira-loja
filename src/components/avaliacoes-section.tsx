import { BadgeCheck } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { AvaliacaoForm } from '@/components/avaliacao-form'
import { StarRating } from '@/components/star-rating'
import type { ResumoAvaliacoes } from '@/lib/avaliacoes'

/** Bloco de avaliações da página do produto: resumo + lista + form. */
export async function AvaliacoesSection({
  produtoId,
  resumo,
}: {
  produtoId: string
  resumo: ResumoAvaliacoes
}) {
  const t = await getTranslations('avaliacoes')
  const locale = await getLocale()
  const bcp47 = locale === 'es' ? 'es-PY' : 'pt-BR'

  return (
    <section
      id="avaliacoes"
      className="mt-8 scroll-mt-20 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-4 font-display text-[17px] font-bold text-gray-900">
        {t('secao_titulo')}
        {resumo.total > 0 && (
          <span className="ml-2 text-[13px] font-semibold text-gray-400">
            ({resumo.total})
          </span>
        )}
      </h2>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Resumo + distribuição */}
        <div>
          {resumo.total > 0 ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-black text-gray-900">
                  {resumo.media.toLocaleString(bcp47, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <div className="pb-1.5">
                  <StarRating nota={resumo.media} />
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    {t('n_avaliacoes', { n: resumo.total })}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1.5">
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const qtd = resumo.distribuicao[n]
                  const pct = resumo.total > 0 ? (qtd / resumo.total) * 100 : 0
                  return (
                    <div key={n} className="flex items-center gap-2 text-[12px]">
                      <span className="w-3 shrink-0 text-right font-semibold text-gray-600">
                        {n}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-gray-400">{qtd}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-[13.5px] text-gray-500">{t('vazio')}</p>
          )}

          <div className="mt-5">
            <AvaliacaoForm produtoId={produtoId} />
          </div>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-4">
          {resumo.avaliacoes.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StarRating nota={a.nota} tamanho={14} />
                {a.titulo && (
                  <span className="text-[13.5px] font-bold text-gray-900">
                    {a.titulo}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
                <span className="font-semibold text-gray-700">{a.nome_exibicao}</span>
                <span>·</span>
                <time dateTime={a.created_at}>
                  {new Date(a.created_at).toLocaleDateString(bcp47, {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
                {a.compra_verificada && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                    <BadgeCheck className="size-3" />
                    {t('compra_verificada')}
                  </span>
                )}
              </div>
              {a.comentario && (
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-gray-700">
                  {a.comentario}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
