"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface RegisterModalProps {
  open: boolean
  onClose: () => void
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCheckingOut, setIsCheckingOut] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  async function startCheckout() {
    setIsCheckingOut(true)
    try {
      const res = await fetch("/api/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setIsCheckingOut(false)
    }
  }

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setError(null)
      setSuccess(false)
      setIsLoading(false)
    }
  }, [open])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = new FormData(e.currentTarget)
    const name = data.get("name") as string
    const email = data.get("email") as string
    const password = data.get("password") as string
    const confirm = data.get("confirm") as string

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/pending`,
          data: { full_name: name, avatar_url: null, role: "student" },
        },
      })

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "Este email ya está registrado. Inicia sesión."
            : authError.message
        )
        return
      }

      if (authData.user && !authData.session) {
        setSuccess(true)
      } else if (authData.session) {
        router.push("/pending")
        router.refresh()
        onClose()
      }
    } catch {
      setError("Ocurrió un error. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
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
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Sendero</p>
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
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="font-display mb-3 text-3xl font-light">¡Registro exitoso!</h2>
                  <p className="mb-2 text-muted-foreground leading-relaxed">
                    Hemos enviado un enlace de confirmación a tu email.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Una vez confirmada tu cuenta, activa tu acceso pagando la suscripción o espera la aprobación manual.
                  </p>
                  <div className="mt-8 w-full space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                      onClick={startCheckout}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Activar acceso ahora — €97/mes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full" onClick={onClose}>
                      Confirmaré mi email después
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="font-display mb-2 text-4xl font-light tracking-tight">
                      Crea tu cuenta
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Regístrate y solicita acceso a la plataforma. El equipo revisará tu solicitud.
                    </p>
                  </div>

                  {/* Access notice */}
                  <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-foreground/80">¿Cómo obtener acceso?</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Completa el pago de suscripción, o
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Espera la aprobación manual del equipo
                      </li>
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
                      <Input id="reg-email" name="email" type="email" placeholder="tu@email.com" autoComplete="email" disabled={isLoading} required />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Contraseña</Label>
                      <Input id="reg-password" name="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" disabled={isLoading} required minLength={8} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
                      <Input id="reg-confirm" name="confirm" type="password" placeholder="Repite tu contraseña" autoComplete="new-password" disabled={isLoading} required />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear cuenta
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
