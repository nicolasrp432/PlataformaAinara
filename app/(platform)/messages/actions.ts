"use server"

import { createClient } from "@/lib/supabase/server"
import { startConversation, sendMessage } from "@/lib/services/messaging"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function startConversationAction(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }
  if (user.id === otherUserId) return { error: "No puedes enviarte mensajes a ti mismo" }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("allow_direct_messages")
    .eq("id", otherUserId)
    .single()

  if (profileError || !profile) return { error: "Usuario no encontrado" }
  if (profile.allow_direct_messages === false) {
    return { error: "Este usuario no acepta mensajes directos" }
  }

  let conversationId: string
  try {
    const result = await startConversation(user.id, otherUserId)
    conversationId = result.conversationId
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo iniciar la conversación" }
  }

  redirect(`/messages/${conversationId}`)
}

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
})

export async function sendMessageAction(conversationId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const parsed = messageSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) return { error: "Mensaje inválido" }

  try {
    await sendMessage(conversationId, user.id, parsed.data.body)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al enviar" }
  }

  revalidatePath(`/messages/${conversationId}`)
  return { success: true }
}
