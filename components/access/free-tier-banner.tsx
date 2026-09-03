"use client"

import { Sparkles } from "lucide-react"
import { useCheckout } from "@/components/access/upgrade-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Aviso persistente del nivel gratuito.
 *
 * Es una franja, no una tarjeta: se apoya sobre el contenido en vez de
 * competir con él, porque va a estar en pantalla en cada visita. El único
 * acento fuerte es la línea dorada superior — el mismo recurso que corona las
 * tarjetas de la plataforma — para que se lea como parte de la casa.
 */
export function FreeTierBanner({
  className,
  headline = "Estás en el plan gratuito",
  description = "Puedes ver la primera clase de cada formación. Suscríbete para abrir el resto.",
}: {
  className?: string
  headline?: string
  description?: string
}) {
  const { start, isLoading } = useCheckout()

  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25",
        "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
        className
      )}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 gold-gradient" />

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20"
        >
          <Sparkles className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{headline}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>

        <Button
          onClick={start}
          disabled={isLoading}
          className="w-full shrink-0 gold-gradient font-semibold text-[#2A2113] shadow-[0_4px_18px_rgba(246,210,92,0.3)] transition-transform duration-150 ease-out hover:opacity-95 active:scale-[0.985] sm:w-auto"
        >
          {isLoading ? "Abriendo…" : "Desbloquear todo"}
        </Button>
      </div>
    </aside>
  )
}
