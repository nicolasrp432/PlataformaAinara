// Executes the actual API handler with isolated provider/database adapters.
const esbuild = require("esbuild");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const fs = require("node:fs");
const outputDir = root + "/.next/qa-" + process.pid;
fs.mkdirSync(outputDir, { recursive: true });
let state;
const ids = {
  me: "10000000-0000-4000-8000-000000000001",
  other: "10000000-0000-4000-8000-000000000002",
  conversation: "20000000-0000-4000-8000-000000000001",
};
function query(table) {
  const filter = {};
  let inserted,
    selected = false;
  const q = {
    select() {
      selected = true;
      return q;
    },
    eq(k, v) {
      filter[k] = v;
      return q;
    },
    is(k, v) {
      filter[k] = v;
      return q;
    },
    order() {
      return q;
    },
    limit() {
      return q;
    },
    maybeSingle() {
      return resolve();
    },
    single() {
      return resolve();
    },
    insert(v) {
      inserted = v;
      return q;
    },
    update() {
      return q;
    },
    then(ok, bad) {
      return resolve().then(ok, bad);
    },
  };
  async function resolve() {
    if (table === "ai_conversations") {
      if (inserted) {
        state.created++;
        return { data: { id: ids.conversation }, error: null };
      }
      return {
        data:
          state.owner === filter.user_id
            ? selected
              ? { id: ids.conversation, lesson_id: null, formation_id: null }
              : []
            : null,
        error: null,
      };
    }
    if (table === "ai_messages") {
      if (inserted) {
        state.saved.push(inserted);
        return { data: inserted, error: null };
      }
      return { data: [], error: null };
    }
    if (table === "profiles")
      return { data: { full_name: "Ana", level: 1 }, error: null };
    if (table === "formations") return { data: [], error: null };
    return { data: null, error: null };
  }
  return q;
}
async function main() {
  await esbuild.build({
    entryPoints: [path.join(root, "app/api/ai/chat/route.ts")],
    outfile: outputDir + "/api-route.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    nodePaths: [path.join(root, "node_modules")],
    plugins: [
      {
        name: "stub",
        setup(b) {
          b.onResolve({ filter: /^@\/lib\/supabase\/server$/ }, () => ({
            path: "db",
            namespace: "stub",
          }));
          b.onResolve({ filter: /^@\/lib\/data-access$/ }, () => ({
            path: "access",
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, (a) => ({
            contents:
              a.path === "db"
                ? "export async function createClient(){return global.__client}"
                : "export async function getAccessTier(){return global.__tier}",
            loader: "js",
          }));
        },
      },
    ],
  });
  const { POST, GET } = require(outputDir + "/api-route.cjs");
  const { NextRequest } = require(path.join(root, "node_modules/next/server"));
  global.__client = {
    auth: {
      getUser: async () => ({
        data: { user: state.user ? { id: ids.me, user_metadata: {} } : null },
      }),
    },
    from: query,
  };
  const request = (data) =>
    new NextRequest("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  const reset = () => {
    state = { user: true, owner: ids.me, created: 0, saved: [], calls: [] };
    global.__tier = "member";
    for (const k of [
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "GOOGLE_GENAI_API_KEY",
      "GROQ_API_KEY",
    ])
      delete process.env[k];
  };
  reset();
  state.user = false;
  assert.equal((await POST(request({ message: "Hola" }))).status, 401);
  reset();
  global.__tier = "free";
  assert.equal((await POST(request({ message: "Hola" }))).status, 403);
  reset();
  assert.equal((await POST(request({ message: "   " }))).status, 400);
  reset();
  state.owner = ids.other;
  global.fetch = () => {
    throw Error("Provider must never see an unowned conversation");
  };
  assert.equal(
    (await POST(request({ message: "Hola", conversationId: ids.conversation })))
      .status,
    404,
  );
  reset();
  assert.equal((await POST(request({ message: "Hola" }))).status, 503);
  assert.equal(state.created, 0);
  assert.equal(state.saved.length, 0);
  reset();
  process.env.GEMINI_API_KEY = "qa-not-real";
  process.env.GROQ_API_KEY = "qa-not-real";
  global.fetch = async (url, opts) => {
    state.calls.push({ url, headers: opts.headers });
    if (String(url).includes("googleapis"))
      return new Response("provider down", { status: 503 });
    return new Response(
      'data: {"choices":[{"delta":{"content":"Respuesta real"}}]}\r\n\r\ndata: [DONE]\r\n\r\n',
      { status: 200 },
    );
  };
  let response = await POST(request({ message: "Ayúdame con mi práctica" }));
  assert.equal(response.status, 200);
  let body = await response.text();
  assert.match(body, /Respuesta real/);
  assert.match(body, /\[DONE\]/);
  assert.equal(state.saved[1].content, "Respuesta real");
  assert.ok(state.calls.every((c) => !c.url.includes("qa-not-real")));
  assert.equal(state.calls[0].headers["x-goog-api-key"], "qa-not-real");
  reset();
  process.env.GROQ_API_KEY = "qa-not-real";
  global.fetch = async () => new Response("data: [DONE]\n\n");
  response = await POST(request({ message: "Hola" }));
  body = await response.text();
  assert.match(body, /error/);
  assert.doesNotMatch(body, /\[DONE\]/);
  assert.equal(state.saved.length, 1);
  reset();
  process.env.GROQ_API_KEY = "qa-not-real";
  global.fetch = async () =>
    new Response(
      'data: {"choices":[{"delta":{"content":"Parcial"}}]}\n\ndata: {"error":{"message":"failure"}}\n\n',
    );
  response = await POST(request({ message: "Hola" }));
  body = await response.text();
  assert.match(body, /Parcial/);
  assert.match(body, /error/);
  assert.doesNotMatch(body, /\[DONE\]/);
  assert.equal(state.saved.length, 1);
  reset();
  response = await GET(new NextRequest("http://localhost/api/ai/chat"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).conversationId, ids.conversation);
  console.log(
    "AI route: auth, paid access, ownership, missing provider, fallback, real persistence, empty/failed SSE and private history verified with simulated providers.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(outputDir, { recursive: true, force: true }));
