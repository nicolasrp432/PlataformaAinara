import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createNotification } from "@/lib/services/notifications"

// ── Conversaciones ────────────────────────────────────────────────────────────

export async function startConversation(currentUserId: string, otherUserId: string) {
  const admin = supabaseAdmin()

  // Buscar conversación 1:1 existente entre los dos usuarios
  const { data: existing } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId)

  if (existing && existing.length > 0) {
    const myConvIds = existing.map((r) => r.conversation_id)
    const { data: shared } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvIds)

    if (shared && shared.length > 0) {
      return { conversationId: shared[0].conversation_id }
    }
  }

  // Crear nueva conversación
  const { data: conv, error } = await admin
    .from("conversations")
    .insert({})
    .select("id")
    .single()

  if (error || !conv) throw new Error("No se pudo crear la conversación")

  await admin.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: currentUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ])

  return { conversationId: conv.id }
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const admin = supabaseAdmin()

  const { data: msg, error } = await admin
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Actualizar last_message_at
  await admin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)

  // Notificar al otro participante
  const { data: participants } = await admin
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId)

  if (participants) {
    for (const p of participants) {
      await createNotification(p.user_id, "new_message", {
        title: "Nuevo mensaje",
        body: body.slice(0, 80),
        link: `/messages/${conversationId}`,
        createdBy: senderId,
      })
    }
  }

  return msg
}

export async function listConversations(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      last_read_at,
      conversations (
        id,
        last_message_at
      )
    `)
    .eq("user_id", userId)
    .order("conversation_id")

  if (error) {
    console.error("[messaging] listConversations:", error.message)
    return []
  }

  // Para cada conversación, obtener el otro participante y el último mensaje
  const results = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id, profiles(id, full_name, avatar_url)")
        .eq("conversation_id", row.conversation_id)
        .neq("user_id", userId)
        .limit(1)

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at, sender_id")
        .eq("conversation_id", row.conversation_id)
        .order("created_at", { ascending: false })
        .limit(1)

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", row.conversation_id)
        .neq("sender_id", userId)
        .gt("created_at", row.last_read_at ?? "1970-01-01")

      const rawProfiles = participants?.[0]?.profiles
      const other = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as
        | { id: string; full_name: string; avatar_url: string | null }
        | null

      const rawConv = row.conversations
      const conv = (Array.isArray(rawConv) ? rawConv[0] : rawConv) as
        | { last_message_at: string }
        | null

      return {
        conversationId: row.conversation_id,
        otherUser: other,
        lastMessage: lastMsg?.[0] ?? null,
        unreadCount: unread ?? 0,
        lastMessageAt: conv?.last_message_at ?? null,
      }
    })
  )

  return results.sort((a, b) =>
    new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  )
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  opts: { limit?: number; cursor?: string } = {}
) {
  const supabase = await createClient()
  const limit = opts.limit ?? 50

  // Verificar participante
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single()

  if (!participant) return null

  let query = supabase
    .from("messages")
    .select("id, sender_id, body, created_at, profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (opts.cursor) query = query.lt("created_at", opts.cursor)

  const { data, error } = await query
  if (error) console.error("[messaging] getConversationMessages:", error.message)
  return (data ?? []).reverse()
}

export async function markConversationRead(conversationId: string, userId: string) {
  const supabase = await createClient()
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

// ── Comentarios en perfil ─────────────────────────────────────────────────────

export async function getProfileComments(profileId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profile_comments")
    .select(`
      id, content, created_at, parent_id, author_id,
      profiles:author_id (id, full_name, avatar_url)
    `)
    .eq("profile_id", profileId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) console.error("[messaging] getProfileComments:", error.message)
  return data ?? []
}
