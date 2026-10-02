import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/services/notifications"

// User-facing reads and writes always use the authenticated RLS client.
const getDbClient = createClient

// ── Conversaciones ────────────────────────────────────────────────────────────

export async function startConversation(currentUserId: string, otherUserId: string) {
  const client = await getDbClient()
  const { data: { user } } = await client.auth.getUser()
  if (user?.id !== currentUserId) throw new Error("No autorizado")
  const { data, error } = await client.rpc("start_direct_conversation", { p_other_user_id: otherUserId })
  if (error || !data) throw new Error("No se pudo iniciar la conversación con este miembro.")
  return { conversationId: data as string }
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const client = await getDbClient()
  const trimmed = body.trim()

  if (!trimmed) {
    throw new Error("El mensaje no puede estar vacío")
  }

  const { data: participant, error: participantError } = await client.from("conversation_participants")
    .select("user_id").eq("conversation_id", conversationId).eq("user_id", senderId).maybeSingle()
  if (participantError || !participant) throw new Error("No perteneces a esta conversación.")
  if (trimmed.length > 2000) throw new Error("Máximo 2000 caracteres.")

  // 2. Insertar mensaje
  const { data: msg, error: msgError } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: trimmed,
    })
    .select("id, conversation_id, sender_id, body, created_at")
    .single()

  if (msgError || !msg) {
    console.error("[messaging] sendMessage insert error:", msgError?.message)
    throw new Error(msgError?.message || "Error al enviar el mensaje")
  }

  // 4. Obtener perfil enriquecido del remitente
  const { data: senderProfile } = await client
    .from("member_profiles")
    .select("id, full_name, avatar_url")
    .eq("id", senderId)
    .maybeSingle()

  const senderName = senderProfile?.full_name?.trim() || "Un miembro de la comunidad"

  // 5. Notificar a los demás participantes
  const { data: otherParticipants } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId)

  const recipientList = otherParticipants || []
  if (recipientList.length > 0) {
    for (const p of recipientList) {
      await createNotification(p.user_id, "new_message", {
        title: `${senderName} te ha enviado un mensaje`,
        body: trimmed.slice(0, 100),
        link: `/messages/${conversationId}`,
        createdBy: senderId,
        metadata: {
          conversationId,
          senderId,
          senderName,
          senderAvatar: senderProfile?.avatar_url,
          bodySnippet: trimmed.slice(0, 100),
        },
      })
    }
  }

  return {
    ...msg,
    profiles: senderProfile ?? null,
    recipientIds: recipientList.map((p) => p.user_id),
  }
}

export async function listConversations(userId: string) {
  const client = await getDbClient()

  const { data, error } = await client
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

  if (error) {
    console.error("[messaging] listConversations error:", error.message)
    throw new Error("No se pudo cargar tu bandeja de mensajes.")
  }

  const rows = data ?? []
  if (rows.length === 0) return []

  const convIds = rows.map((r) => r.conversation_id)

  const [{ data: otherParticipants, error: participantError }, { data: summaries, error: summaryError }] = await Promise.all([
    client.from("conversation_participants").select("conversation_id,user_id,last_read_at,profiles:member_profiles(id,full_name,avatar_url)").in("conversation_id", convIds).neq("user_id", userId),
    client.rpc("direct_conversation_summaries"),
  ])
  if (participantError || summaryError) throw new Error("No se pudo cargar tu bandeja de mensajes.")

  // Otro participante por conversación
  const otherByConv = new Map<
    string,
    { id: string; full_name: string; avatar_url: string | null; last_read_at?: string | null }
  >()
  for (const p of otherParticipants ?? []) {
    if (otherByConv.has(p.conversation_id)) continue
    const raw = p.profiles
    const prof = (Array.isArray(raw) ? raw[0] : raw) as
      | { id: string; full_name: string; avatar_url: string | null }
      | null
    if (prof) {
      otherByConv.set(p.conversation_id, {
        ...prof,
        last_read_at: p.last_read_at,
      })
    }
  }

  const summaryByConv = new Map<string, { body: string | null; created_at: string | null; sender_id: string | null; unread_count: number }>(
    (summaries ?? []).map((row: { conversation_id: string; body: string | null; created_at: string | null; sender_id: string | null; unread_count: number }) => [row.conversation_id, row])
  )

  const results = rows.map((row) => {
    const rawConv = row.conversations
    const conv = (Array.isArray(rawConv) ? rawConv[0] : rawConv) as
      | { last_message_at: string }
      | null

    return {
      conversationId: row.conversation_id,
      otherUser: otherByConv.get(row.conversation_id) ?? null,
      lastMessage: summaryByConv.get(row.conversation_id)?.body != null ? {
        body: summaryByConv.get(row.conversation_id)!.body!,
        created_at: summaryByConv.get(row.conversation_id)!.created_at!,
        sender_id: summaryByConv.get(row.conversation_id)!.sender_id!,
      } : null,
      unreadCount: Number(summaryByConv.get(row.conversation_id)?.unread_count ?? 0),
      lastMessageAt: conv?.last_message_at ?? null,
    }
  })

  return results.sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()
  )
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  opts: { limit?: number; before?: { created_at: string; id: string }; after?: { created_at: string; id: string } } = {}
) {
  const client = await getDbClient()
  const limit = opts.limit ?? 100

  // Verificar que el usuario pertenece a la conversación
  const { data: participant, error: partError } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle()

  if (partError) {
    console.error("[messaging] participant check error:", partError.message)
  }

  if (!participant) return null

  let query = client
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, profiles:member_profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: Boolean(opts.after) })
    .order("id", { ascending: Boolean(opts.after) })
    .limit(Math.min(100, Math.max(1,limit)))

  const cursor = opts.before ?? opts.after
  if (cursor) {
    const direction = opts.after ? "gt" : "lt"
    query = query.or(`created_at.${direction}.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.${direction}.${cursor.id})`)
  }

  const { data, error } = await query
  if (error) throw new Error("No se pudieron cargar los mensajes.")
  return opts.after ? (data ?? []) : (data ?? []).reverse()
}

export async function markConversationRead(conversationId: string, userId: string) {
  const client = await getDbClient()
  const now = new Date().toISOString()
  const results = await Promise.all([
    client
      .from("conversation_participants")
      .update({ last_read_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId),
    client
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .eq("link", `/messages/${conversationId}`)
      .is("read_at", null),
  ])
  if (results.some(result => result.error)) throw new Error("No se pudo guardar la lectura de los mensajes.")
}

// ── Comentarios en perfil ─────────────────────────────────────────────────────

export async function getProfileComments(profileId: string) {
  const client = await getDbClient()
  const { data, error } = await client
    .from("profile_comments")
    .select(`
      id, content, created_at, parent_id, author_id,
      profiles:member_profiles!profile_comments_author_id_fkey (id, full_name, avatar_url)
    `)
    .eq("profile_id", profileId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) console.error("[messaging] getProfileComments:", error.message)
  return data ?? []
}
