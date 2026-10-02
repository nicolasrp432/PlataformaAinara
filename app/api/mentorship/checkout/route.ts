import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { mentorshipCheckoutSchema } from "@/lib/validations/mentorship"
import { getMentor } from "@/lib/services/mentorship"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Inicia sesión para reservar." }, { status: 401 })
    maybeSweep()
    const limited = rateLimitResponse(rateLimit(req,"mentorship-checkout",{ windowMs: 60_000,max: 10 },user.id))
    if (limited) return limited
    const parsed = mentorshipCheckoutSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 })
    const { mentorId,scheduledAt,notes } = parsed.data
    const { data,error } = await client.rpc("book_mentorship_session", { p_mentor_id: mentorId,p_scheduled_at: scheduledAt,p_notes: notes ?? null })
    if (error) return NextResponse.json({ error: error.code === "23P01" ? "Ese horario ya no está disponible. Elige otro." : error.code === "42501" ? "Necesitas acceso completo para reservar." : "No se pudo reservar. Inténtalo de nuevo." }, { status: error.code === "23P01" ? 409 : error.code === "42501" ? 403 : 503 })
    const booking = data?.[0] as { id: string; status: string; duration_minutes: number; price: number } | undefined
    if (!booking) return NextResponse.json({ error: "No se pudo confirmar la reserva." }, { status: 503 })
    if (booking.status === "confirmed") {
      revalidatePath("/mentorship"); revalidatePath("/profile")
      return NextResponse.json({ success: true,included: true,sessionId: booking.id })
    }
    const admin = supabaseAdmin()
    try {
      const mentor = await getMentor(mentorId)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const checkout = await getStripe().checkout.sessions.create({
        mode: "payment",customer_email: user.email,
        expires_at: Math.floor(Date.now()/1000) + 1800,
        line_items: [{ quantity: 1,price_data: { currency: "eur",unit_amount: Math.round(Number(booking.price)*100),product_data: { name: `Mentoría con ${mentor?.name ?? mentor?.full_name ?? "Ainara"} (${booking.duration_minutes} min)` } } }],
        metadata: { supabase_user_id: user.id,mentorship_session_id: booking.id,mentor_id: mentorId },
        success_url: `${baseUrl}/profile?tab=mentorship&checkout=success`,cancel_url: `${baseUrl}/mentorship?checkout=canceled`,
      },{ idempotencyKey: `mentorship-${booking.id}` })
      if (!checkout.url) throw new Error("Checkout URL missing")
      const { error: referenceError } = await admin.from("mentorship_sessions").update({ payment_reference: checkout.id }).eq("id",booking.id).eq("user_id",user.id)
      if (referenceError) { await getStripe().checkout.sessions.expire(checkout.id); throw new Error("Could not record checkout") }
      return NextResponse.json({ url: checkout.url })
    } catch {
      await admin.from("mentorship_sessions").update({ status: "cancelled" }).eq("id",booking.id).eq("user_id",user.id).eq("status","pending")
      return NextResponse.json({ error: "No se pudo iniciar el pago. El horario se ha liberado." }, { status: 503 })
    }
  } catch { return NextResponse.json({ error: "La reserva no está disponible ahora." }, { status: 503 }) }
}
