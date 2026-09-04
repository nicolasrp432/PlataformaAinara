import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"
import {
  PLANS,
  isPlanId,
  isPlanPurchasable,
  stripePriceIdFor,
  type PlanId,
} from "@/lib/pricing"

/**
 * Abre una sesión de pago de Stripe.
 *
 * Acepta qué plan se compra (`lifetime` o `membership`) y deriva el `mode` de
 * `lib/pricing.ts`. No se escribe a mano: Stripe rechaza un precio recurrente
 * en `mode: "payment"` y uno de un solo cobro en `mode: "subscription"`, así
 * que una discrepancia rompe el checkout entero.
 */
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

  // Por defecto, el plan principal: así una llamada antigua sin cuerpo sigue
  // funcionando en lugar de fallar.
  let planId: PlanId = "lifetime"
  try {
    const body = await req.json()
    if (isPlanId(body?.plan)) planId = body.plan
  } catch {
    // Sin cuerpo válido nos quedamos con el plan por defecto.
  }

  const plan = PLANS[planId]

  // Un plan sin importe decidido no se puede cobrar. Se responde explícito en
  // lugar de mandar a Stripe una sesión que no significa nada.
  if (!isPlanPurchasable(plan)) {
    return NextResponse.json(
      { error: "Este plan todavía no está a la venta. Escríbenos y te avisamos." },
      { status: 409 },
    )
  }

  const priceId = stripePriceIdFor(plan)
  if (!priceId) {
    console.error(`[checkout] falta ${plan.stripePriceIdEnv} para el plan ${plan.id}`)
    return NextResponse.json(
      { error: "El pago no está configurado todavía. Escríbenos y lo resolvemos." },
      { status: 503 },
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, stripe_customer_id, has_lifetime_access")
    .eq("id", user.id)
    .single()

  // Cobrar dos veces el acceso permanente sería cobrar por algo que ya tiene.
  if (plan.id === "lifetime" && profile?.has_lifetime_access === true) {
    return NextResponse.json(
      { error: "Ya tienes el acceso completo. No hace falta pagarlo otra vez." },
      { status: 409 },
    )
  }

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

  // Idempotency key: mismo usuario, mismo plan y mismo minuto → misma sesión.
  const minuteBucket = Math.floor(Date.now() / 60_000)

  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: plan.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      // Ruta propia que verifica la sesión y concede el acceso al instante.
      // `/auth/callback` esperaba un `?code=` de Supabase que aquí nunca
      // llega, así que el usuario acababa en la pantalla de error tras pagar.
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?checkout=canceled`,
      // El plan viaja en los metadatos: el webhook y el retorno necesitan
      // saber qué se compró para conceder una cosa u otra.
      metadata: { supabase_user_id: user.id, plan: plan.id },
      ...(plan.mode === "subscription"
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan: plan.id },
            },
          }
        : {
            payment_intent_data: {
              metadata: { supabase_user_id: user.id, plan: plan.id },
            },
          }),
    },
    { idempotencyKey: `${plan.id}-${user.id}-${minuteBucket}` },
  )

  return NextResponse.json({ url: session.url })
}
