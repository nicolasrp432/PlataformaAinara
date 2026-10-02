import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  const { testimonialId, reason } = await request.json().catch(() => ({}))
  if (typeof testimonialId !== "string" || typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500) return NextResponse.json({ error: "Denuncia inválida" }, { status: 400 })
  const { error } = await supabase.from("community_testimonial_reports").insert({ testimonial_id: testimonialId, reporter_id: user.id, reason: reason.trim() })
  return error ? NextResponse.json({ error: "No se pudo denunciar" }, { status: 400 }) : NextResponse.json({ ok: true })
}
