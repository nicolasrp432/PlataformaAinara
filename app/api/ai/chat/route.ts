import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"
import {
  buildSystemPrompt,
  getOrCreateAiConversation,
  saveAiMessage,
  getConversationHistory,
} from "@/lib/services/ai-chat"

export const runtime = "nodejs"

// Modelos estables de Google Gemini
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
]

function buildGeminiContents(
  history: Array<{ role: string; content: string }>,
  currentMessage: string,
) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []

  for (const m of history) {
    if (m.role === "system") continue
    const role: "user" | "model" = m.role === "assistant" || m.role === "model" ? "model" : "user"
    const text = m.content.trim()
    if (!text) continue

    const last = contents[contents.length - 1]
    if (last && last.role === role) {
      last.parts.push({ text })
    } else {
      contents.push({ role, parts: [{ text }] })
    }
  }

  // Añadir mensaje del usuario actual
  const trimmedCurr = currentMessage.trim()
  if (trimmedCurr) {
    const last = contents[contents.length - 1]
    if (last && last.role === "user") {
      last.parts.push({ text: trimmedCurr })
    } else {
      contents.push({ role: "user", parts: [{ text: trimmedCurr }] })
    }
  }

  // Gemini requiere que el primer turno sea 'user'
  if (contents.length > 0 && contents[0].role === "model") {
    contents.shift()
  }

  return contents
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  })
}

async function getGeminiStream(
  apiKey: string,
  systemPrompt: string,
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
): Promise<{ res: Response; model: string } | null> {
  const override = process.env.GEMINI_MODEL
  const candidates = override
    ? [override, ...GEMINI_MODELS.filter((m) => m !== override)]
    : GEMINI_MODELS

  for (const model of candidates) {
    try {
      const res = await callGemini(apiKey, model, systemPrompt, contents)
      if (res.ok && res.body) return { res, model }
      const errSnippet = await res.text().catch(() => "").then((t) => t.slice(0, 200))
      console.warn(`[ai/chat] Gemini model ${model} → ${res.status}: ${errSnippet}`)
    } catch (e) {
      console.warn(`[ai/chat] Error calling Gemini model ${model}:`, e)
    }
  }
  return null
}

// Modelos estables de Groq (Fallback secundario)
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]

async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<Response> {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1024, temperature: 0.7 }),
  })
}

async function getGroqStream(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
): Promise<{ res: Response; model: string } | null> {
  const override = process.env.GROQ_MODEL
  const candidates = override
    ? [override, ...GROQ_MODELS.filter((m) => m !== override)]
    : GROQ_MODELS

  for (const model of candidates) {
    try {
      const res = await callGroq(apiKey, model, messages)
      if (res.ok && res.body) return { res, model }
      const errSnippet = await res.text().catch(() => "").then((t) => t.slice(0, 200))
      console.warn(`[ai/chat] Groq model ${model} → ${res.status}: ${errSnippet}`)
    } catch (e) {
      console.warn(`[ai/chat] Error calling Groq model ${model}:`, e)
    }
  }
  return null
}

function generateAutonomousWisdom(
  userMessage: string,
  lessonTitle?: string,
): string {
  const lower = userMessage.toLowerCase()

  if (lower.includes("aplicar") || lower.includes("vida cotidiana") || lower.includes("práctica") || lower.includes("practica")) {
    return `Para aterrizar esto en tu día a día de forma real y tangible, te propongo este ejercicio de 3 pasos conscientes:

1. **La Pausa Sagrada (Micro-hábito):**
   Antes de reaccionar ante una situación cotidiana que te desafíe, haz una respiración profunda en 4 tiempos y pregúntate: *«¿Estoy respondiendo desde mi centro o desde un viejo condicionamiento?»*.

2. **Acción Coherente:**
   Elige una pequeña acción consciente hoy, por sencilla que parezca. La verdadera maestría no surge de grandes gestos, sino de la coherencia en los detalles silenciosos.

3. **Cierre en el Diario:**
   Al final de la jornada, ve a tu **Diario de Reflexión** y anota qué sentiste al elegir la presencia en lugar del piloto automático.

${lessonTitle ? `Recuerda lo que exploramos en *«${lessonTitle}»*: ` : ""}El conocimiento que no se practica se convierte en peso; el que se integra en la vida diaria, se convierte en libertad interior.`
  }

  if (lower.includes("reflexión") || lower.includes("reflexion") || lower.includes("pregunta") || lower.includes("autoconocimiento")) {
    return `Aquí tienes dos preguntas poderosas para explorar en tu interior hoy:

• **¿Qué parte de mí está pidiendo ser escuchada en este momento que suelo ignorar por la prisa o el ruido externo?**
• **Si supiera con certeza que no tengo nada que demostrar, ¿qué decisión tomaría hoy con respecto a lo que me preocupa?**

Tómate unos minutos de quietud para sentirlas en el cuerpo. Si surge una revelación auténtica, regístrala en tu **Diario de Reflexión** o compártela en **La Taberna** con los demás exploradores.`
  }

  if (lower.includes("resumen") || lower.includes("puntos clave") || lower.includes("recordar") || lower.includes("sintesis")) {
    return `Aquí tienes los 3 pilares esenciales para recordar e integrar:

1. **Autobservación sin juicio:** No puedes transformar lo que te niegas a mirar con honestidad compasiva.
2. **Responsabilidad creadora:** Tu atención es tu energía más valiosa; donde pones tu foco, pones tu poder de manifestación.
3. **Paciencia con tu ritmo:** El despertar de consciencia no es una carrera, es una profundización continua en la verdad de quien ya eres.

Guarda estos principios cerca para que te acompañen a lo largo del día.`
  }

  return `Comprendo profundamente lo que me transmites. En el camino del autoconocimiento, cada duda o inquietud es una puerta hacia un nivel más profundo de comprensión.

${
  lessonTitle
    ? `En relación con lo que exploramos en **${lessonTitle}**, el secreto está en no apresurarte a encontrar respuestas mentales inmediatas, sino en observar lo que surge con serenidad y presencia.`
    : `El secreto está en no apresurarte a buscar una respuesta puramente intelectual, sino en escuchar qué emoción o certeza tranquila surge cuando respiras y te detienes.`
}

¿Qué es lo que más resuena contigo de esto ahora mismo? Si lo deseas, puedes compartir esta inquietud en **La Taberna** para nutrirte también de las experiencias de la comunidad.`
}

