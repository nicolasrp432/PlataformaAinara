import { createClient } from "@/lib/supabase/server"
import { QuizAdminClient } from "./quiz-admin-client"

export default async function QuizzesPage() {
  const supabase = await createClient()

  // Load all quizzes with their linked lesson and formation context
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select(`
      id, title, description, passing_score, xp_reward, created_at,
      lessons (
        id, title,
        modules (
          id, title,
          formations ( id, title )
        )
      )
    `)
    .order("created_at", { ascending: false })

  // Load lessons typed as quiz to allow linking new quizzes
  const { data: quizLessons } = await supabase
    .from("lessons")
    .select(`
      id, title, content_type,
      modules ( id, title, formations ( id, title ) )
    `)
    .eq("content_type", "quiz")
    .order("title")

  return (
    <QuizAdminClient
      quizzes={(quizzes as any[]) ?? []}
      quizLessons={(quizLessons as any[]) ?? []}
    />
  )
}
