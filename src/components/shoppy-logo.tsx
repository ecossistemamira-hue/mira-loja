/**
 * Logo Shoppy — sacola em stroke esmeralda + wordmark minúsculo em slate,
 * como no design handoff. SVG inline: zero request, escala em qualquer fundo.
 */
export function ShoppyLogo({
  iconSize = 30,
  textSize = 22,
  claro = false,
  className,
}: {
  iconSize?: number
  textSize?: number
  /** Wordmark branco pra fundos escuros (footer slate, e-mails). */
  claro?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#087F5B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <span
        className={`font-bold leading-none tracking-[-0.5px] ${claro ? 'text-white' : 'text-noite'}`}
        style={{ fontSize: textSize }}
      >
        shoppy
      </span>
    </span>
  )
}
