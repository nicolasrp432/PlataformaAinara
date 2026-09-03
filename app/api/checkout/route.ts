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

  // Sin precio configurado el checkout de Stripe falla con un error opaco.
  // Mejor decirlo claro: es un fallo de configuración, no del usuario.
  if (!STRIPE_PRICE_ID) {
    console.error("[checkout] STRIPE_PRICE_ID no está configurado")
    return NextResponse.json(
      { error: "El pago no está configurado todavía. Escríbenos y lo resolvemos." },
      { status: 503 },
    )
  }

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
      // Ruta propia que verifica la sesión y concede el acceso al instante.
      // `/auth/callback` esperaba un `?code=` de Supabase que aquí nunca
      // llega, así que el usuario acababa en la pantalla de error tras pagar.
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?checkout=canceled`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    },
    { idempotencyKey: `subscription-${user.id}-${minuteBucket}` },
  )

  return NextResponse.json({ url: session.url })
}
