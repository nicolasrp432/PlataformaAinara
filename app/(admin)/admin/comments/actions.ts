"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteCommentAdmin(commentId: string) {
  const supabase = await createClient()

  // 1. Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  // 2. Validate that the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    return { error: "No tienes permisos de administrador" }
  }

  // 3. Delete the reflection
  const { error: deleteError } = await supabase
    .from("reflections")
    .delete()
    .eq("id", commentId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath("/admin/comments")
  return { success: true }
}
