"use client"

import * as React from "react"
import Link from "next/link"
import { Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "mitra:cookie-notice"

/**
 * Aviso informativo de cookies, no bloqueante.
 *
 * La plataforma solo usa cookies técnicas (sesión de Supabase y la caché de rol
 * y acceso del middleware), exentas de consentimiento previo según el art. 22.2
 * de la LSSI-CE. No hay analítica ni publicidad, así que no procede un banner
 * de consentimiento con bloqueo: basta con informar y enlazar la política.
 */
export function CookieNotice() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      /* navegador sin almacenamiento: no insistimos */
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignorar */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="safe-bottom fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Cookie className="h-4.5 w-4.5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-foreground">
            Solo usamos cookies necesarias para mantener tu sesión. Sin analítica
            ni publicidad.{" "}
            <Link href="/cookies" className="text-primary underline underline-offset-4">
              Más detalles
            </Link>
            .
          </p>
          <Button size="sm" onClick={dismiss} className="mt-3">
            Entendido
          </Button>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
