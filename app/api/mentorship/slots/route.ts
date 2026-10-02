import { NextRequest,NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAvailableSlots,getMentor } from "@/lib/services/mentorship"
import { z } from "zod"
export async function GET(req: NextRequest) {
  try {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Inicia sesión." },{ status: 401 })
    const mentorId = req.nextUrl.searchParams.get("mentorId")
    if (!z.string().uuid().safeParse(mentorId).success) return NextResponse.json({ error: "Mentor inválido." },{ status: 400 })
    const days = Number(req.nextUrl.searchParams.get("days") ?? 14)
    if (!Number.isInteger(days) || days < 1 || days > 30) return NextResponse.json({ error: "El intervalo debe ser de 1 a 30 días." },{ status: 400 })
    const mentor = await getMentor(mentorId!)
    if (!mentor?.is_active) return NextResponse.json({ slots: [],timezone: "Europe/Madrid" })
    const from = new Date(); const to = new Date(from.getTime()+days*86_400_000)
    const slots = await getAvailableSlots(mentor.id,from,to,mentor.session_duration_minutes ?? 60)
    return NextResponse.json({ slots,timezone: mentor.timezone ?? "Europe/Madrid" },{ headers: { "Cache-Control": "no-store" } })
  } catch { return NextResponse.json({ error: "No se pudo consultar la agenda. Inténtalo de nuevo." },{ status: 503 }) }
}
