import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { awardXP } from "@/lib/services/xpService"
import { revalidatePath } from "next/cache"

interface SubmitBody {
  quizId: string
  lessonId: string
  formationSlug: string
  answers: Record<string, string>  // { question_id: option_id }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 })

  const body = await req.json().catch(() => null) as SubmitBody | null
  if (!body?.quizId || !body?.lessonId || !body?.answers) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
  }

  // 1. Load quiz with correct answers (server-side only)
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      id, passing_score, xp_reward, lesson_id,
      quiz_questions (
        id,
        quiz_options ( id, is_correct )
      )
    `)
    .eq("id", body.quizId)
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: "Quiz no encontrado." }, { status: 404 })
  }

  // 2. Score the answers
  const questions = quiz.quiz_questions as Array<{
    id: string
    quiz_options: Array<{ id: string; is_correct: boolean }>
  }>

  let correct = 0
  const results: Record<string, { selected: string; correct: string; isCorrect: boolean }> = {}

  for (const question of questions) {
    const selectedOptionId = body.answers[question.id]
    const correctOption = question.quiz_options.find((o) => o.is_correct)
    const isCorrect = selectedOptionId === correctOption?.id

    if (isCorrect) correct++
    results[question.id] = {
      selected: selectedOptionId ?? "",
      correct: correctOption?.id ?? "",
      isCorrect,
    }
  }

  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const passed = score >= quiz.passing_score

  // 3. Save attempt
  const { error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: quiz.id,
      score,
      passed,
      answers: body.answers,
    })

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 })
  }

  // 4. If passed, mark lesson as completed and award XP
  let xpEarned = 0
  let leveledUp = false

  if (passed) {
    // Check if lesson was already completed to avoid duplicate XP
    const { data: existingProgress } = await supabase
      .from("user_progress")
      .select("id, is_completed")
      .eq("user_id", user.id)
      .eq("lesson_id", body.lessonId)
      .maybeSingle()

    if (!existingProgress?.is_completed) {
      if (existingProgress) {
        await supabase
          .from("user_progress")
          .update({ is_completed: true, completed_at: new Date().toISOString(), status: "completed", progress_percent: 100 })
          .eq("id", existingProgress.id)
      } else {
        await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            lesson_id: body.lessonId,
            status: "completed",
            is_completed: true,
            completed_at: new Date().toISOString(),
            progress_percent: 100,
          })
      }

      xpEarned = quiz.xp_reward
      const xpResult = await awardXP(user.id, xpEarned)
      leveledUp = xpResult?.leveledUp ?? false

      revalidatePath(`/learn/${body.formationSlug}/${body.lessonId}`)
      revalidatePath(`/dashboard`)
      revalidatePath(`/formations/${body.formationSlug}`)
      revalidatePath("/profile")
      revalidatePath("/quest")
    }
  }

  return NextResponse.json({
    score,
    passed,
    passingScore: quiz.passing_score,
    results,
    xpEarned,
    leveledUp,
  })
}
