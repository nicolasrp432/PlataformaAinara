"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { saveNatalChart } from "@/app/(platform)/profile/actions"
import type { NatalChartData } from "@/types"

interface NatalChartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// URL del proyecto carta-natal desplegado por separado en Vercel.
const CARTA_NATAL_URL =
  process.env.NEXT_PUBLIC_CARTA_NATAL_URL || "https://carta-natal.vercel.app"

export function NatalChartModal({ open, onOpenChange }: NatalChartModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const iframeSrc =
    open && typeof window !== "undefined"
      ? `${CARTA_NATAL_URL}?embedded=true&origin=${encodeURIComponent(window.location.origin)}`
      : "about:blank"

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      // Validar el origen: solo aceptamos mensajes del proyecto carta-natal
      let cartaOrigin: string
      try {
        cartaOrigin = new URL(CARTA_NATAL_URL).origin
      } catch {
        return
      }
      if (event.origin !== cartaOrigin) return

      const payload = event.data
      if (!payload || payload.type !== "natal-chart-calculated") return
      if (savingRef.current) return

      savingRef.current = true
      setSaving(true)
      try {
        const result = await saveNatalChart(payload.data as NatalChartData)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Carta natal guardada en tu perfil ✨")
          onOpenChange(false)
          router.refresh()
        }
      } catch {
        toast.error("No se pudo guardar la carta natal.")
      } finally {
        savingRef.current = false
        setSaving(false)
      }
    },
    [onOpenChange, router]
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [open, handleMessage])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden h-[85vh] flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/50">
          <DialogTitle>Calcula tu Carta Natal</DialogTitle>
          <DialogDescription>
            Introduce los datos de tu nacimiento. Al terminar, pulsa
            &laquo;Guardar en mi perfil&raquo; y los datos se guardarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-0">
          {saving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Guardando tu carta natal…</p>
              </div>
            </div>
          )}
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title="Carta Natal"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
