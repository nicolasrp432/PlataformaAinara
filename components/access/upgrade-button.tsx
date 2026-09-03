"use client"

import * as React from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Arranca el checkout de Stripe. Es el único punto de entrada al pago en toda
 * la plataforma: si el flujo cambia, cambia aquí y en ningún otro sitio.
 */
export function useCheckout() {
  const [isLoading, setIsLoading] = React.useState(false)

  const start = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      toast.error("No hemos podido abrir el pago", {
        description: data.error ?? "Inténtalo de nuevo en unos segundos.",
      })
    } catch {
      toast.error("Sin conexión con la pasarela de pago", {
        description: "Comprueba tu conexión e inténtalo de nuevo.",
      })
    }
    setIsLoading(false)
  }, [])

  return { start, isLoading }
}

/**
 * Clases del botón, resueltas una sola vez en el módulo.
 *
 * `h-auto` + `whitespace-normal` son deliberados: un botón nunca debe recortar
 * su propia llamada a la acción, y a 320 px «Desbloquear todo el contenido» no
 * cabe en una línea. Prefiero dos líneas antes que unos puntos suspensivos.
 */
const UPGRADE_CLASSES = [
  "w-full gold-gradient font-semibold text-[#2A2113]",
  "shadow-[0_6px_24px_rgba(246,210,92,0.35)]",
  "h-auto min-h-11 whitespace-normal py-2.5 text-center leading-snug",
  "transition-transform duration-150 ease-out hover:opacity-95 active:scale-[0.985]",
].join(" ")

interface UpgradeButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
  label?: string
}

export function UpgradeButton({
  label = "Desbloquear todo el contenido",
  className,
  size = "lg",
  disabled,
  ...props
}: UpgradeButtonProps) {
  const { start, isLoading } = useCheckout()

  return (
    <Button
      {...props}
      size={size}
      onClick={start}
      disabled={isLoading || disabled}
      className={cn(UPGRADE_CLASSES, className)}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="mr-2 h-4 w-4 shrink-0" aria-hidden />
      )}
      <span>{isLoading ? "Abriendo pago seguro…" : label}</span>
    </Button>
  )
}
