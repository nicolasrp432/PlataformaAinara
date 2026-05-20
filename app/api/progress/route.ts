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
      .select("modules ( lessons (id) )")
      .eq("id", formationId)
      .single()

    if (!formation) {
      return NextResponse.json({ error: "Formation not found" }, { status: 404 })
    }

    const typedFormation = formation as ProgressFormation
    const lessonIds =
      typedFormation.modules?.flatMap((m) => m.lessons?.map((l) => l.id) ?? []) ?? []

    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["none"])

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

  // Fetch lesson duration for progress calculation
  const { data: lessonData, error: lessonError } = await supabase
    .from("lessons")
    .select("duration_seconds")
    .eq("id", lessonId)
    .single()

  if (lessonError || !lessonData) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const duration = lessonData.duration_seconds ?? 0
  const watched = typeof watchedSeconds === "number" ? watchedSeconds : 0
  const progressPercent = duration > 0 ? Math.min(100, Math.round((watched / duration) * 100)) : 0
  const now = new Date().toISOString()

  // Canonical column names per migration 004_unify_schema.sql
  const payload: Record<string, unknown> = {
    user_id: user.id,
    lesson_id: lessonId,
    watched_seconds: watched,
    last_position_seconds: watched,
    progress_percent: progressPercent,
    is_completed: !!isCompleted,
    status: isCompleted ? "completed" : "in_progress",
  }

  if (isCompleted) {
    payload.completed_at = now
  }

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(payload, { onConflict: "user_id,lesson_id" })
    .select()
    .single()

  if (error) {
    console.error("[api/progress] upsert error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ progress: data })
}
