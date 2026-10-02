import { useId } from "react"

type MitraLogoProps = {
  className?: string
  variant?: "mono" | "brand"
  title?: string
}

/**
 * El símbolo de Mitra: una persona sostenida por dos vínculos que crecen en
 * forma de M y continúan hacia una raíz común. No contiene referencias
 * astrales para conservar una identidad distinta a la carta natal.
 */
export function MitraLogo({
  className,
  variant = "mono",
  title,
}: MitraLogoProps) {
  const titleId = useId()
  const gradientId = useId()
  const ink = variant === "brand" ? `url(#${gradientId})` : "currentColor"

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {variant === "brand" ? (
        <defs>
          <linearGradient id={gradientId} x1="7" y1="5" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE895" />
            <stop offset="0.48" stopColor="#E9B93F" />
            <stop offset="1" stopColor="#9B6C16" />
          </linearGradient>
        </defs>
      ) : null}
      <circle cx="16" cy="6.3" r="2.45" fill={ink} />
      <path
        d="M5.5 21.7V15c0-3.5 4.3-5 6.25-2.05L16 19.35l4.25-6.4C22.2 10 26.5 11.5 26.5 15v6.7"
        stroke={ink}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 18.9v8.4M16 23.1l-4.25 4.15M16 23.1l4.25 4.15"
        stroke={ink}
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.9 20.5c2.35.25 4.05 1.1 5.15 2.35M24.1 20.5c-2.35.25-4.05 1.1-5.15 2.35" stroke={ink} strokeWidth="1.25" strokeLinecap="round" opacity=".7" />
    </svg>
  )
}
