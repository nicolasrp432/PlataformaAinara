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
import { Loader2, AlertCircle, CheckCircle2, MailCheck } from "lucide-react"

const MIN_PASSWORD_LENGTH = 8

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectTarget(searchParams.get("redirect"))

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [errorKind, setErrorKind] = React.useState<AuthErrorKind | null>(null)
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)
  const [resendState, setResendState] = React.useState<"idle" | "sending" | "sent">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrorKind(null)

    const formData = new FormData(event.currentTarget)
    const name = (formData.get("name") as string).trim()
    const email = normalizeEmail(formData.get("email") as string)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Las dos contraseñas no coinciden.")
      setIsLoading(false)
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      setIsLoading(false)
      return
    }

    if (supabaseEnvIsPlaceholder()) {
      setError(SUPABASE_ENV_MESSAGE)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Tras confirmar el email el usuario entra directamente a la
          // plataforma en su nivel gratuito. Ya no hay cola de aprobación.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          data: {
            full_name: name,
            avatar_url: null,
            role: "student",
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted_at: new Date().toISOString(),
          },
        },
      })

      if (authError) {
        const friendly = describeAuthError(authError)
        setError(friendly.message)
        setErrorKind(friendly.kind)
        return
      }

      if (data.session) {
        // Confirmación de email desactivada en Supabase → dentro al instante.
        router.push(redirectTo)
        router.refresh()
        return
      }

      if (data.user) {
        setPendingEmail(email)
      }
    } catch (err) {
      const friendly = describeAuthError(err as { message?: string })
      setError(friendly.message)
      setErrorKind(friendly.kind)
    } finally {
      setIsLoading(false)
    }
  }

  async function resendConfirmation(email: string) {
    setResendState("sending")
    try {
      const supabase = createClient()
      await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      setResendState("sent")
    } catch {
      setResendState("idle")
    }
  }

  if (pendingEmail) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <MailCheck className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Confirma tu email
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Te hemos enviado un enlace a{" "}
            <span className="font-medium text-foreground break-all">{pendingEmail}</span>.
            Ábrelo y entrarás directamente a la plataforma.
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-left text-sm text-muted-foreground">
          ¿No lo ves? Revisa la carpeta de spam o promociones — suele llegar en
          menos de un minuto.
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={resendState !== "idle"}
            onClick={() => resendConfirmation(pendingEmail)}
          >
            {resendState === "sending" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            )}
            {resendState === "sent"
              ? "Enlace reenviado"
              : "Reenviar enlace de confirmación"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/login")}>
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    )
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
          {errorKind === "email_taken" && (
            <Link
              href="/login"
              className="ml-6 inline-block font-medium underline underline-offset-4"
            >
              Iniciar sesión
            </Link>
          )}
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
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          disabled={isLoading}
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Mínimo {MIN_PASSWORD_LENGTH} caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repite la contraseña</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        Crear cuenta
      </Button>

      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4">
        <p className="text-xs font-medium text-foreground">
          Tu cuenta gratuita incluye:
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {[
            "La primera clase de cada formación, completa",
            "Tu diario de reflexión diaria",
            "Tu progreso y tus logros guardados",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2
                className="mt-px h-3.5 w-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="pt-1 text-xs text-muted-foreground">
          Sin tarjeta. Suscríbete cuando quieras seguir.
        </p>
      </div>
    </form>
  )
}
