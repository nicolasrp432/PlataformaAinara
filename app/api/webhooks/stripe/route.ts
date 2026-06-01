import { NextRequest, NextResponse } from "next/server"
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function periodDates(item: Stripe.SubscriptionItem) {
  return {
    current_period_start: item.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  }
}

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

  const supabase = getServiceClient()

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      // One-off mentorship booking
      if (session.mode === "payment" && session.metadata?.mentorship_session_id) {
        const mentorshipId = session.metadata.mentorship_session_id
        await supabase
          .from("mentorship_sessions")
          .update({
            status: "confirmed",
            payment_reference: session.id,
          })
          .eq("id", mentorshipId)
        // TODO: trigger transactional email (Resend/SendGrid) with confirmation
        break
      }

      if (session.mode !== "subscription") break

      const subscriptionId = session.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const item = subscription.items.data[0]

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: item?.price.id ?? null,
        status: subscription.status,
        ...periodDates(item),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }, { onConflict: "user_id" })

      await supabase
        .from("profiles")
        .update({ access_status: "approved" })
        .eq("id", userId)

      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const isActive = ["active", "trialing"].includes(sub.status)
      const item = sub.items.data[0]

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: item?.price.id ?? null,
        status: sub.status,
        ...periodDates(item),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: "user_id" })

      if (!isActive) {
        await supabase
          .from("profiles")
          .update({ access_status: "suspended" })
          .eq("id", userId)
      }

      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      await supabase.from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", sub.id)

      await supabase
        .from("profiles")
        .update({ access_status: "suspended" })
        .eq("id", userId)

      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
