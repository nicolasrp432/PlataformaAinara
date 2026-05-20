"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, CheckCircle2, XCircle, AlertCircle, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface BillingClientProps {
  subscription: Subscription | null
  portalUrl: string | null
  userEmail: string
}

const statusConfig = {
  active: { label: "Activa", color: "bg-emerald-500/20 text-emerald-700 border-emerald-300/50", icon: CheckCircle2 },
  trialing: { label: "En prueba", color: "bg-blue-500/20 text-blue-700 border-blue-300/50", icon: CheckCircle2 },
  past_due: { label: "Pago pendiente", color: "bg-amber-500/20 text-amber-700 border-amber-300/50", icon: AlertCircle },
  canceled: { label: "Cancelada", color: "bg-rose-500/20 text-rose-700 border-rose-300/50", icon: XCircle },
  inactive: { label: "Sin suscripción", color: "bg-muted text-muted-foreground border-border/60", icon: XCircle },
}

export function BillingClient({ subscription, portalUrl, userEmail }: BillingClientProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const status = subscription?.status ?? "inactive"
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.inactive
  const StatusIcon = cfg.icon

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

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

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-light">Suscripción</h1>
        <p className="mt-1 text-muted-foreground">Gestiona tu acceso y facturación</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-card p-6"
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Plan Premium</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Badge className={`border ${cfg.color} flex items-center gap-1.5`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>

        {status === "active" || status === "trialing" ? (
          <div className="space-y-4">
            {periodEnd && (
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {subscription?.cancel_at_period_end ? "Cancela el" : "Próxima renovación"}
                </span>
                <span className="font-medium">{periodEnd}</span>
              </div>
            )}
            {subscription?.cancel_at_period_end && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Tu suscripción se cancelará al final del período actual. Puedes reactivarla desde el portal.</span>
              </div>
            )}
            {portalUrl ? (
              <Button className="w-full" variant="outline" asChild>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  Gestionar suscripción
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Activa tu suscripción para obtener acceso completo a todas las formaciones,
              la comunidad y los recursos exclusivos.
            </p>
            <div className="space-y-2">
              {[
                "Todas las formaciones completas",
                "Comunidad privada La Taberna",
                "Sesiones de mentoría grupal",
                "Certificados verificables",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              size="lg"
              onClick={startCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Activar suscripción — €97/mes
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
