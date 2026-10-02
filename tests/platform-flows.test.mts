import test from "node:test";
import assert from "node:assert/strict";
import { SseDecoder, providerText } from "../lib/ai-stream.ts";
import { wallTimeToUtc, calendarSlots } from "../lib/mentorship-slots.ts";
import { lessonResourcesSchema } from "../lib/validations/lesson-resources.ts";
import { lessonResources } from "../lib/lesson-resources.ts";
import { aiChatSchema } from "../lib/validations/ai-chat.ts";
import { profileSchema } from "../lib/validations/profile.ts";
import { commentContentSchema } from "../lib/validations/comments.ts";

test("AI streams survive fragmented UTF-8, CRLF and multiple frames in a chunk", () => {
  const raw =
    ': heartbeat\r\ndata: {"text":"reflexión 💛"}\r\n\r\ndata: {"text":"segunda"}\n\ndata: [DONE]\n\n';
  const bytes = new TextEncoder().encode(raw);
  for (const size of [1, 2, 7, bytes.length]) {
    const parser = new SseDecoder();
    const events: string[] = [];
    for (let n = 0; n < bytes.length; n += size)
      events.push(...parser.push(bytes.slice(n, n + size)));
    events.push(...parser.finish());
    assert.deepEqual(events, [
      '{"text":"reflexión 💛"}',
      '{"text":"segunda"}',
      "[DONE]",
    ]);
  }
  const final = new SseDecoder();
  final.push(
    new TextEncoder().encode("event: message\ndata: first\ndata: second"),
  );
  assert.deepEqual(final.finish(), ["first\nsecond"]);
});
test("AI extracts actual provider text and rejects provider errors", () => {
  assert.equal(
    providerText(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: "interno", thought: true },
                { text: "Respuesta " },
                { text: "real" },
              ],
            },
          },
        ],
      }),
      "gemini",
    ),
    "Respuesta real",
  );
  assert.equal(
    providerText('{"choices":[{"delta":{"content":"Hola"}}]}', "groq"),
    "Hola",
  );
  assert.equal(providerText('{"choices":[]}', "groq"), "");
  assert.throws(() => providerText('{"error":{"message":"failed"}}', "gemini"));
});
test("mentoring converts wall time independently of the server timezone and skips DST gaps", () => {
  assert.equal(
    wallTimeToUtc("2026-01-15", 16 * 60, "Europe/Madrid")?.toISOString(),
    "2026-01-15T15:00:00.000Z",
  );
  assert.equal(
    wallTimeToUtc("2026-07-15", 16 * 60, "Europe/Madrid")?.toISOString(),
    "2026-07-15T14:00:00.000Z",
  );
  assert.equal(wallTimeToUtc("2026-03-29", 2 * 60 + 30, "Europe/Madrid"), null);
});
test("calendar excludes overlapping durations, blocked days and already-started slots", () => {
  const input = {
    from: new Date("2026-07-15T00:00:00Z"),
    to: new Date("2026-07-15T23:59:00Z"),
    now: Date.parse("2026-07-15T07:30:00Z"),
    duration: 60,
    zone: "Europe/Madrid",
    availability: [
      { day_of_week: 3, start_time: "09:00:00", end_time: "13:00:00" },
    ],
    blocked: [],
    busy: [{ scheduled_at: "2026-07-15T08:30:00Z", duration_minutes: 90 }],
  };
  assert.deepEqual(
    calendarSlots(input).map((slot) => slot.label),
    ["12:00"],
  );
  assert.deepEqual(calendarSlots({ ...input, blocked: ["2026-07-15"] }), []);
  for (const duration of [0, -1, 0.5, 481, Number.NaN])
    assert.deepEqual(calendarSlots({ ...input, duration }), []);
});
test("account, AI and comment validation rejects invalid input before persistence", () => {
  const profile = {
    full_name: "Ana",
    avatar_url: "",
    birth_date: "",
    birth_time: "",
    birth_city: "",
  };
  assert.equal(
    profileSchema.safeParse({ ...profile, birth_date: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, birth_date: "2099-01-01" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, birth_time: "25:00" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, avatar_url: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile, bio: "x".repeat(501) }).success,
    false,
  );
  assert.equal(aiChatSchema.safeParse({ message: "   " }).success, false);
  assert.equal(
    aiChatSchema.safeParse({
      message: "Pregunta",
      conversationId: "other-account",
    }).success,
    false,
  );
  assert.equal(
    aiChatSchema.safeParse({ message: "x".repeat(6001) }).success,
    false,
  );
  assert.equal(commentContentSchema.safeParse("   ").success, false);
});
test("lesson resources accept real HTTPS materials and reject unsafe links", () => {
  assert.deepEqual(
    lessonResources(
      '[{"name":"Cuaderno","url":"https://example.test/book.pdf"}]',
    ),
    [{ title: "Cuaderno", url: "https://example.test/book.pdf" }],
  );
  assert.deepEqual(
    lessonResources([
      { title: "Falso", url: "javascript:alert(1)" },
      { title: "Falso", url: "data:text/html,bad" },
    ]),
    [],
  );
  assert.deepEqual(lessonResources("not JSON"), []);
  assert.equal(
    lessonResourcesSchema.safeParse([
      { title: "Material", url: "javascript:alert(1)" },
    ]).success,
    false,
  );
  assert.equal(
    lessonResourcesSchema.safeParse(
      Array.from({ length: 51 }, () => ({
        title: "Material",
        url: "https://example.test/book",
      })),
    ).success,
    false,
  );
});
