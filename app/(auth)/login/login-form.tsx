"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { createClient } from "@/lib/supabase/client"
import { safeRedirectTarget } from "@/lib/access"
import {
  describeAuthError,
  normalizeEmail,
  supabaseEnvIsPlaceholder,
  SUPABASE_ENV_MESSAGE,
  type AuthErrorKind,
} from "@/lib/auth-errors"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // El middleware manda aquí con `?redirect=` cuando alguien intenta abrir una
  // página privada. Respetarlo devuelve a la persona justo donde iba en vez de
  // soltarla en el dashboard y obligarla a volver a navegar.
  const redirectTo = safeRedirectTarget(searchParams.get("redirect"))

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [errorKind, setErrorKind] = React.useState<AuthErrorKind | null>(null)
  const [lastEmail, setLastEmail] = React.useState("")
  const [resendState, setResendState] = React.useState<"idle" | "sending" | "sent">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrorKind(null)

    const formData = new FormData(event.currentTarget)
    const email = normalizeEmail(formData.get("email") as string)
    const password = formData.get("password") as string
    setLastEmail(email)

    if (supabaseEnvIsPlaceholder()) {
      setError(SUPABASE_ENV_MESSAGE)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        const friendly = describeAuthError(authError)
        setError(friendly.message)
        setErrorKind(friendly.kind)
        return
      }

      if (data.user) {
        // El destino final lo decide el middleware según el nivel de acceso;
        // aquí solo respetamos a dónde quería ir la persona.
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err) {
      const friendly = describeAuthError(err as { message?: string })
      setError(friendly.message)
      setErrorKind(friendly.kind)
    } finally {
      setIsLoading(false)
    }
  }

  async function resendConfirmation() {
    if (!lastEmail) return
    setResendState("sending")
    try {
      const supabase = createClient()
      await supabase.auth.resend({
        type: "signup",
        email: lastEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      setResendState("sent")
    } catch {
      setResendState("idle")
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>

          {errorKind === "email_not_confirmed" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-6"
              disabled={resendState !== "idle"}
              onClick={resendConfirmation}
            >
              {resendState === "sending" && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
              )}
              {resendState === "sent" ? "Enlace reenviado" : "Reenviar enlace"}
            </Button>
          )}

          {errorKind === "invalid_credentials" && (
            <Link
              href="/forgot-password"
              className="ml-6 inline-block font-medium underline underline-offset-4"
            >
              Restablecer contraseña
            </Link>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          placeholder="tu@email.com"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          spellCheck={false}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ¿La olvidaste?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        Iniciar sesión
      </Button>
    </form>
  )
}
