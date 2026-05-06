"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { awardXP } from "@/lib/services/xpService"

export async function markLessonCompleted(lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const { data: existingProgress } = await supabase
    .from("user_progress")
    .select("id, is_completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single()

  if (existingProgress?.is_completed) {
    return { success: true, alreadyCompleted: true, xpEarned: 0, leveledUp: false }
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("xp_reward")
    .eq("id", lessonId)
    .single()

  const xpAmount = lesson?.xp_reward ?? 50

  if (existingProgress) {
    const { error } = await supabase
      .from("user_progress")
      .update({ is_completed: true, completed_at: new Date().toISOString(), status: "completed" })
      .eq("id", existingProgress.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("user_progress")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        status: "completed",
        is_completed: true,
        completed_at: new Date().toISOString(),
        progress_percent: 100,
      })

    if (error) return { error: error.message }
  }

  const xpResult = await awardXP(user.id, xpAmount)

  revalidatePath(`/learn/${slug}/${lessonId}`)
  revalidatePath(`/dashboard`)
  revalidatePath(`/formations/${slug}`)

  return { success: true, alreadyCompleted: false, xpEarned: xpAmount, leveledUp: xpResult?.leveledUp ?? false }
}

export async function addLessonComment(formData: FormData, lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const content = formData.get("content") as string
  if (!content || !content.trim()) return { error: "El comentario no puede estar vacío." }

  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      lesson_id: lessonId,
      content: content.trim(),
      is_public: true
    })

  if (error) return { error: error.message }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  return { success: true }
}
