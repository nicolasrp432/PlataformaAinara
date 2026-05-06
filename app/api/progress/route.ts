import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET - Get user progress for a specific lesson or all lessons
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
    // Get progress for a specific lesson
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data || null })
  }

  if (formationId) {
    // Get all progress for a formation
    const { data: formation } = await supabase
      .from("formations")
      .select(`
        modules (
          lessons (id)
        )
      `)
      .eq("id", formationId)
      .single()

    if (!formation) {
      return NextResponse.json({ error: "Formation not found" }, { status: 404 })
    }

    const lessonIds = formation.modules?.flatMap(
      (mod: any) => mod.lessons?.map((l: any) => l.id) || []
    ) || []

    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["none"])

    return NextResponse.json({ progress: progress || [] })
  }

  return NextResponse.json({ error: "Missing lessonId or formationId" }, { status: 400 })
}

// POST - Update or create progress for a lesson
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { lessonId, watchedSeconds, isCompleted } = body

  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 })
  }

  // Check if progress record exists
  const { data: existing } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single()

  const now = new Date().toISOString()

  if (existing) {
    // Update existing progress
    const updateData: any = {
      updated_at: now,
    }

    if (typeof watchedSeconds === "number") {
      updateData.watched_seconds = Math.max(existing.watched_seconds || 0, watchedSeconds)
    }

    if (isCompleted && !existing.is_completed) {
      updateData.is_completed = true
      updateData.completed_at = now
      updateData.status = "completed"
    }

    const { data, error } = await supabase
      .from("user_progress")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data })
  } else {
    // Create new progress record
    const newProgress: any = {
      user_id: user.id,
      lesson_id: lessonId,
      watched_seconds: watchedSeconds || 0,
      is_completed: isCompleted || false,
      started_at: now,
    }

    if (isCompleted) {
      newProgress.completed_at = now
      newProgress.status = "completed"
    }

    const { data, error } = await supabase
      .from("user_progress")
      .insert(newProgress)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ progress: data })
  }
}
