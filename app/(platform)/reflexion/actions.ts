"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { awardXP } from "@/lib/services/xpService"

const VALID_MOODS = ["radiante", "en_calma", "neutral", "nublado", "tormenta"] as const

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

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

  const today = todayISO()
  const rawDate = (formData.get("entry_date") as string) || today
  if (!DATE_RE.test(rawDate)) {
    return { error: "Fecha no válida." }
  }
  if (rawDate > today) {
    return { error: "No puedes escribir en el futuro." }
  }
  const entryDate = rawDate
  const isToday = entryDate === today

  const { data: existing } = await supabase
    .from("daily_reflections")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .maybeSingle()

  // Los días pasados solo se pueden editar, no rellenar a posteriori: si no,
  // la racha dejaría de reflejar constancia real.
  if (!isToday && !existing) {
    return { error: "Solo puedes escribir la reflexión de hoy." }
  }

  const { error } = await supabase.from("daily_reflections").upsert(
    {
      user_id: user.id,
      entry_date: entryDate,
      mood,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" }
  )

  if (error) {
    return { error: "No se pudo guardar tu reflexión: " + error.message }
  }

  // XP solo la primera vez del día actual.
  let xpAwarded = 0
  if (isToday && !existing) {
    const result = await awardXP(user.id, 25)
    if (result) xpAwarded = 25
  }

  revalidatePath("/reflexion")
  revalidatePath("/dashboard")
  return { success: true, xpAwarded }
}

export async function deleteDailyReflection(entryDate: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Debes iniciar sesión." }
  }

  if (!DATE_RE.test(entryDate)) {
    return { error: "Fecha no válida." }
  }

  const { error } = await supabase
    .from("daily_reflections")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)

  if (error) {
    return { error: "No se pudo eliminar la entrada: " + error.message }
  }

  revalidatePath("/reflexion")
  revalidatePath("/dashboard")
  return { success: true }
}
