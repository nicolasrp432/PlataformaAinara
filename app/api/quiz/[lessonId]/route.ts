import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 })

  // Fetch quiz with questions and options for this lesson
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(`
      id, title, description, passing_score, xp_reward,
      quiz_questions (
        id, question, type, explanation, sort_order,
        quiz_options ( id, option_text, sort_order )
      )
    `)
    .eq("lesson_id", lessonId)
    .single()

  if (error || !quiz) {
    return NextResponse.json({ error: "Quiz no encontrado." }, { status: 404 })
  }

  // Sort questions and options; strip is_correct from options (shown only after submit)
  const questions = (quiz.quiz_questions as Array<{
    id: string; question: string; type: string; explanation: string | null;
    sort_order: number; quiz_options: Array<{ id: string; option_text: string; sort_order: number }>
  }>)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((q) => ({
      ...q,
      options: q.quiz_options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ id, option_text, sort_order }) => ({ id, option_text, sort_order })),
      quiz_options: undefined,
    }))

  // Get user's best attempt for this quiz
  const { data: bestAttempt } = await supabase
    .from("quiz_attempts")
    .select("id, score, passed, completed_at")
    .eq("user_id", user.id)
    .eq("quiz_id", quiz.id)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passing_score: quiz.passing_score,
      xp_reward: quiz.xp_reward,
      questions,
    },
    bestAttempt: bestAttempt ?? null,
  })
}
