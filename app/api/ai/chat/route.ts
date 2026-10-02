import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit";
import { getAccessTier } from "@/lib/data-access";
import { hasFullAccess } from "@/lib/access";
import { aiChatSchema } from "@/lib/validations/ai-chat";
import { SseDecoder, providerText } from "@/lib/ai-stream";
import {
  buildSystemPrompt,
  createAiConversation,
  getOwnedAiConversation,
  saveAiMessage,
  getConversationHistory,
} from "@/lib/services/ai-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatNotFoundCode =
  | "CONVERSATION_NOT_FOUND"
  | "LESSON_NOT_FOUND"
  | "FORMATION_NOT_FOUND";

function notFound(
  code: ChatNotFoundCode,
  error: string,
  context: Record<string, string | undefined>,
) {
  console.warn("[ai/chat] resource_not_found", {
    event: "ai_chat_resource_not_found",
    code,
    ...context,
  });
  return NextResponse.json({ error, code }, { status: 404 });
}

async function connectProvider(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  signal: AbortSignal,
) {
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const attempts: Array<{
    provider: "gemini" | "groq";
    model: string;
    key: string;
  }> = [];
  if (geminiKey?.trim())
    for (const model of new Set(
      [process.env.GEMINI_MODEL, "gemini-2.5-flash"].filter(Boolean),
    ))
      attempts.push({
        provider: "gemini",
        model: model!,
        key: geminiKey.trim(),
      });
  if (groqKey?.trim())
    for (const model of new Set(
      [
        process.env.GROQ_MODEL,
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
      ].filter(Boolean),
    ))
      attempts.push({ provider: "groq", model: model!, key: groqKey.trim() });
  for (const attempt of attempts) {
    if (signal.aborted) break;
    const { provider, model, key } = attempt;
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> =
      [];
    for (const message of messages) {
      if (message.role === "system") continue;
      const role = message.role === "assistant" ? "model" : "user";
      if (!contents.length && role === "model") continue;
      if (contents.at(-1)?.role === role)
        contents.at(-1)!.parts.push({ text: message.content });
      else contents.push({ role, parts: [{ text: message.content }] });
    }
    const attemptAbort = new AbortController();
    const headerTimeout = setTimeout(() => attemptAbort.abort(), 12_000);
    try {
      const response = await fetch(
        provider === "gemini"
          ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`
          : "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          signal: AbortSignal.any([signal, attemptAbort.signal]),
          headers: {
            "Content-Type": "application/json",
            ...(provider === "gemini"
              ? { "x-goog-api-key": key }
              : { Authorization: `Bearer ${key}` }),
          },
          body: JSON.stringify(
            provider === "gemini"
              ? {
                  systemInstruction: { parts: [{ text: systemPrompt }] },
                  contents,
                  generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
                }
              : {
                  model,
                  messages,
                  stream: true,
                  max_tokens: 2048,
                  temperature: 0.6,
                },
          ),
        },
      );
      if (response.ok && response.body) return { response, provider };
      await response.body?.cancel();
      console.warn(`[ai/chat] ${provider}: ${response.status}`);
    } catch {
      if (!signal.aborted) console.warn(`[ai/chat] ${provider} no disponible`);
    } finally {
      clearTimeout(headerTimeout);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Inicia sesión para usar el asistente." },
        { status: 401 },
      );
    if (!hasFullAccess(await getAccessTier(user.id)))
      return NextResponse.json(
        { error: "El asistente está incluido con el acceso completo a Mitra." },
        { status: 403 },
      );
    const parsed = aiChatSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Pregunta inválida." },
        { status: 400 },
      );
    maybeSweep();
    const limited = rateLimitResponse(
      rateLimit(req, "ai-chat", { windowMs: 86_400_000, max: 80 }, user.id),
    );
    if (limited) return limited;
    const input = parsed.data;
    let lessonId = input.lessonId;
    let formationId = input.formationId;
    let conversationId = input.conversationId;
    if (conversationId) {
      let owned;
      try {
        owned = await getOwnedAiConversation(user.id, conversationId);
      } catch {
        return notFound(
          "CONVERSATION_NOT_FOUND",
          "Conversación no disponible.",
          { userId: user.id, conversationId },
        );
      }
      if (
        (lessonId && lessonId !== owned.lesson_id) ||
        (formationId && formationId !== owned.formation_id)
      ) {
        console.warn("[ai/chat] conversation_context_mismatch", {
          event: "ai_chat_conversation_context_mismatch",
          code: "CONVERSATION_CONTEXT_MISMATCH",
          userId: user.id,
          conversationId,
          lessonId,
          formationId,
          conversationLessonId: owned.lesson_id,
          conversationFormationId: owned.formation_id,
        });
        return NextResponse.json(
          {
            error: "El contexto no pertenece a esta conversación.",
            code: "CONVERSATION_CONTEXT_MISMATCH",
          },
          { status: 409 },
        );
      }
      lessonId = owned.lesson_id ?? undefined;
      formationId = owned.formation_id ?? undefined;
    }
    // The authenticated client applies content RLS. Never build context with service role.
    if (lessonId) {
      const { data, error } = await client
        .from("lessons")
        .select("id")
        .eq("id", lessonId)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data)
        return notFound(
          "LESSON_NOT_FOUND",
          "Lección no disponible.",
          { userId: user.id, lessonId },
        );
    }
    if (formationId) {
      const { data, error } = await client
        .from("formations")
        .select("id")
        .eq("id", formationId)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data)
        return notFound(
          "FORMATION_NOT_FOUND",
          "Formación no disponible.",
          { userId: user.id, formationId },
        );
    }
    const hasProvider = [
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.GOOGLE_GENAI_API_KEY,
      process.env.GROQ_API_KEY,
    ].some((key) => key?.trim());
    if (!hasProvider)
      return NextResponse.json(
        {
          error:
            "El asistente no está disponible ahora. Puedes continuar la clase o volver a intentarlo más tarde.",
        },
        { status: 503 },
      );
    const prompt = await buildSystemPrompt(lessonId, formationId);
    const history = conversationId
      ? await getConversationHistory(user.id, conversationId)
      : [];
    const messages = [
      { role: "system", content: prompt },
      ...history,
      { role: "user", content: input.message },
    ];
    const abort = new AbortController();
    const signal = AbortSignal.any([
      req.signal,
      abort.signal,
      AbortSignal.timeout(55_000),
    ]);
    const upstream = await connectProvider(prompt, messages, signal);
    if (!upstream)
      return NextResponse.json(
        {
          error:
            "El asistente está temporalmente ocupado. Inténtalo de nuevo en unos minutos.",
        },
        { status: 503 },
      );
    try {
      conversationId ??= await createAiConversation(
        user.id,
        lessonId,
        formationId,
      );
      await saveAiMessage(user.id, conversationId, "user", input.message);
    } catch (error) {
      abort.abort();
      await upstream.response.body?.cancel().catch(() => {});
      throw error;
    }
    const reader = upstream.response.body!.getReader();
    const encoder = new TextEncoder();
    const parser = new SseDecoder();
    const convId = conversationId;
    let fullText = "";
    let terminated = false;
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (data: string) =>
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        const consume = (events: string[]) => {
          for (const event of events) {
            if (event === "[DONE]") {
              terminated = true;
              break;
            }
            const text = providerText(event, upstream.provider);
            if (text) {
              fullText += text;
              emit(JSON.stringify({ text }));
            }
          }
        };
        try {
          while (!terminated) {
            const { done, value } = await reader.read();
            if (done) {
              consume(parser.finish());
              break;
            }
            consume(parser.push(value));
          }
          if (!fullText.trim())
            throw new Error(
              "No se recibió una respuesta. Prueba con otra pregunta.",
            );
          await saveAiMessage(user.id, convId, "assistant", fullText);
          emit("[DONE]");
        } catch {
          if (!signal.aborted)
            emit(
              JSON.stringify({
                error:
                  "La respuesta se interrumpió. Puedes volver a intentarlo.",
              }),
            );
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
          try {
            controller.close();
          } catch {
            /* browser cancelled */
          }
        }
      },
      cancel() {
        abort.abort();
        return reader.cancel().catch(() => {});
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "X-Conversation-Id": convId,
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo recuperar tu conversación. Inténtalo de nuevo." },
      { status: 503 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Inicia sesión para recuperar tu conversación." },
        { status: 401 },
      );
    if (!hasFullAccess(await getAccessTier(user.id)))
      return NextResponse.json(
        { error: "El asistente requiere acceso completo." },
        { status: 403 },
      );
    const parsed = aiChatSchema.safeParse({
      message: "historial",
      lessonId: req.nextUrl.searchParams.get("lessonId"),
      formationId: req.nextUrl.searchParams.get("formationId"),
    });
    if (!parsed.success)
      return NextResponse.json(
        { error: "Contexto inválido." },
        { status: 400 },
      );
    let query = client
      .from("ai_conversations")
      .select("id")
      .eq("user_id", user.id);
    query = parsed.data.lessonId
      ? query.eq("lesson_id", parsed.data.lessonId)
      : query.is("lesson_id", null);
    query = parsed.data.formationId
      ? query.eq("formation_id", parsed.data.formationId)
      : query.is("formation_id", null);
    const { data: conversation, error } = await query
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!conversation)
      return NextResponse.json(
        { conversationId: null, messages: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    const { data: messages, error: messageError } = await client
      .from("ai_messages")
      .select("id,role,content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(40);
    if (messageError) throw messageError;
    return NextResponse.json(
      { conversationId: conversation.id, messages: (messages ?? []).reverse() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "No se pudo recuperar el historial. Puedes empezar una conversación nueva.",
      },
      { status: 503 },
    );
  }
}
