import { cn } from "@/lib/utils"

/**
 * Portada generada: SVG en línea, sin ninguna petición de red, determinista a
 * partir de `seed` (normalmente el slug). Es lo que se ve cuando una formación,
 * módulo o lección no tiene `thumbnail_url`, o cuando la imagen configurada
 * falla al cargar. Usa la paleta dorada del sistema para que parezca una
 * portada intencional y no un hueco.
 */

/** djb2 — hash estable entre servidor y cliente (nada de Math.random). */
function hashSeed(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Parejas de color derivadas del oro Mitra, con suficiente contraste entre sí. */
const PALETTES: { from: string; via: string; to: string }[] = [
  { from: "#2A2216", via: "#6B5220", to: "#B8902E" },
  { from: "#1F2420", via: "#3E4A38", to: "#8FA05B" },
  { from: "#2A1D1A", via: "#6A3F2C", to: "#C08552" },
  { from: "#1C1F2A", via: "#3A415C", to: "#8792B8" },
  { from: "#241A24", via: "#553B52", to: "#A8739B" },
  { from: "#22201A", via: "#5C5230", to: "#D3B65C" },
]

interface FormationCoverProps {
  /** Valor estable (slug o id) del que se derivan colores y patrón. */
  seed: string
  /** Si se pasa, se dibuja sobre la portada. */
  title?: string | null
  className?: string
}

export function FormationCover({ seed, title, className }: FormationCoverProps) {
  const hash = hashSeed(seed || "mitra")
  const palette = PALETTES[hash % PALETTES.length]
  const rotation = hash % 90
  const gradientId = `cover-grad-${hash}`
  const patternId = `cover-pattern-${hash}`

  return (
    <div className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}>
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="55%" stopColor={palette.via} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
          <pattern
            id={patternId}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${rotation})`}
          >
            <circle cx="24" cy="24" r="1.5" fill="#F6D25C" fillOpacity="0.28" />
            <path
              d="M0 24 H48 M24 0 V48"
              stroke="#F6D25C"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="640" height="360" fill={`url(#${gradientId})`} />
        <rect width="640" height="360" fill={`url(#${patternId})`} />

        {/* Halo dorado suave, desplazado según el hash */}
        <circle
          cx={120 + (hash % 400)}
          cy={60 + (hash % 240)}
          r="150"
          fill="#F6D25C"
          fillOpacity="0.10"
        />
        <rect width="640" height="360" fill="#000000" fillOpacity="0.20" />
      </svg>

      {title && (
        <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
          <span className="font-display text-balance text-lg font-light leading-tight text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-2xl">
            {title}
          </span>
        </div>
      )}
    </div>
  )
}
