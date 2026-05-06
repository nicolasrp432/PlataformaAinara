"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Algo salió mal</h1>
          <p className="text-muted-foreground">
            Ocurrió un error inesperado. Puedes intentar recargar la página.
          </p>
        </div>
        <Button onClick={reset} className="bg-primary hover:bg-primary/90">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    </div>
  )
}
