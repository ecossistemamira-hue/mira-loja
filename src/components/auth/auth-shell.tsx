import Image from 'next/image'
import Link from 'next/link'

/** Casca visual das telas de auth: card centrado com o logo. */
export function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 self-center">
        <Image
          src="/logo-horizontal.png"
          alt=""
          width={486}
          height={211}
          className="h-14 w-auto"
        />
      </Link>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-1 text-[13px] text-gray-500">{subtitulo}</p>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export function CampoAuth({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">
        {label}
      </label>
      {children}
    </div>
  )
}

export const INPUT_AUTH =
  'h-11 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-[14px] outline-none transition-colors focus:border-marca/40 focus:bg-white'

export const BOTAO_AUTH =
  'inline-flex h-11 w-full items-center justify-center rounded-xl bg-marca text-[14px] font-bold text-white transition-colors hover:bg-marca-hover disabled:opacity-60'
