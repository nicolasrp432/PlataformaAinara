import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit";
import { getAccessTier } from "@/lib/data-access";
import { hasFullAccess } from "@/lib/access";
import { aiChatSchema } from "@/lib/validations/ai-chat";
import { SseDecoder, providerText } from "@/lib/ai-stream";
import { aiErrorResponse, logAiError } from "@/lib/ai-errors";
import { readAiEnvironment } from "@/lib/env/ai";
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
  const environment = readAiEnvironment();
  const attempts: Array<{
    provider: "gemini" | "groq";
    model: string;
    key: string;
  }> = [];
  if (environment.geminiKey)
    attempts.push({ provider: "gemini", model: environment.geminiModel, key: environment.geminiKey });
  if (environment.groqKey)
    attempts.push({ provider: "groq", model: environment.groqModel, key: environment.groqKey });
  let timedOut = false;
  for (const attempt of attempts) {
    if (signal.aborted) {
      timedOut = true;
      break;
    }
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
      if (response.ok && response.body) return { response, provider, model };
      await response.body?.cancel();
      logAiError({ code: "AI_PROVIDER_UNAVAILABLE", provider, model, status: response.status, cause: "http" });
    } catch (error) {
      const timeout = attemptAbort.signal.aborted || signal.aborted;
      timedOut ||= timeout;
      logAiError({ code: timeout ? "AI_TIMEOUT" : "AI_PROVIDER_UNAVAILABLE", provider, model, cause: error });
    } finally {
      clearTimeout(headerTimeout);
    }
  }
  return { failure: timedOut ? "AI_TIMEOUT" as const : "AI_PROVIDER_UNAVAILABLE" as const };
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
    if (!readAiEnvironment().configured) {
      logAiError({ code: "AI_NOT_CONFIGURED" });
      return aiErrorResponse("AI_NOT_CONFIGURED", "El asistente no está disponible ahora. Puedes continuar la clase o volver a intentarlo más tarde.");
    }
    const prompt = await buildSystemPrompt(lessonId, formationId);
    let history: Array<{ role: "user" | "assistant"; content: string }> = [];
    let historyWarning = false;
    if (conversationId) {
      try {
        history = await getConversationHistory(user.id, conversationId);
      } catch (error) {
        logAiError({ code: "AI_HISTORY_UNAVAILABLE", provider: "database", cause: error });
        // Do not append to a conversation whose history was unavailable.
        conversationId = undefined;
        historyWarning = true;
      }
    }
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
    if ("failure" in upstream) {
      const failure = upstream.failure ?? "AI_PROVIDER_UNAVAILABLE";
      return aiErrorResponse(failure, failure === "AI_TIMEOUT"
        ? "El asistente tardó demasiado en responder. Inténtalo de nuevo."
        : "El asistente está temporalmente ocupado. Inténtalo de nuevo en unos minutos.");
    }
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
      logAiError({ code: "AI_PERSISTENCE_UNAVAILABLE", provider: "database", cause: error });
      return aiErrorResponse("AI_PERSISTENCE_UNAVAILABLE", "No se pudo guardar la conversación. Inténtalo de nuevo.");
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
          try {
            await saveAiMessage(user.id, convId, "assistant", fullText);
          } catch (error) {
            logAiError({ code: "AI_PERSISTENCE_UNAVAILABLE", provider: "database", cause: error });
            emit(JSON.stringify({
              code: "AI_PERSISTENCE_UNAVAILABLE",
              error: "La respuesta llegó, pero no se pudo guardar. Puedes volver a intentarlo.",
            }));
            return;
          }
          emit("[DONE]");
        } catch (error) {
          const code = signal.aborted ? "AI_TIMEOUT" : "AI_STREAM_INTERRUPTED";
          logAiError({ code, provider: upstream.provider, model: upstream.model, cause: error });
          emit(JSON.stringify({ code, error: "La respuesta se interrumpió. Puedes volver a intentarlo." }));
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
        ...(historyWarning ? { "X-AI-Warning": "AI_HISTORY_UNAVAILABLE" } : {}),
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logAiError({ code: "AI_DATABASE_UNAVAILABLE", provider: "database", cause: error });
    return aiErrorResponse("AI_DATABASE_UNAVAILABLE", "No se pudo preparar la conversación. Inténtalo de nuevo.");
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
  } catch (error) {
    logAiError({ code: "AI_HISTORY_UNAVAILABLE", provider: "database", cause: error });
    return aiErrorResponse("AI_HISTORY_UNAVAILABLE", "No se pudo recuperar el historial. Puedes empezar una conversación nueva.");
  }
}
