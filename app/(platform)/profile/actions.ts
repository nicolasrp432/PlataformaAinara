"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { natalChartDataSchema, toNatalChartRow } from "@/lib/validations/natal-chart"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "No estás autenticado." }
  }

  const fullName = formData.get("full_name") as string
  let avatarUrl = formData.get("avatar_url") as string
  const birthDate = formData.get("birth_date") as string
  const birthTime = formData.get("birth_time") as string
  const birthCity = formData.get("birth_city") as string

  // Handle avatar file upload if provided
  const avatarFile = formData.get("avatar_file") as File | null
  if (avatarFile && avatarFile.size > 0) {
    const filename = `${user.id}-${Date.now()}.${avatarFile.name.split(".").pop()}`
    const { error: uploadError } = await supabase.storage
      .from("public_assets")
      .upload(`avatars/${filename}`, avatarFile, { cacheControl: "3600", upsert: true })

    if (uploadError) {
      return { error: "Error al subir la imagen: " + uploadError.message }
    }

    const { data: urlData } = supabase.storage.from("public_assets").getPublicUrl(`avatars/${filename}`)
    avatarUrl = urlData.publicUrl
  }

  // Actualizar la tabla profiles conectada a tu usuario.
  const { error } = await supabase
    .from("profiles")
    .update({ 
      full_name: fullName, 
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      birth_date: birthDate || null,
      birth_time: birthTime || null,
      birth_city: birthCity || null,
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  // Revalidar las rutas para que se refresque el Avatar y Nombre de inmediato.
  revalidatePath("/profile")
  revalidatePath("/dashboard")

  return { success: true, newAvatarUrl: avatarUrl || null }
}

/**
 * Guarda (o reemplaza, vía UPSERT) la carta natal calculada en el proyecto
 * carta-natal y sincroniza los signos derivados (Sol, Luna, Ascendente) en profiles.
 */
export async function saveNatalChart(data: unknown) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "No estás autenticado." }
  }

  const parsed = natalChartDataSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Datos de carta natal inválidos." }
  }

  const { row, derived } = toNatalChartRow(user.id, parsed.data)

  const { data: saved, error } = await supabase
    .from("natal_charts")
    .upsert(row, { onConflict: "user_id" })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  // Sincronizar resumen en profiles para acceso rápido
  await supabase
    .from("profiles")
    .update({
      sun_sign: derived.sun_sign,
      moon_sign: derived.moon_sign,
      rising_sign: derived.rising_sign,
      natal_chart_id: saved?.id ?? null,
    })
    .eq("id", user.id)

  revalidatePath("/profile")
  revalidatePath(`/u/${user.id}`)

  return { success: true }
}
