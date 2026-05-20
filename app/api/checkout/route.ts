import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, STRIPE_PRICE_ID } from "@/lib/stripe"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(req, "checkout", { windowMs: 60_000, max: 6 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, stripe_customer_id")
    .eq("id", user.id)
    .single()

  let customerId: string | undefined = profile?.stripe_customer_id ?? undefined

  const stripe = getStripe()

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // Idempotency key: same user + same minute → same Stripe response.
  const minuteBucket = Math.floor(Date.now() / 60_000)
  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/auth/callback?next=/dashboard&checkout=success`,
      cancel_url: `${baseUrl}/?checkout=canceled`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    },
    { idempotencyKey: `subscription-${user.id}-${minuteBucket}` },
  )

  return NextResponse.json({ url: session.url })
}
