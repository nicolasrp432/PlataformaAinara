"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAccessTier } from "@/lib/data-access"
import { hasFullAccess } from "@/lib/access"
import { createNotification } from "@/lib/services/notifications"

export async function createReflection(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Debes iniciar sesión para publicar en La Taberna." }
  }

  if (!hasFullAccess(await getAccessTier(user.id))) return { error: "La comunidad requiere acceso completo." }
  const parsed = z.object({ content: z.string().trim().min(1,"El contenido no puede estar vacío.").max(4000,"Máximo 4000 caracteres."), parentId: z.string().uuid().nullable() })
    .safeParse({ content: formData.get("content"),parentId: formData.get("parent_id") || null })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Publicación inválida." }
  const { content,parentId } = parsed.data
  if (parentId) {
    const { data: parent } = await supabase.from("reflections").select("id").eq("id",parentId).eq("is_public",true).is("lesson_id",null).maybeSingle()
    if (!parent) return { error: "La publicación original no está disponible." }
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


  const { error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      content: content.trim(),
      is_public: true,
      ...(parentId ? { parent_id: parentId } : {}),
    })

  if (error) {
    return { error: "No se pudo publicar. Vuelve a intentarlo." }
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

  if (!z.string().uuid().safeParse(reflectionId).success || !hasFullAccess(await getAccessTier(user.id))) return { error: "Publicación no disponible." }

  // Use atomic SQL increment via RPC to avoid race conditions
  const { data: count,error } = await supabase.rpc("resonate_reflection", {
    p_reflection_id: reflectionId,
  })

  if (error) return { error: error.message }
  return { success: true,count: Number(count ?? 0) }
}
