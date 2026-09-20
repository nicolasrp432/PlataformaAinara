import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createNotification } from "@/lib/services/notifications"

/**
 * Resuelve el cliente de base de datos más confiable:
 * - Si SUPABASE_SERVICE_ROLE_KEY está configurada, usa supabaseAdmin() con bypass RLS.
 * - De lo contrario, usa el cliente de servidor autenticado con cookies de sesión de Next.js.
 */
async function getDbClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (serviceKey && !serviceKey.includes("placeholder") && serviceKey.length > 20) {
    return supabaseAdmin()
  }
  return await createClient()
}

// ── Conversaciones ────────────────────────────────────────────────────────────

export async function startConversation(currentUserId: string, otherUserId: string) {
  const client = await getDbClient()

  // 1. Asegurar que ambos perfiles existan en la tabla profiles
  try {
    await Promise.all([
      client.from("profiles").upsert(
        { id: currentUserId, full_name: "Explorador", role: "student" },
        { onConflict: "id", ignoreDuplicates: true }
      ),
      client.from("profiles").upsert(
        { id: otherUserId, full_name: "Explorador", role: "student" },
        { onConflict: "id", ignoreDuplicates: true }
      ),
    ])
  } catch (err) {
    console.error("[messaging] profiles check non-fatal warning:", err)
  }

  // 2. Buscar si ya existe una conversación 1:1 entre ambos usuarios
  const { data: existing } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", currentUserId)

  if (existing && existing.length > 0) {
    const myConvIds = existing.map((r) => r.conversation_id)
    const { data: shared } = await client
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", myConvIds)

    if (shared && shared.length > 0) {
      return { conversationId: shared[0].conversation_id }
    }
  }

  // 3. Crear nueva conversación
  const { data: conv, error: convError } = await client
    .from("conversations")
    .insert({})
    .select("id")
    .single()

  if (convError || !conv) {
    console.error("[messaging] startConversation insert error:", convError?.message)
    throw new Error("No se pudo crear la conversación")
  }

  // 4. Vincular participantes
  const { error: participantsError } = await client
    .from("conversation_participants")
    .insert([
      { conversation_id: conv.id, user_id: currentUserId },
      { conversation_id: conv.id, user_id: otherUserId },
    ])

  if (participantsError) {
    console.error("[messaging] participantsError:", participantsError.message)
    await client.from("conversations").delete().eq("id", conv.id)
    throw new Error("No se pudo registrar a los participantes")
  }

  return { conversationId: conv.id }
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const client = await getDbClient()
  const trimmed = body.trim()

  if (!trimmed) {
    throw new Error("El mensaje no puede estar vacío")
  }

  // 1. Asegurar que el remitente está registrado en la conversación
  const { data: curParticipants } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)

  const participantIds = new Set((curParticipants || []).map((p) => p.user_id))
  if (!participantIds.has(senderId)) {
    await client
      .from("conversation_participants")
      .insert({ conversation_id: conversationId, user_id: senderId })
  }

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

  // 3. Actualizar fecha de último mensaje en la conversación
  await client
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)

  // 4. Obtener perfil enriquecido del remitente
  const { data: senderProfile } = await client
    .from("profiles")
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
    return []
  }

  const rows = data ?? []
  if (rows.length === 0) return []

  const convIds = rows.map((r) => r.conversation_id)

  const [{ data: otherParticipants }, { data: allMessages }] = await Promise.all([
    client
      .from("conversation_participants")
      .select("conversation_id, user_id, last_read_at, profiles(id, full_name, avatar_url)")
      .in("conversation_id", convIds)
      .neq("user_id", userId),
    client
      .from("messages")
      .select("conversation_id, body, created_at, sender_id")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
  ])

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

  // Último mensaje y conteo de no leídos
  const lastReadByConv = new Map(
    rows.map((r) => [r.conversation_id, r.last_read_at ?? "1970-01-01"])
  )
  const lastMsgByConv = new Map<string, { body: string; created_at: string; sender_id: string }>()
  const unreadByConv = new Map<string, number>()

  for (const m of allMessages ?? []) {
    if (!lastMsgByConv.has(m.conversation_id)) {
      lastMsgByConv.set(m.conversation_id, {
        body: m.body,
        created_at: m.created_at,
        sender_id: m.sender_id,
      })
    }
    const lastRead = lastReadByConv.get(m.conversation_id) ?? "1970-01-01"
    if (m.sender_id !== userId && m.created_at > lastRead) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1)
    }
  }

  const results = rows.map((row) => {
    const rawConv = row.conversations
    const conv = (Array.isArray(rawConv) ? rawConv[0] : rawConv) as
      | { last_message_at: string }
      | null

    return {
      conversationId: row.conversation_id,
      otherUser: otherByConv.get(row.conversation_id) ?? null,
      lastMessage: lastMsgByConv.get(row.conversation_id) ?? null,
      unreadCount: unreadByConv.get(row.conversation_id) ?? 0,
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
  opts: { limit?: number; cursor?: string } = {}
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
    .select("id, conversation_id, sender_id, body, created_at, profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (opts.cursor) query = query.lt("created_at", opts.cursor)

  const { data, error } = await query
  if (error) console.error("[messaging] getConversationMessages error:", error.message)
  return (data ?? []).reverse()
}

export async function markConversationRead(conversationId: string, userId: string) {
  const client = await getDbClient()
  const now = new Date().toISOString()
  await Promise.all([
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
}

// ── Comentarios en perfil ─────────────────────────────────────────────────────

export async function getProfileComments(profileId: string) {
  const client = await getDbClient()
  const { data, error } = await client
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
