const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const root = path.resolve(__dirname, "../..");
const dir = path.join(root, ".next", `qa-admin-api-${process.pid}`);
fs.mkdirSync(dir, { recursive: true });
const me = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const lesson = "20000000-0000-4000-8000-000000000001";
let state;
function db() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: state.loggedIn ? { id: me } : null },
      }),
    },
    from(table) {
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        order() {
          return query;
        },
        single() {
          return resolve();
        },
        maybeSingle() {
          return resolve();
        },
        then(ok, bad) {
          return resolve().then(ok, bad);
        },
      };
      async function resolve() {
        if (table === "profiles")
          return { data: { role: state.role }, error: null };
        if (table === "certificates")
          return { data: state.certificate, error: null };
        if (table === "quizzes") {
          state.readQuiz = true;
          return { data: { id: lesson, questions: [] }, error: null };
        }
        throw new Error(`Unexpected table ${table}`);
      }
      return query;
    },
    async rpc(name, args) {
      state.calls.push({ name, args });
      return state.fail
        ? { error: { message: "db failed" }, data: null }
        : { error: null, data: lesson };
    },
  };
}
async function compile(file, name) {
  const outfile = path.join(dir, name + ".cjs");
  await esbuild.build({
    entryPoints: [path.join(root, file)],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    plugins: [
      {
        name: "isolated-db",
        setup(build) {
          build.onResolve({ filter: /lib\/supabase\/server$/ }, () => ({
            path: "db",
            namespace: "mock",
          }));
          build.onResolve({ filter: /^next\/cache$/ }, () => ({
            path: "cache",
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents:
              args.path === "db"
                ? "export async function createClient(){return globalThis.__adminApiDb()}"
                : "export function revalidatePath(){};export function revalidateTag(){}",
          }));
        },
      },
    ],
  });
  return require(outfile);
}
const reset = () => {
  state = { loggedIn: true, role: "student", calls: [], readQuiz: false };
  globalThis.__adminApiDb = db;
};
(async () => {
  try {
    const post = await compile("app/api/admin/quizzes/route.ts", "quiz-create");
    const quiz = await compile(
      "app/api/admin/quizzes/[id]/route.ts",
      "quiz-detail",
    );
    const certificate = await compile(
      "app/api/certificates/[id]/download/route.ts",
      "certificate",
    );
    const context = { params: Promise.resolve({ id: lesson }) };
    reset();
    assert.equal(
      (
        await quiz.GET(
          new Request("http://localhost/api/admin/quizzes/" + lesson),
          context,
        )
      ).status,
      403,
    );
    assert.equal(state.readQuiz, false, "Students never fetch answer keys");
    state.role = "admin";
    const req = (data) =>
      new Request("http://localhost/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    assert.equal((await post.POST(req({}))).status, 400);
    assert.equal(state.calls.length, 0);
    const payload = {
      lessonId: lesson,
      title: "Quiz",
      passing_score: 100,
      xp_reward: 50,
      questions: [
        {
          question: "Pregunta",
          type: "true_false",
          options: [
            { option_text: "Verdadero", is_correct: true },
            { option_text: "Falso", is_correct: false },
          ],
        },
      ],
    };
    state.fail = true;
    assert.equal((await post.POST(req(payload))).status, 400);
    state.fail = false;
    assert.equal((await post.POST(req(payload))).status, 200);
    assert.equal(state.calls.at(-1).name, "admin_save_quiz");
    reset();
    state.loggedIn = false;
    assert.equal(
      (
        await certificate.GET(
          new Request("http://localhost/certificate"),
          context,
        )
      ).status,
      401,
    );
    reset();
    state.certificate = {
      id: lesson,
      user_id: other,
      certificate_number: "CERT-TEST",
      issued_at: "2026-10-07",
      profiles: { full_name: "Ángela" },
      formations: { title: "Emulsión Energética" },
    };
    assert.equal(
      (
        await certificate.GET(
          new Request("http://localhost/certificate"),
          context,
        )
      ).status,
      404,
      "Another student's PDF is denied even if an adapter returns its row",
    );
    state.certificate.user_id = me;
    let response = await certificate.GET(
      new Request("http://localhost/certificate"),
      context,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "application/pdf");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.ok((await response.arrayBuffer()).byteLength > 5000);
    state.certificate.user_id = other;
    state.role = "admin";
    response = await certificate.GET(
      new Request("http://localhost/certificate"),
      context,
    );
    assert.equal(response.status, 200);
    console.log(
      "Admin API authorization, quiz validation/transaction errors and private PDF downloads passed.",
    );
  } finally {
    delete globalThis.__adminApiDb;
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
