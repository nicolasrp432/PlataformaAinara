export type AiErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_HISTORY_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_DATABASE_UNAVAILABLE"
  | "AI_PERSISTENCE_UNAVAILABLE"
  | "AI_STREAM_INTERRUPTED";

type LogContext = {
  code: AiErrorCode;
  provider?: "gemini" | "groq" | "database";
  model?: string;
  status?: number;
  cause?: unknown;
};

function summariseCause(cause: unknown): string | undefined {
  if (cause instanceof DOMException && cause.name === "AbortError") return "aborted";
  if (cause instanceof Error) return cause.name || "Error";
  if (typeof cause === "number" || typeof cause === "boolean") return String(cause);
  return cause == null ? undefined : "unknown";
}

/** Structured, deliberately allow-listed logging: never add prompts, responses or keys. */
export function logAiError(context: LogContext) {
  console.error("[ai/chat]", {
    code: context.code,
    provider: context.provider ?? "none",
    model: context.model ?? "none",
    status: context.status ?? null,
    cause: summariseCause(context.cause) ?? "unspecified",
  });
}

export function aiErrorResponse(code: AiErrorCode, error: string, status = 503) {
  return Response.json({ code, error }, { status });
}
