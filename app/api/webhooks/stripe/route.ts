import { NextRequest, NextResponse } from "next/server"
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resolveUserId, syncSubscription } from "@/lib/services/subscription"
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

  // ── Idempotencia: Stripe reintenta/reenvía eventos. Insertamos el event.id;
  // si ya existe (23505) lo ignoramos. Defensivo: si la tabla aún no existe
  // (migración 0008 no aplicada, 42P01) procesamos como hasta ahora.
  try {
    const { error: dupError } = await supabase
      .from("stripe_processed_events")
      .insert({ event_id: event.id })
    if (dupError) {
      if (dupError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true })
      }
      console.warn("[stripe webhook] idempotency skipped:", dupError.message)
    }
  } catch (e) {
    console.warn("[stripe webhook] idempotency error:", e)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Reserva puntual de mentoría (pago único, no suscripción).
        if (session.mode === "payment" && session.metadata?.mentorship_session_id) {
          await supabase
            .from("mentorship_sessions")
            .update({
              status: "confirmed",
              payment_reference: session.id,
            })
            .eq("id", session.metadata.mentorship_session_id)
          break
        }

        if (session.mode !== "subscription") break

        const userId = await resolveUserId({
          metadataUserId: session.metadata?.supabase_user_id,
          customerId: session.customer as string | null,
        })
        if (!userId) {
          console.warn("[stripe webhook] sesión sin usuario resoluble:", session.id)
          break
        }

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

        await syncSubscription({ userId, subscription: sub })
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
  } catch (error) {
    // Devolver 500 hace que Stripe reintente, que es lo correcto ante un
    // fallo transitorio de la base de datos.
    console.error(`[stripe webhook] fallo procesando ${event.type}:`, error)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
