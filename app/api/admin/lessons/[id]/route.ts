import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return null
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`*, modules ( id, title, formations ( id, title ) )`)
    .eq("id", id)
    .single()

  if (error || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const mod = lesson.modules as { id: string; title: string; formations: { id: string; title: string } | null } | null

  return NextResponse.json({
    ...lesson,
    modules: undefined,
    module_title: mod?.title || "",
    formation_title: mod?.formations?.title || "",
    formation_id: mod?.formations?.id || "",
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const allowed = ["title", "description", "video_url", "duration_seconds", "xp_reward", "is_free", "is_published", "content_type", "sort_order", "transcript"]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Invalida el catálogo cacheado (conteos/publicación de lecciones)
  revalidateTag(CACHE_TAGS.formations)

  return NextResponse.json({ lesson: data })
}
