import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAvailableSlots, getMentor } from "@/lib/services/mentorship"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mentorId = searchParams.get("mentorId")
  if (!mentorId) {
    return NextResponse.json({ error: "mentorId required" }, { status: 400 })
  }

  const mentor = await getMentor(mentorId)
  if (!mentor || !mentor.is_active) {
    return NextResponse.json({ slots: [] })
  }

  const days = Math.min(Number(searchParams.get("days") ?? 14), 30)
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + days)

  const slots = await getAvailableSlots(
    mentor.id,
    from,
    to,
    mentor.session_duration_minutes ?? 60,
  )

  return NextResponse.json({ slots })
}
