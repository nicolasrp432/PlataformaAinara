import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function buildSystemPrompt(lessonId?: string, formationId?: string): Promise<string> {
  const supabase = await createClient()

  let context =
    "Eres el Tutor y Guía de Aprendizaje de Ainara, una plataforma de educación consciente, autoconocimiento y desarrollo personal y espiritual.\n" +
    "Tu misión es acompañar a los estudiantes como un mentor sabio, cercano, lúcido y profundamente empático. " +
    "Les ayudas a comprender los conceptos de sus lecciones, resolver dudas filosóficas y prácticas, integrar hábitos conscientes y aterrizar los aprendizajes en su vida cotidiana."

  // 1. Contexto del estudiante autenticado
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, full_name, level, xp")
        .eq("id", user.id)
        .single()

      const studentName = profile?.display_name || profile?.full_name || user.user_metadata?.full_name
      if (studentName) {
        context += `\n\nEstás conversando con el/la estudiante: ${studentName}. Dirígete a él/ella con respeto, cercanía y calidez.`
      }
      if (profile?.level) {
        context += ` Nivel actual en la plataforma: Nivel ${profile.level}.`
      }
    }
  } catch {
    // Si no se puede obtener el perfil, continúa sin interrumpir
  }

  // 2. Contexto específico de la lección o formación activa
  if (lessonId) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title, description, modules(title, description, formations(title, description))")
      .eq("id", lessonId)
      .single()

    if (lesson) {
      type ModType = {
        title: string
        description?: string | null
        formations: { title: string; description?: string | null } | { title: string; description?: string | null }[] | null
      } | null
      const rawMod = lesson.modules
      const mod = (Array.isArray(rawMod) ? rawMod[0] : rawMod) as ModType
      const formation = mod?.formations
        ? Array.isArray(mod.formations)
          ? mod.formations[0]
          : mod.formations
        : null

      context += `\n\n=== CONTEXTO DE LA CLASE ACTUAL ===`
      if (formation?.title) context += `\nFormación: "${formation.title}"`
      if (mod?.title) context += `\nMódulo: "${mod.title}"`
      context += `\nLección activa: "${lesson.title}"`
      if (lesson.description) context += `\nResumen/Contenido de la lección: ${lesson.description}`
    }
  } else if (formationId) {
    const { data: formation } = await supabase
      .from("formations")
      .select("title, description, level")
      .eq("id", formationId)
      .single()

    if (formation) {
      context += `\n\n=== CONTEXTO DE LA FORMACIÓN ACTUAL ===`
      context += `\nFormación: "${formation.title}" (${formation.level || "General"})`
      if (formation.description) context += `\nDescripción: ${formation.description}`
    }
  }

  // 3. Catálogo general de clases de la plataforma para tener conocimiento global
  try {
    const { data: formations } = await supabase
      .from("formations")
      .select("title, description, modules(title, lessons(title))")
      .eq("is_published", true)
      .limit(10)

    if (formations && formations.length > 0) {
      context += `\n\n=== PROGRAMA Y CLASES DISPONIBLES EN LA PLATAFORMA ===`
      for (const f of formations) {
        context += `\n• Formación: "${f.title}"`
        const modules = Array.isArray(f.modules) ? f.modules : []
        for (const m of modules) {
          if (m?.title) {
            context += `\n   - Módulo: "${m.title}"`
            const lessons = Array.isArray(m.lessons) ? m.lessons : []
            if (lessons.length > 0) {
              const titles = lessons.map((l: { title: string }) => l.title).filter(Boolean).slice(0, 5)
              context += ` (Lecciones: ${titles.join(", ")})`
            }
          }
        }
      }
    }
  } catch {
    // Si las tablas de formaciones no están pobladas o hay fallo de conexión, continuar
  }

  // 4. Guía de estilo y pedagogía
  context +=
    "\n\n=== DIRECTRICES DE RESPUESTA ===" +
    "\n1. Responde siempre en español con tono reflexivo, cálido, inspirador y pedagógico." +
    "\n2. Ofrece explicaciones claras y luego conecta la enseñanza con una pregunta de autorreflexión o un micro-ejercicio práctico para aplicar hoy." +
    "\n3. Invita al estudiante a registrar sus descubrimientos en su «Diario de Reflexión» o a compartir preguntas en «La Taberna» si es relevante." +
    "\n4. Mantén tus respuestas concisas y bien estructuradas (puntos o párrafos cortos), sin abrumar con tecnicismos." +
    "\n5. Si el estudiante pregunta sobre algo completamente ajeno al crecimiento personal o la plataforma, redirige amablemente hacia su centro interior."

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
