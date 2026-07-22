"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function addProfileCommentAction(profileId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const parsed = commentSchema.safeParse({ content: formData.get("content") })
  if (!parsed.success) return { error: "Comentario inválido" }

  const admin = supabaseAdmin()
  const { error } = await admin
    .from("profile_comments")
    .insert({ profile_id: profileId, author_id: user.id, content: parsed.data.content })

  if (error) return { error: error.message }
  revalidatePath(`/u/${profileId}`)
  return { success: true }
}

export async function deleteProfileCommentAction(commentId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { error } = await supabase
    .from("profile_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)

  if (error) return { error: error.message }
  revalidatePath(`/u/${profileId}`)
  return { success: true }
}
