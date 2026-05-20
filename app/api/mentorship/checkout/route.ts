import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { mentorshipCheckoutSchema } from "@/lib/validations/mentorship"
import { getMentor, getAvailableSlots } from "@/lib/services/mentorship"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(req, "mentorship-checkout", { windowMs: 60_000, max: 10 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = mentorshipCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    )
  }

  const { mentorId, scheduledAt, notes } = parsed.data
  const mentor = await getMentor(mentorId)
  if (!mentor || !mentor.is_active) {
    return NextResponse.json({ error: "Mentor no disponible." }, { status: 404 })
  }

  const sessionDate = new Date(scheduledAt)
  const duration = mentor.session_duration_minutes ?? 60
  const price = mentor.session_price ?? 0
  if (price <= 0) {
    return NextResponse.json({ error: "Precio no configurado." }, { status: 400 })
  }

  // Validate that the requested slot is actually available
  const windowStart = new Date(sessionDate)
  windowStart.setMinutes(windowStart.getMinutes() - 1)
  const windowEnd = new Date(sessionDate)
  windowEnd.setMinutes(windowEnd.getMinutes() + 1)

  const validSlots = await getAvailableSlots(mentor.id, windowStart, windowEnd, duration)
  const matched = validSlots.find((s) => Math.abs(new Date(s.startsAt).getTime() - sessionDate.getTime()) < 60_000)
  if (!matched) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elige otro slot." },
      { status: 409 },
    )
  }

  // Create pending session row
  const { data: created, error: insertError } = await supabase
    .from("mentorship_sessions")
    .insert({
      mentor_id: mentor.id,
      user_id: user.id,
      scheduled_at: sessionDate.toISOString(),
      duration_minutes: duration,
      status: "pending",
      user_notes: notes ?? null,
    })
    .select("id")
    .single()

  if (insertError || !created) {
    return NextResponse.json({ error: "No se pudo reservar el slot." }, { status: 500 })
  }

  const sessionId = created.id as string

  // Stripe Checkout — one-off payment
  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const mentorName = mentor.name ?? mentor.full_name ?? "Mentor"

  try {
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              product_data: {
                name: `Mentoría 1:1 con ${mentorName} (${duration} min)`,
                description: `Sesión programada el ${sessionDate.toLocaleString("es-ES")}`,
              },
              unit_amount: Math.round(price * 100),
            },
          },
        ],
        metadata: {
          supabase_user_id: user.id,
          mentorship_session_id: sessionId,
          mentor_id: mentor.id,
        },
        success_url: `${baseUrl}/profile?tab=mentorship&checkout=success`,
        cancel_url: `${baseUrl}/mentorship?checkout=canceled`,
      },
      { idempotencyKey: `mentorship-${sessionId}` },
    )

    await supabase
      .from("mentorship_sessions")
      .update({ payment_reference: checkoutSession.id })
      .eq("id", sessionId)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    // Rollback: release the slot
    await supabase.from("mentorship_sessions").delete().eq("id", sessionId)
    console.error("Stripe mentorship checkout error:", err)
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Inténtalo de nuevo." },
      { status: 500 },
    )
  }
}