export async function POST(req: NextRequest) {
  maybeSweep()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 })
  }

  const limitResult = rateLimit(req, "ai-chat", { windowMs: 24 * 60 * 60 * 1000, max: 80 }, user.id)
  const limitResp = rateLimitResponse(limitResult)
  if (limitResp) return limitResp

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 })

  const {
    message,
    conversationId: existingConvId,
    lessonId,
    formationId,
  } = body as {
    message: string
    conversationId?: string
    lessonId?: string
    formationId?: string
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 })
  }

  const conversationId =
    existingConvId ?? (await getOrCreateAiConversation(user.id, lessonId, formationId))

  let lessonTitle: string | undefined
  if (lessonId) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("title")
      .eq("id", lessonId)
      .single()
    lessonTitle = lesson?.title
  }

  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(lessonId, formationId),
    getConversationHistory(conversationId),
  ])

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history,
    { role: "user" as const, content: message.trim() },
  ]

  await saveAiMessage(conversationId, "user", message.trim())

  const encoder = new TextEncoder()
  const geminiApiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY

  // ── Caso 1: Google Gemini streaming prioritario ─────────────────────────
  if (geminiApiKey && geminiApiKey.trim()) {
    try {
      const geminiContents = buildGeminiContents(history, message)
      const geminiResult = await getGeminiStream(geminiApiKey.trim(), systemPrompt, geminiContents)

      if (geminiResult?.res?.body) {
        const geminiRes = geminiResult.res
        const decoder = new TextDecoder()
        let fullText = ""

        const stream = new ReadableStream({
          async start(controller) {
            const reader = geminiRes.body!.getReader()
            let buffer = ""

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() ?? ""

                for (const line of lines) {
                  const trimmed = line.trim()
                  if (!trimmed || !trimmed.startsWith("data: ")) continue
                  const data = trimmed.slice(6).trim()
                  if (data === "[DONE]") {
                    if (fullText) await saveAiMessage(conversationId, "assistant", fullText)
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    const candidate = parsed.candidates?.[0]
                    const parts = candidate?.content?.parts
                    if (Array.isArray(parts)) {
                      for (const part of parts) {
                        if (typeof part?.text === "string" && part.text) {
                          fullText += part.text
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ text: part.text })}\n\n`)
                          )
                        }
                      }
                    }
                  } catch {
                    /* skip malformed chunks */
                  }
                }
              }

              if (fullText) await saveAiMessage(conversationId, "assistant", fullText)
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            } catch (err) {
              console.error("Gemini stream error:", err)
              controller.error(err)
            } finally {
              reader.releaseLock()
            }
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Conversation-Id": conversationId,
          },
        })
      }
    } catch (err) {
      console.warn("[ai/chat] Fallo en llamada a Gemini, intentando alternativas:", err)
    }
  }

  // ── Caso 2: Groq streaming (Fallback secundario) ────────────────────────
  let groqStreamResult: { res: Response; model: string } | null = null
  if (groqApiKey && groqApiKey.trim() !== "") {
    groqStreamResult = await getGroqStream(groqApiKey, messages)
  }

  if (groqStreamResult?.res?.body) {
    const groqRes = groqStreamResult.res
    const decoder = new TextDecoder()
    let fullText = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith("data: ")) continue
              const data = trimmed.slice(6)

              if (data === "[DONE]") {
                if (fullText) await saveAiMessage(conversationId, "assistant", fullText)
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                controller.close()
                return
              }

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullText += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`))
                }
              } catch {
                /* skip malformed chunks */
              }
            }
          }
          if (fullText) await saveAiMessage(conversationId, "assistant", fullText)
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (err) {
          console.error("AI stream error:", err)
          controller.error(err)
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId,
      },
    })
  }

  // ── Caso 3: Contingencia inteligente autónoma (Siempre responde 200 OK) ──
  const wisdomText = generateAutonomousWisdom(message.trim(), lessonTitle)
  await saveAiMessage(conversationId, "assistant", wisdomText)

  // Emular streaming fluido para la interfaz
  const stream = new ReadableStream({
    async start(controller) {
      const words = wisdomText.split(" ")
      for (let i = 0; i < words.length; i++) {
        const word = (i === 0 ? "" : " ") + words[i]
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word })}\n\n`))
        // Pequeño delay de 15ms para sensación de escritura natural
        await new Promise((resolve) => setTimeout(resolve, 15))
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Conversation-Id": conversationId,
    },
  })
}
