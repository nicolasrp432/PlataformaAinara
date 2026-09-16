"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/lib/services/notifications"

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

  // Rate limit: 1 publicación cada 15 segundos por usuario
  const { count: recentCount } = await supabase
    .from("reflections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 15000).toISOString())

  if (recentCount && recentCount > 0) {
    return { error: "Espera unos segundos antes de publicar de nuevo." }
  }

  const parentId = formData.get("parent_id") as string | null

  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      content: content.trim(),
      is_public: true,
      ...(parentId ? { parent_id: parentId } : {}),
    })

  if (error) {
    return { error: "Error al publicar: " + error.message }
  }

  // Si es una respuesta a otra reflexión, notificar al autor original
  if (parentId) {
    try {
      const { data: parent } = await supabase
        .from("reflections")
        .select("user_id")
        .eq("id", parentId)
        .single()

      if (parent && parent.user_id !== user.id) {
        const { data: authorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        const responderName = authorProfile?.full_name || "Un explorador"

        await createNotification(parent.user_id, "comment_reply", {
          title: `${responderName} ha respondido a tu reflexión`,
          body: content.trim().slice(0, 100),
          link: "/taberna",
          createdBy: user.id,
        })
      }
    } catch {
      // Ignorar fallo de notificación para no bloquear la publicación
    }
  }

  revalidatePath("/taberna")
  return { success: true }
}

export async function resonarReflection(reflectionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Debes iniciar sesión para resonar." }
  }

  // Use atomic SQL increment via RPC to avoid race conditions
  const { error } = await supabase.rpc("increment_reflection_likes", {
    p_reflection_id: reflectionId,
  })

  if (error) return { error: error.message }
  return { success: true }
}
