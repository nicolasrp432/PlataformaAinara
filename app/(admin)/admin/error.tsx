"use client"
import { Button } from "@/components/ui/button"
export default function AdminError({ reset }: { reset: () => void }) {
  return <div role="alert" className="ainara-panel space-y-4"><h2 className="font-display text-2xl">Esta sección no ha podido cargar.</h2><p className="text-muted-foreground">Inténtalo de nuevo para recuperar los datos.</p><Button onClick={reset}>Volver a intentar</Button></div>
}
