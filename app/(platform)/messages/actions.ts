"use server"

import { createClient } from "@/lib/supabase/server"
import { startConversation, sendMessage } from "@/lib/services/messaging"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function startConversationAction(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }
  if (user.id === otherUserId) return { error: "No puedes enviarte mensajes a ti mismo" }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("allow_direct_messages, full_name")
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

  revalidatePath("/messages")
  return { success: true, conversationId }
}

const messageSchema = z.object({
  body: z.string().min(1, "El mensaje no puede estar vacío").max(2000, "Máximo 2000 caracteres"),
})

export async function sendMessageAction(conversationId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const parsed = messageSchema.safeParse({ body: formData.get("body") })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Mensaje inválido"
    return { error: issue }
  }

  try {
    const msg = await sendMessage(conversationId, user.id, parsed.data.body)
    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/messages")
    return { success: true, messageId: msg.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al enviar el mensaje" }
  }
}
