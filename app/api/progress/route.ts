import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { progressPostSchema } from "@/lib/validations/progress"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"

type ProgressLessonNode = {
  id: string
}

type ProgressModuleNode = {
  lessons?: ProgressLessonNode[] | null
}

type ProgressFormation = {
  modules?: ProgressModuleNode[] | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get("lessonId")
  const formationId = searchParams.get("formationId")

  if (lessonId) {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data ?? null })
  }

  if (formationId) {
    const { data: formation } = await supabase
      .from("formations")
      .select("modules ( lessons:lesson_catalog (id) )")
      .eq("id", formationId)
      .single()

    if (!formation) {
      return NextResponse.json({ error: "Formation not found" }, { status: 404 })
    }

    const typedFormation = formation as ProgressFormation
    const lessonIds =
      typedFormation.modules?.flatMap((m) => m.lessons?.map((l) => l.id) ?? []) ?? []

    if (!lessonIds.length) return NextResponse.json({ progress: [] })
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds)

    return NextResponse.json({ progress: progress ?? [] })
  }

  return NextResponse.json({ error: "Missing lessonId or formationId" }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(request, "progress", { windowMs: 60_000, max: 120 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = progressPostSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    )
  }
  const { lessonId, watchedSeconds, isCompleted } = parsed.data

  const { data,error } = await supabase.rpc("save_lesson_progress", { p_lesson_id: lessonId,p_seconds: watchedSeconds ?? 0 })
  if (error) return NextResponse.json({ error: "No se pudo guardar el progreso de esta lección." },{ status: error.code === "42501" ? 403 : 503 })
  if (isCompleted) {
    const completed = await supabase.rpc("complete_lesson", { p_lesson_id: lessonId })
    if (completed.error) return NextResponse.json({ error: "No se pudo completar la lección." },{ status: 403 })
    return NextResponse.json({ progress: { ...data,is_completed: true,status: "completed" },completion: completed.data })
  }
  return NextResponse.json({ progress: data })
}
