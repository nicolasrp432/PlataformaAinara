import type Stripe from "stripe"
import { supabaseAdmin } from "@/lib/supabase/admin"

/**
 * Sincronización suscripción de Stripe → acceso en la plataforma.
 *
 * Este módulo es el único sitio donde se escribe `profiles.access_status` a
 * partir de un evento de pago. Lo llaman dos caminos distintos, a propósito:
 *
 *   1. El retorno del checkout (`/billing/success`), que verifica la sesión
 *      contra Stripe en el mismo instante en que el usuario vuelve. Así el
 *      contenido se abre de inmediato y no depende de que el webhook haya
 *      llegado ya.
 *   2. El webhook, que es la fuente duradera: renovaciones, impagos y
 *      cancelaciones ocurren cuando no hay nadie navegando.
 *
 * Ambos son idempotentes, así que el orden en que lleguen da igual.
 */

/** Estados de Stripe que dan derecho al contenido completo. */
const ACTIVE_STATUSES = new Set(["active", "trialing"])

/**
 * Estados que aún no deben cortar el acceso: un pago reintentándose no es una
 * cancelación, y expulsar al usuario en ese momento es la forma más rápida de
 * perderlo. Stripe acabará emitiendo `canceled` o `unpaid` si no se resuelve.
 */
const GRACE_STATUSES = new Set(["past_due", "incomplete"])

export function accessStatusForSubscription(
  status: string
): "approved" | "suspended" | null {
  if (ACTIVE_STATUSES.has(status)) return "approved"
  if (GRACE_STATUSES.has(status)) return null // sin cambios
  return "suspended"
}

function periodDates(item: Stripe.SubscriptionItem | undefined) {
  return {
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  }
}

/**
 * Resuelve el usuario de la plataforma a partir de una suscripción.
 *
 * Se intenta primero por metadatos y, si no están, por `stripe_customer_id`.
 * El respaldo importa: las suscripciones creadas desde el panel de Stripe, o
 * migradas, no llevan `supabase_user_id`, y sin esta segunda vía sus eventos
 * se descartaban en silencio y el usuario se quedaba sin acceso tras pagar.
 */
export async function resolveUserId(params: {
  metadataUserId?: string | null
  customerId?: string | null
}): Promise<string | null> {
  if (params.metadataUserId) return params.metadataUserId
  if (!params.customerId) return null

  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", params.customerId)
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Guarda el estado de la suscripción y ajusta el acceso del perfil.
 * Devuelve el `access_status` resultante, o null si no se tocó.
 */
export async function syncSubscription(params: {
  userId: string
  subscription: Stripe.Subscription
}): Promise<"approved" | "suspended" | null> {
  const { userId, subscription } = params
  const supabase = supabaseAdmin()
  const item = subscription.items.data[0]

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: item?.price.id ?? null,
      status: subscription.status,
      ...periodDates(item),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id" }
  )

  const nextAccess = accessStatusForSubscription(subscription.status)
  if (!nextAccess) return null

  await supabase
    .from("profiles")
    .update({ access_status: nextAccess })
    .eq("id", userId)

  return nextAccess
}
