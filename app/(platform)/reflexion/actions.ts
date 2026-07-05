"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { awardXP } from "@/lib/services/xpService"

const VALID_MOODS = ["radiante", "en_calma", "neutral", "nublado", "tormenta"] as const

export async function upsertDailyReflection(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Debes iniciar sesión para guardar tu reflexión." }
  }

  const mood = formData.get("mood") as string
  if (!VALID_MOODS.includes(mood as (typeof VALID_MOODS)[number])) {
    return { error: "Selecciona cómo te sientes hoy." }
  }

  const content = ((formData.get("content") as string) || "").trim()
  if (content.length > 2000) {
    return { error: "La reflexión no puede superar los 2000 caracteres." }
  }

  const today = new Date().toISOString().slice(0, 10)

  // ¿Primera vez hoy? Solo entonces se otorga XP.
  const { data: existing } = await supabase
    .from("daily_reflections")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle()

  const { error } = await supabase.from("daily_reflections").upsert(
    {
      user_id: user.id,
      entry_date: today,
      mood,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" }
  )

  if (error) {
    return { error: "No se pudo guardar tu reflexión: " + error.message }
  }

  let xpAwarded = 0
  if (!existing) {
    const result = await awardXP(user.id, 25)
    if (result) xpAwarded = 25
  }

  revalidatePath("/reflexion")
  revalidatePath("/dashboard")
  return { success: true, xpAwarded }
}
