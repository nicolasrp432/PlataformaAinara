import { NextRequest, NextResponse } from "next/server"
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  grantLifetimeAccess,
  resolveUserId,
  syncSubscription,
} from "@/lib/services/subscription"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = supabaseAdmin()

  // Record completion only AFTER processing succeeds, so a failed attempt can retry.
  try {
    const { data: processed, error } = await supabase.from("stripe_processed_events")
      .select("event_id").eq("event_id", event.id).maybeSingle()
    if (error) throw new Error("No se pudo comprobar el evento")
    if (processed) return NextResponse.json({ received: true, duplicate: true })
    switch (event.type) {
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        if (!session.metadata?.mentorship_session_id) break
        const { error } = await supabase.from("mentorship_sessions")
          .update({ status: "cancelled", hold_expires_at: null })
          .eq("id",session.metadata.mentorship_session_id).eq("status","pending").eq("payment_reference",session.id)
        if (error) throw new Error("No se pudo liberar la reserva caducada")
        break
      }
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "payment" && session.payment_status !== "paid") break
        // A late payment cannot displace another person's confirmed booking.
        if (session.mode === "payment" && session.metadata?.mentorship_session_id) {
          const { data: confirmed, error } = await supabase.rpc("confirm_mentorship_payment", {
            p_session_id: session.metadata.mentorship_session_id, p_reference: session.id,
          })
          if (error) throw new Error("No se pudo confirmar la reserva")
          if (!confirmed) {
            const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
            if (!intent) throw new Error("Pago sin referencia para devolución")
            await stripe.refunds.create({ payment_intent: intent }, { idempotencyKey: `mentorship-conflict-${session.id}` })
            const { error: cancelled } = await supabase.from("mentorship_sessions")
              .update({ status: "cancelled", hold_expires_at: null }).eq("id",session.metadata.mentorship_session_id).eq("status","pending")
            if (cancelled) throw new Error("No se pudo registrar la devolución")
          }
          break
        }

        const userId = await resolveUserId({
          metadataUserId: session.metadata?.supabase_user_id,
          customerId: session.customer as string | null,
        })
        if (!userId) {
          console.warn("[stripe webhook] sesión sin usuario resoluble:", session.id)
          throw new Error("Usuario del pago no encontrado")
        }

        // Pago único: acceso permanente. Se recupera la sesión con las líneas
        // expandidas porque el evento no las trae y hacen falta para dejar
        // constancia de qué precio se cobró.
        if (session.mode === "payment") {
          const full = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ["line_items"],
          })
          await grantLifetimeAccess({ userId, session: full })
          break
        }

        if (session.mode !== "subscription") break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        await syncSubscription({ userId, subscription })
        break
      }

      // Cubre altas, renovaciones, impagos, pausas y reactivaciones. Antes
      // este caso solo sabía RETIRAR el acceso: si una suscripción volvía a
      // `active` tras un impago resuelto, el usuario se quedaba suspendido
      // para siempre. `syncSubscription` decide en ambos sentidos.
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription

        const userId = await resolveUserId({
          metadataUserId: sub.metadata?.supabase_user_id,
          customerId: sub.customer as string | null,
        })
        if (!userId) {
          console.warn("[stripe webhook] suscripción sin usuario resoluble:", sub.id)
          break
        }

        // Retrieve current state so an older delivery cannot undo a newer renewal.
        const current = await stripe.subscriptions.retrieve(sub.id)
        await syncSubscription({ userId, subscription: current })
        break
      }

      // Renovación cobrada: reconfirma el acceso por si un `past_due` previo
      // lo había dejado en un estado intermedio.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : null
        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = await resolveUserId({
          metadataUserId: sub.metadata?.supabase_user_id,
          customerId: sub.customer as string | null,
        })
        if (!userId) break

        await syncSubscription({ userId, subscription: sub })
        break
      }

      default:
        break
    }
    const { error: recorded } = await supabase.from("stripe_processed_events").insert({ event_id: event.id })
    if (recorded && recorded.code !== "23505") throw new Error("No se pudo registrar el evento procesado")
  } catch (error) {
    // Devolver 500 hace que Stripe reintente, que es lo correcto ante un
    // fallo transitorio de la base de datos.
    console.error(`[stripe webhook] fallo procesando ${event.type}:`, error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
