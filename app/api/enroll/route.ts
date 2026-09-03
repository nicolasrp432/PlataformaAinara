import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { enrollSchema } from "@/lib/validations/enroll"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"
import { canEnterPlatform, resolveAccessTier } from "@/lib/access"

// POST - Enroll user in a formation
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(request, "enroll", { windowMs: 60_000, max: 20 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = enrollSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    )
  }
  const { formationId, slug } = parsed.data
  
  // Check if formation exists and is published
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("id, is_premium, is_published")
    .eq("id", formationId)
    .single()
  
  if (formationError || !formation) {
    return NextResponse.json({ error: "Formation not found" }, { status: 404 })
  }
  
  if (!formation.is_published) {
    return NextResponse.json({ error: "Formation not available" }, { status: 403 })
  }
  
  // Check if already enrolled
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
    .single()
  
  if (existing) {
    return NextResponse.json({ message: "Already enrolled", enrollment: existing })
  }
  
  // Inscribirse es gratis: solo abre el seguimiento de progreso. Lo que la
  // suscripción compra es el acceso a las lecciones, y eso se comprueba
  // lección a lección en `getLessonPageData`, no aquí. Un usuario gratuito
  // debe poder inscribirse para que su avance en la clase de muestra quede
  // guardado y aparezca en «Continuar aprendiendo».
  //
  // Una cuenta suspendida sí queda fuera.
  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status, role")
    .eq("id", user.id)
    .single()

  const tier = resolveAccessTier(profile?.role, profile?.access_status)

  if (!canEnterPlatform(tier)) {
    return NextResponse.json(
      { error: "Tu acceso está suspendido. Reactiva tu suscripción para continuar." },
      { status: 403 }
    )
  }
  
  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      formation_id: formationId,
      status: "active",
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }

  revalidatePath('/library')
  if (slug) revalidatePath(`/formations/${slug}`)

  return NextResponse.json({ enrollment })
}

// DELETE - Unenroll user from a formation
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const formationId = searchParams.get("formationId")
  
  if (!formationId) {
    return NextResponse.json({ error: "Missing formationId" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
