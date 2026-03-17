"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api, ApiError } from "@/lib/api-client"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const response = await api.register({ name, email, password })

      if (response.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(response.error || "Error al crear la cuenta")
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Ha ocurrido un error. Intenta de nuevo.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input
          id="name"
          name="name"
          placeholder="Tu nombre"
          type="text"
          autoCapitalize="words"
          autoComplete="name"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          placeholder="tu@email.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={isLoading}
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Minimo 8 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear cuenta
      </Button>

      <div className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          Al crear tu cuenta obtendras:
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Acceso a lecciones gratuitas
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Diario de reflexiones personal
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Acceso a la comunidad
          </li>
        </ul>
      </div>
    </form>
  )
}
