"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { awardXP } from "@/lib/services/xpService"
import { createNotification } from "@/lib/services/notifications"
import {
  addCommentSchema,
  addReplySchema,
  toggleReactionSchema,
  deleteCommentSchema,
} from "@/lib/validations/comments"

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
  revalidatePath("/profile")
  revalidatePath("/quest")

  return { success: true, alreadyCompleted: false, xpEarned: xpAmount, leveledUp: xpResult?.leveledUp ?? false }
}

export async function addLessonComment(formData: FormData, lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const parsed = addCommentSchema.safeParse({
    content: formData.get("content"),
    lessonId,
    slug,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Comentario inválido." }
  }

  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      lesson_id: parsed.data.lessonId,
      content: parsed.data.content,
      is_public: true,
    })

  if (error) return { error: error.message }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  return { success: true }
}

export async function addCommentReply(parentId: string, content: string, lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const parsed = addReplySchema.safeParse({ parentId, content, lessonId, slug })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Respuesta inválida." }
  }

  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      lesson_id: parsed.data.lessonId,
      parent_id: parsed.data.parentId,
      content: parsed.data.content,
      is_public: true,
    })

  if (error) return { error: error.message }

  // Notificar al autor del comentario padre (silencioso si falla)
  const { data: parent } = await supabase
    .from("reflections")
    .select("user_id")
    .eq("id", parsed.data.parentId)
    .single()
  if (parent && parent.user_id !== user.id) {
    await createNotification(parent.user_id, "comment_reply", {
      title: "Nueva respuesta a tu comentario",
      body: parsed.data.content.slice(0, 100),
      link: `/learn/${slug}/${lessonId}`,
      createdBy: user.id,
    })
  }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  return { success: true }
}

export async function toggleReaction(reflectionId: string, type: string, lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const parsed = toggleReactionSchema.safeParse({ reflectionId, type, lessonId, slug })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Reacción inválida." }
  }

  // Check if user already reacted with this type → toggle off
  const { data: existing } = await supabase
    .from("reflection_reactions")
    .select("id")
    .eq("reflection_id", parsed.data.reflectionId)
    .eq("user_id", user.id)
    .eq("reaction_type", parsed.data.type)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("reflection_reactions")
      .delete()
      .eq("id", existing.id)
    if (error) return { error: error.message }
    revalidatePath(`/learn/${slug}/${lessonId}`)
    return { success: true, active: false }
  }

  const { error } = await supabase
    .from("reflection_reactions")
    .insert({
      reflection_id: parsed.data.reflectionId,
      user_id: user.id,
      reaction_type: parsed.data.type,
    })

  if (error) return { error: error.message }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  return { success: true, active: true }
}

export async function deleteComment(commentId: string, lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  const parsed = deleteCommentSchema.safeParse({ commentId, lessonId, slug })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Comando inválido." }
  }

  // RLS asegura que sólo el dueño puede borrar; doble check explícito
  const { error } = await supabase
    .from("reflections")
    .delete()
    .eq("id", parsed.data.commentId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  return { success: true }
}
