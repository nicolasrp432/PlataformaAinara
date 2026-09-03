"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SPRING_UI } from "@/lib/motion"
import { X, Sparkles, Loader2, AlertCircle, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { createClient } from "@/lib/supabase/client"
import {
  describeAuthError,
  normalizeEmail,
  supabaseEnvIsPlaceholder,
  SUPABASE_ENV_MESSAGE,
} from "@/lib/auth-errors"
import Link from "next/link"

interface RegisterModalProps {
  open: boolean
  onClose: () => void
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [pendingEmail, setPendingEmail] = React.useState("")
  const [resendState, setResendState] = React.useState<"idle" | "sending" | "sent">("idle")

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setError(null)
      setSuccess(false)
      setIsLoading(false)
      setResendState("idle")
    }
  }, [open])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = new FormData(e.currentTarget)
    const name = (data.get("name") as string).trim()
    const email = normalizeEmail(data.get("email") as string)
    const password = data.get("password") as string
    const confirm = data.get("confirm") as string

    if (password !== confirm) {
      setError("Las dos contraseñas no coinciden.")
      setIsLoading(false)
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Al confirmar, el usuario entra directo a la plataforma.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
        setError(describeAuthError(authError).message)
        return
      }

      if (authData.session) {
        // Sin confirmación de email: dentro en el acto.
        router.push("/dashboard")
        router.refresh()
        onClose()
        return
      }

      if (authData.user) {
        setPendingEmail(email)
        setSuccess(true)
      }
    } catch (err) {
      setError(describeAuthError(err as { message?: string }).message)
    } finally {
      setIsLoading(false)
    }
  }

  async function resendConfirmation() {
    if (!pendingEmail) return
    setResendState("sending")
    try {
      const supabase = createClient()
      await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })
      setResendState("sent")
    } catch {
      setResendState("idle")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_UI}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-wide leading-none">Mitra</p>
                  <p className="text-xs text-muted-foreground">Comienza tu transformación</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-1 flex-col items-center justify-center text-center"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <MailCheck className="h-10 w-10 text-primary" aria-hidden />
                  </div>
                  <h2 className="font-display mb-3 text-3xl font-light">
                    Confirma tu email
                  </h2>
                  <p className="mb-2 leading-relaxed text-muted-foreground">
                    Te hemos enviado un enlace a{" "}
                    <span className="font-medium text-foreground break-all">
                      {pendingEmail}
                    </span>
                    .
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ábrelo y entrarás directamente. Tu cuenta gratuita ya incluye
                    la primera clase de cada formación.
                  </p>
                  <div className="mt-8 w-full space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={resendState !== "idle"}
                      onClick={resendConfirmation}
                    >
                      {resendState === "sending" && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      )}
                      {resendState === "sent"
                        ? "Enlace reenviado"
                        : "Reenviar enlace"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={onClose}>
                      Cerrar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="font-display mb-2 text-4xl font-light tracking-tight">
                      Crea tu cuenta
                    </h2>
                    <p className="leading-relaxed text-muted-foreground">
                      Entras al momento, sin tarjeta y sin lista de espera.
                    </p>
                  </div>

                  {/* Qué incluye la cuenta gratuita */}
                  <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-foreground/80">
                      Gratis desde el primer minuto
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {[
                        "La primera clase de cada formación, completa",
                        "Tu diario de reflexión y tu progreso",
                        "Suscríbete cuando quieras abrir el resto",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">Nombre completo</Label>
                      <Input id="reg-name" name="name" placeholder="Tu nombre" autoComplete="name" disabled={isLoading} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" name="email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="tu@email.com" autoComplete="email" disabled={isLoading} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Contraseña</Label>
                      <PasswordInput id="reg-password" name="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" disabled={isLoading} required minLength={8} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
                      <PasswordInput id="reg-confirm" name="confirm" placeholder="Repite tu contraseña" autoComplete="new-password" disabled={isLoading} required />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear cuenta gratis
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" onClick={onClose} className="font-medium text-primary hover:underline">
                      Inicia sesión
                    </Link>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
