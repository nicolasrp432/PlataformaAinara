import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function buildSystemPrompt(lessonId?: string, formationId?: string): Promise<string> {
  const supabase = await createClient()

  let context =
    "Eres un asistente de aprendizaje de Μήτρα, una plataforma de desarrollo personal y crecimiento humano. " +
    "Tu rol es ayudar a los estudiantes a comprender el contenido de sus lecciones, reflexionar sobre sus aprendizajes y resolver dudas de forma empática."

  if (lessonId) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title, description, modules(title, formations(title))")
      .eq("id", lessonId)
      .single()

    if (lesson) {
      type ModType = { title: string; formations: { title: string } | { title: string }[] | null } | null
      const rawMod = lesson.modules
      const mod = (Array.isArray(rawMod) ? rawMod[0] : rawMod) as ModType
      const formation = mod?.formations
        ? Array.isArray(mod.formations) ? mod.formations[0] : mod.formations
        : null
      context += `\n\nEstás asistiendo al estudiante en la lección: "${lesson.title}".`
      if (lesson.description) context += `\nContenido de la lección: ${lesson.description}`
      if (mod?.title) context += `\nMódulo: ${mod.title}`
      if (formation?.title) context += `\nFormación: ${formation.title}`
    }
  } else if (formationId) {
    const { data: formation } = await supabase
      .from("formations")
      .select("title, description")
      .eq("id", formationId)
      .single()

    if (formation) {
      context += `\n\nEstás asistiendo al estudiante en la formación: "${formation.title}".`
      if (formation.description) context += `\nDescripción: ${formation.description}`
    }
  }

  context +=
    "\n\nResponde siempre en español. Sé conciso, empático y orientado al crecimiento personal. " +
    "Si te preguntan algo no relacionado con el aprendizaje o el desarrollo personal, redirige amablemente la conversación. " +
    "No reveles detalles técnicos de la plataforma ni información de otros usuarios."

  return context
}

export async function getOrCreateAiConversation(
  userId: string,
  lessonId?: string,
  formationId?: string,
): Promise<string> {
  const admin = supabaseAdmin()

  let query = admin
    .from("ai_conversations")
    .select("id")
    .eq("user_id", userId)

  if (lessonId) {
    query = query.eq("lesson_id", lessonId)
  } else if (formationId) {
    query = query.eq("formation_id", formationId)
  } else {
    query = query.is("lesson_id", null).is("formation_id", null)
  }

  const { data: existing } = await query
    .order("updated_at", { ascending: false })
    .limit(1)

  if (existing && existing.length > 0) return existing[0].id

  const { data: created, error } = await admin
    .from("ai_conversations")
    .insert({
      user_id: userId,
      lesson_id: lessonId ?? null,
      formation_id: formationId ?? null,
    })
    .select("id")
    .single()

  if (error || !created) throw new Error("Failed to create AI conversation")
  return created.id
}

export async function saveAiMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  tokensUsed?: number,
): Promise<void> {
  const admin = supabaseAdmin()
  await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    tokens_used: tokensUsed ?? null,
  })
  await admin
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
}

export async function getConversationHistory(
  conversationId: string,
  limit = 20,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const admin = supabaseAdmin()
  const { data } = await admin
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit)

  return (data ?? []) as Array<{ role: "user" | "assistant"; content: string }>
}

export async function getUserConversations(userId: string) {
  const admin = supabaseAdmin()
  const { data } = await admin
    .from("ai_conversations")
    .select("id, created_at, updated_at, lesson_id, formation_id, lessons(title), formations(title)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20)
  return data ?? []
}
