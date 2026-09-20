"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  startConversation,
  sendMessage,
  markConversationRead,
  getConversationMessages,
} from "@/lib/services/messaging"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function startConversationAction(otherUserId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }
  if (user.id === otherUserId) return { error: "No puedes enviarte mensajes a ti mismo" }

  const admin = supabaseAdmin()
  const { data: profile, error: profileError } = await admin
    .from("profiles")
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
    .string()
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

export async function getLatestMessagesAction(conversationId: string, afterTimestamp?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { messages: [] }

  try {
    const messages = await getConversationMessages(conversationId, user.id, { limit: 50 })
    if (!messages) return { messages: [] }

    const formatted = messages.map((m) => {
      const rawP = (m as Record<string, unknown>).profiles
      const profiles = (Array.isArray(rawP) ? rawP[0] : rawP) as {
        id: string
        full_name: string
        avatar_url: string | null
      } | null
      return {
        id: m.id as string,
        sender_id: m.sender_id as string,
        body: m.body as string,
        created_at: m.created_at as string,
        profiles,
      }
    })

    if (afterTimestamp) {
      const filtered = formatted.filter(
        (m) => new Date(m.created_at).getTime() > new Date(afterTimestamp).getTime()
      )
      return { messages: filtered }
    }

    return { messages: formatted }
  } catch {
    return { messages: [] }
  }
}
