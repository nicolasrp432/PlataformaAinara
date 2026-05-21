"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { startConversation } from "@/lib/services/messaging"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

export async function startConversationAction(otherUserId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect("/login") }
  if (user.id === otherUserId) return

  // Verificar que el destinatario permite mensajes
  const { data: profile } = await supabase
    .from("profiles")
    .select("allow_direct_messages")
    .eq("id", otherUserId)
    .single()
  if (!profile?.allow_direct_messages) return

  const { conversationId } = await startConversation(user.id, otherUserId)
  redirect(`/messages/${conversationId}`)
}

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
