"use server"

import { createClient } from "@/lib/supabase/server"
import {
  startConversation,
  sendMessage,
  markConversationRead,
  getConversationMessages,
  listConversations,
} from "@/lib/services/messaging"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function startConversationAction(otherUserId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }
  if (!z.string().uuid().safeParse(otherUserId).success) return { error: "Usuario inválido" }
  if (user.id === otherUserId) return { error: "No puedes enviarte mensajes a ti mismo" }

  const admin = supabase
  const { data: profile, error: profileError } = await admin
    .from("member_profiles")
    .select("allow_direct_messages, full_name")
    .eq("id", otherUserId)
    .maybeSingle()

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
  body: z
    .string().trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "Máximo 2000 caracteres"),
})

export async function sendMessageAction(conversationId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const rawBody = formData.get("body")
  const parsed = messageSchema.safeParse({ body: rawBody })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Mensaje inválido"
    return { error: issue }
  }

  try {
    const msg = await sendMessage(conversationId, user.id, parsed.data.body)
    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/messages")
    return {
      success: true,
      message: msg,
    }
  } catch (e) {
    console.error("[sendMessageAction] error:", e)
    return { error: e instanceof Error ? e.message : "Error al enviar el mensaje" }
  }
}

export async function markConversationReadAction(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  try {
    await markConversationRead(conversationId, user.id)
    revalidatePath("/messages")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al marcar como leído" }
  }
}

const cursorSchema = z.object({ created_at: z.string().datetime({ offset: true }).transform(value => new Date(value).toISOString()),id: z.string().uuid() })
async function messagePage(conversationId: string,cursor: unknown,direction: "before" | "after") {
  if (!z.string().uuid().safeParse(conversationId).success) return { error: "Conversación inválida",messages: [] }
  const parsed = cursorSchema.safeParse(cursor)
  if (!parsed.success) return { error: "Página inválida",messages: [] }
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: "No autorizado",messages: [] }
  try {
    const messages = await getConversationMessages(conversationId,user.id,{ limit: 50,[direction]: parsed.data })
    if (!messages) return { error: "Conversación no disponible",messages: [] }
    return { messages: messages.map(message => {
      const raw = message.profiles
      return { ...message,profiles: Array.isArray(raw) ? raw[0] ?? null : raw }
    }) }
  } catch { return { error: "No se pudieron actualizar los mensajes",messages: [] } }
}
export async function getLatestMessagesAction(conversationId: string,cursor: { created_at: string; id: string }) {
  return messagePage(conversationId,cursor,"after")
}
export async function getOlderMessagesAction(conversationId: string,cursor: { created_at: string; id: string }) {
  return messagePage(conversationId,cursor,"before")
}

export async function listConversationsAction() {
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { error: "No autorizado" }
  try { return { conversations: await listConversations(user.id) } }
  catch { return { error: "No se pudo actualizar la bandeja." } }
}
