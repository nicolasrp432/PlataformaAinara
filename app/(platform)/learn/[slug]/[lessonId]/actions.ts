"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function markLessonCompleted(lessonId: string, slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "No autorizado" }

  // Verificar si ya está completada
  const { data: existingProgress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single()

  if (existingProgress?.is_completed) {
    return { success: true, alreadyCompleted: true }
  }

  if (existingProgress) {
    // Actualizar
    const { error } = await supabase
      .from("user_progress")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", existingProgress.id)
      
    if (error) return { error: error.message }
  } else {
    // Insertar
    const { error } = await supabase
      .from("user_progress")
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        status: 'completed',
        is_completed: true, // asumiendo columna extra o status
        completed_at: new Date().toISOString(),
        progress_percent: 100
      })

    if (error) return { error: error.message }
  }

  // Opcional: Sumar XP al perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, streak_days, last_activity_date")
    .eq("id", user.id)
    .single()

  if (profile) {
    const todayStr = new Date().toISOString().split('T')[0]
    let newStreak = profile.streak_days || 0
    let lastActivityStr = profile.last_activity_date ? new Date(profile.last_activity_date).toISOString().split('T')[0] : ""
    
    if (lastActivityStr !== todayStr) {
       const today = new Date(todayStr)
       const last = new Date(lastActivityStr || "2000-01-01")
       const diffTime = Math.abs(today.getTime() - last.getTime())
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
       
       if (diffDays === 1) {
         newStreak += 1
       } else {
         newStreak = 1 // Reset streak or start first day
       }
    }

    const newXp = (profile.xp || 0) + 50 // +50 XP per lesson
    let newLevel = profile.level || 1
    
    if (newXp >= newLevel * 500) {
      newLevel += 1
    }
    
    await supabase.from("profiles").update({ 
      xp: newXp, 
      level: newLevel,
      streak_days: newStreak,
      last_activity_date: new Date().toISOString()
    }).eq("id", user.id)
  }

  revalidatePath(`/learn/${slug}/${lessonId}`)
  revalidatePath(`/dashboard`)
  revalidatePath(`/formations/${slug}`)
  
  return { success: true }
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
