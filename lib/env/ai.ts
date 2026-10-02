export type AiEnvironment = {
  geminiKey?: string;
  groqKey?: string;
  geminiModel: string;
  groqModel: string;
  configured: boolean;
};

const value = (name: string) => process.env[name]?.trim() || undefined;

/** Reads and normalises every AI variable. Never return or log this object directly. */
export function readAiEnvironment(): AiEnvironment {
  const geminiKey =
    value("GEMINI_API_KEY") ??
    value("GOOGLE_API_KEY") ??
    value("GOOGLE_GENAI_API_KEY");
  const groqKey = value("GROQ_API_KEY");
  return {
    geminiKey,
    groqKey,
    geminiModel: value("GEMINI_MODEL") ?? "gemini-2.5-flash",
    groqModel: value("GROQ_MODEL") ?? "llama-3.3-70b-versatile",
    configured: Boolean(geminiKey || groqKey),
  };
}

// Validate eagerly when the server module is initialised, without printing secrets.
export const initialAiEnvironment = readAiEnvironment();
if (!initialAiEnvironment.configured && process.env.NODE_ENV !== "test") {
  console.warn("[ai/config] no AI provider configured");
}
