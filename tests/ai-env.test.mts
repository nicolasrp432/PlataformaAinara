import test from "node:test";
import assert from "node:assert/strict";
import { readAiEnvironment } from "../lib/env/ai.ts";

const names = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_GENAI_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_MODEL",
  "GROQ_MODEL",
] as const;

test("AI environment accepts every supported key alias and normalises models", () => {
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(readAiEnvironment().configured, false);

    for (const alias of names.slice(0, 3)) {
      process.env[alias] = " gemini-secret ";
      const environment = readAiEnvironment();
      assert.equal(environment.configured, true);
      assert.equal(environment.geminiKey, "gemini-secret");
      delete process.env[alias];
    }

    process.env.GROQ_API_KEY = " groq-secret ";
    process.env.GEMINI_MODEL = " custom-gemini ";
    process.env.GROQ_MODEL = " custom-groq ";
    assert.deepEqual(readAiEnvironment(), {
      geminiKey: undefined,
      groqKey: "groq-secret",
      geminiModel: "custom-gemini",
      groqModel: "custom-groq",
      configured: true,
    });
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
