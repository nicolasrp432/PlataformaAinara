"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"

export default function LessonError({
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
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">No se pudo cargar la lección</h2>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error al cargar el contenido. Verifica tu conexión e inténtalo de nuevo.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/library">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <Button onClick={reset} className="bg-primary hover:bg-primary/90">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  )
}
