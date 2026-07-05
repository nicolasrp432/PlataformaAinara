import { cn } from "@/lib/utils"
import { SenderoLogo } from "@/components/ui/logo"

/**
 * Marca "Mitra" — única fuente de verdad del lockup de marca.
 * El wordmark usa siempre la tipografía display (Cormorant Garamond)
 * en tamaño ≥ text-lg: la fuente rinde mal por debajo de ese cuerpo.
 */

const MARK_SIZES = {
  sm: { tile: "h-8 w-8 rounded-lg", icon: "h-5 w-5" },
  md: { tile: "h-10 w-10 rounded-xl", icon: "h-6 w-6" },
  lg: { tile: "h-14 w-14 rounded-2xl", icon: "h-8 w-8" },
} as const

export type BrandMarkSize = keyof typeof MARK_SIZES

export function BrandMark({
  size = "sm",
  className,
}: {
  size?: BrandMarkSize
  className?: string
}) {
  const s = MARK_SIZES[size]
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center gold-gradient shadow-sm text-white",
        s.tile,
        className
      )}
    >
      <SenderoLogo className={s.icon} />
    </div>
  )
}

const WORDMARK_SIZES = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
} as const

export function Wordmark({
  size = "sm",
  className,
}: {
  size?: keyof typeof WORDMARK_SIZES
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-display font-semibold tracking-wide text-foreground leading-none",
        WORDMARK_SIZES[size],
        className
      )}
    >
      Mitra
    </span>
  )
}

export function BrandLockup({
  size = "sm",
  withTagline = false,
  className,
}: {
  size?: BrandMarkSize
  withTagline?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <BrandMark size={size} />
      <div className="min-w-0 flex flex-col justify-center">
        <Wordmark size={size} className="block" />
        {withTagline && (
          <span className="text-[10px] text-primary tracking-widest uppercase font-medium leading-none mt-0.5">
            Desde la raíz
          </span>
        )}
      </div>
    </div>
  )
}
