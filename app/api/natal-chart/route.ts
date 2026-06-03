import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { natalChartDataSchema, toNatalChartRow } from "@/lib/validations/natal-chart"

// GET /api/natal-chart            -> carta natal del usuario autenticado
// GET /api/natal-chart?userId=xxx -> carta natal de otro usuario (lectura pública)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const userId = request.nextUrl.searchParams.get("userId")

  let targetId = userId
  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    targetId = user.id
  }

  const { data, error } = await supabase
    .from("natal_charts")
    .select("*")
    .eq("user_id", targetId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/natal-chart -> guarda/actualiza la carta natal del usuario autenticado
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = natalChartDataSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de carta natal inválidos" }, { status: 422 })
  }

  const { row, derived } = toNatalChartRow(user.id, parsed.data)

  const { data: saved, error } = await supabase
    .from("natal_charts")
    .upsert(row, { onConflict: "user_id" })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase
    .from("profiles")
    .update({
      sun_sign: derived.sun_sign,
      moon_sign: derived.moon_sign,
      rising_sign: derived.rising_sign,
      natal_chart_id: saved?.id ?? null,
    })
    .eq("id", user.id)

  return NextResponse.json({ success: true, id: saved?.id })
}
