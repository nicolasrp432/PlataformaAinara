"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createReflection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Debes iniciar sesión para publicar en La Taberna." }
  }

  const content = formData.get("content") as string
  if (!content || content.trim() === "") {
    return { error: "El contenido no puede estar vacío." }
  }

  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      content: content.trim(),
      is_public: true,
      // lesson_id could be added here if this was from a specific lesson
    })

  if (error) {
    return { error: "Error al publicar: " + error.message }
  }

  revalidatePath("/taberna")
  return { success: true }
}
