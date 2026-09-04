"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, CheckCircle2, XCircle, AlertCircle, ExternalLink, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckoutResultToast } from "@/components/access/checkout-result-toast"
import { PLANS, planPrice, formatPriceDisplay, SINGLE_SESSION_PRICE } from "@/lib/pricing"
import { Infinity as InfinityIcon } from "lucide-react"

interface Subscription {
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface BillingClientProps {
  subscription: Subscription | null
  portalUrl: string | null
  userEmail: string
  /** Pago único ya realizado: acceso permanente al contenido. */
  hasLifetimeAccess: boolean
}

const statusConfig = {
  active: { label: "Activa", color: "bg-success-soft text-success-strong border-success-border", icon: CheckCircle2 },
  trialing: { label: "En prueba", color: "bg-blue-500/20 text-blue-700 border-blue-300/50", icon: CheckCircle2 },
  past_due: { label: "Pago pendiente", color: "bg-warning-soft text-warning-strong border-warning-border", icon: AlertCircle },
  canceled: { label: "Cancelada", color: "bg-danger-soft text-danger-strong border-danger-border", icon: XCircle },
  inactive: { label: "Sin suscripción", color: "bg-muted text-muted-foreground border-border/60", icon: XCircle },
}

export function BillingClient({
  subscription,
  portalUrl,
  userEmail,
  hasLifetimeAccess,
}: BillingClientProps) {
  const [checkingOut, setCheckingOut] = useState<"lifetime" | "membership" | null>(null)

  const status = subscription?.status ?? "inactive"
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.inactive
  const StatusIcon = cfg.icon

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null

  async function startCheckout(plan: "lifetime" | "membership") {
    setCheckingOut(plan)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setCheckingOut(null)
    } catch {
      setCheckingOut(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Suspense fallback={null}>
        <CheckoutResultToast />
      </Suspense>

      <div>
        <h1 className="text-3xl font-light">Suscripción</h1>
        <p className="mt-1 text-muted-foreground">Gestiona tu acceso y facturación</p>
      </div>

      <Suspense fallback={null}>
        <RedirectReason />
      </Suspense>

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
              <div className="flex items-start gap-2 rounded-xl border border-warning-border bg-warning-soft p-4 text-sm text-warning-strong">
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              {hasLifetimeAccess
                ? "Ya tienes todo el contenido. La suscripción añade acompañamiento: mentoría 1 a 1 incluida y talleres en directo."
                : "Con tu cuenta gratuita ves la primera clase de cada formación. El acceso completo se compra una sola vez."}
            </p>
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              size="lg"
              onClick={() => startCheckout("membership")}
              disabled={checkingOut !== null}
            >
              {checkingOut === "membership" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              )}
              Activar acompañamiento — {planPrice(PLANS.membership)}/mes
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Una sesión de mentoría suelta cuesta{" "}
              {formatPriceDisplay(SINGLE_SESSION_PRICE)}
            </p>
          </div>
        )}
      </motion.div>

      {/*
        Estado del pago único. Va en su propia tarjeta porque es un producto
        distinto de la suscripción: se compra una vez y no caduca, así que
        mezclarlo con el estado de la suscripción confundiría las dos cosas.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-card p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <InfinityIcon className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{PLANS.lifetime.name}</p>
              <p className="text-sm text-muted-foreground">
                {PLANS.lifetime.billingNote}
              </p>
            </div>
          </div>
          <Badge
            className={`flex shrink-0 items-center gap-1.5 border ${
              hasLifetimeAccess
                ? "border-success-border bg-success-soft text-success-strong"
                : "border-border/60 bg-muted text-muted-foreground"
            }`}
          >
            {hasLifetimeAccess ? (
              <CheckCircle2 className="h-3 w-3" aria-hidden />
            ) : (
              <XCircle className="h-3 w-3" aria-hidden />
            )}
            {hasLifetimeAccess ? "Activo" : "No comprado"}
          </Badge>
        </div>

        {hasLifetimeAccess ? (
          <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Tienes acceso permanente a todas las formaciones. No caduca y no
            hay nada que renovar.
          </p>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => startCheckout("lifetime")}
            disabled={checkingOut !== null}
          >
            {checkingOut === "lifetime" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            )}
            Comprar acceso completo — {planPrice(PLANS.lifetime)}
          </Button>
        )}
      </motion.div>
    </div>
  )
}

/** Etiquetas legibles de las secciones que exigen suscripción. */
const SECTION_LABELS: Record<string, string> = {
  "/quest": "los logros",
  "/taberna": "la comunidad",
  "/mentorship": "la mentoría",
  "/messages": "los mensajes",
  "/assistant": "el asistente",
  "/u": "los perfiles de la comunidad",
}

/**
 * Explica por qué se ha llegado aquí. El middleware redirige a esta página
 * desde las secciones de pago; sin este aviso el usuario aparecía en
 * facturación sin saber qué había pasado con el clic que acababa de dar.
 */
function RedirectReason() {
  const searchParams = useSearchParams()
  if (searchParams.get("reason") !== "subscription") return null

  const from = searchParams.get("from") ?? ""
  const key = Object.keys(SECTION_LABELS).find(
    (prefix) => from === prefix || from.startsWith(prefix + "/")
  )
  const label = key ? SECTION_LABELS[key] : "esa sección"

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="text-muted-foreground">
        Para entrar en{" "}
        <span className="font-medium text-foreground">{label}</span> necesitas
        la suscripción activa. Las formaciones siguen abiertas: puedes ver la
        primera clase de cada una sin pagar.
      </p>
    </div>
  )
}
