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

// Groq free models — tried sequentially until one succeeds.
// Register free at console.groq.com — 14,400 req/day, 30 req/min.
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "deepseek-r1-distill-llama-70b",
  "gemma2-9b-it",
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
  // If user pinned a specific model via env, try it first then fall back to the rest
  const override = process.env.GROQ_MODEL
  const candidates = override
    ? [override, ...GROQ_MODELS.filter((m) => m !== override)]
    : GROQ_MODELS

  for (const model of candidates) {
    const res = await callGroq(apiKey, model, messages)
    if (res.ok && res.body) return { res, model }
    const errSnippet = await res.text().catch(() => "").then((t) => t.slice(0, 200))
    console.warn(`[ai/chat] Groq model ${model} → ${res.status}: ${errSnippet}`)
  }
  return null
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

  const limitResult = rateLimit(req, "ai-chat", { windowMs: 24 * 60 * 60 * 1000, max: 50 }, user.id)
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

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "El asistente IA no está configurado aún." }, { status: 503 })
  }

  const conversationId =
    existingConvId ?? (await getOrCreateAiConversation(user.id, lessonId, formationId))

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

  const result = await getGroqStream(process.env.GROQ_API_KEY!, messages)
  if (!result) {
    return NextResponse.json(
      { error: "Los modelos de IA están temporalmente no disponibles. Inténtalo en unos minutos." },
      { status: 503 },
    )
  }
  const { res: groqRes } = result

  const encoder = new TextEncoder()
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
        // Stream ended without [DONE] — save whatever we accumulated
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
