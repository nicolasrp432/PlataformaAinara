import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return null
  return user
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { lessonId, title, description, passing_score, xp_reward, questions } = body

  if (!lessonId || !title?.trim() || !questions?.length) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  }

  // Create quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({ lesson_id: lessonId, title: title.trim(), description: description || null, passing_score, xp_reward })
    .select()
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: quizError?.message ?? "Error al crear quiz." }, { status: 500 })
  }

  // Create questions and their options
  for (const q of questions) {
    const { data: question, error: qError } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quiz.id,
        question: q.question.trim(),
        type: q.type,
        explanation: q.explanation?.trim() || null,
        sort_order: q.sort_order,
      })
      .select()
      .single()

    if (qError || !question) continue

    const optionsToInsert = (q.options as Array<{ option_text: string; is_correct: boolean; sort_order: number }>)
      .filter((o) => o.option_text?.trim())
      .map((o) => ({
        question_id: question.id,
        option_text: o.option_text.trim(),
        is_correct: o.is_correct,
        sort_order: o.sort_order,
      }))

    if (optionsToInsert.length > 0) {
      await supabase.from("quiz_options").insert(optionsToInsert)
    }
  }

  // Return quiz with lesson context for the client list
  const { data: quizWithLesson } = await supabase
    .from("quizzes")
    .select(`
      id, title, description, passing_score, xp_reward, created_at,
      lessons ( id, title, modules ( id, title, formations ( id, title ) ) )
    `)
    .eq("id", quiz.id)
    .single()

  return NextResponse.json({ quiz: quizWithLesson })
}
