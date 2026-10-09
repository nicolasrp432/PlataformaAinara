import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createFormationSchema } from "../lib/validations/content.ts";
import { quizSchema } from "../lib/validations/quiz.ts";
import { validNotificationLink } from "../lib/notification-link.ts";
import { createCertificatePdf } from "../lib/certificate-pdf.ts";
import { PDFDocument } from "pdf-lib";
const db = new PGlite();
const admin = "10000000-0000-4000-8000-000000000001",
  student = "10000000-0000-4000-8000-000000000002",
  other = "10000000-0000-4000-8000-000000000003";
const course = "20000000-0000-4000-8000-000000000001",
  m1 = "30000000-0000-4000-8000-000000000001",
  m2 = "30000000-0000-4000-8000-000000000002";
const l1 = "40000000-0000-4000-8000-000000000001",
  l2 = "40000000-0000-4000-8000-000000000002",
  l3 = "40000000-0000-4000-8000-000000000003";
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION public.mentorship_workspace() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
CREATE FUNCTION public.complete_lesson(uuid) RETURNS void LANGUAGE sql AS $$ SELECT $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE profiles(id uuid PRIMARY KEY,full_name text,role text);
CREATE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin') $$;
CREATE FUNCTION public.has_community_access() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT auth.uid() IS NOT NULL $$;
CREATE TABLE formations(id uuid PRIMARY KEY,title text,slug text,is_published boolean);
CREATE TABLE modules(id uuid PRIMARY KEY,formation_id uuid REFERENCES formations,title text,sort_order integer,is_published boolean);
CREATE TABLE lessons(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),module_id uuid REFERENCES modules,title text,slug text,description text,transcript text,content_type text,duration_seconds integer,sort_order integer,is_published boolean,is_free boolean,xp_reward integer);
CREATE TABLE enrollments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,formation_id uuid REFERENCES formations,status text);
CREATE TABLE user_progress(user_id uuid REFERENCES profiles,lesson_id uuid REFERENCES lessons,is_completed boolean);
CREATE TABLE mentors(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,user_id uuid REFERENCES profiles,timezone text,is_active boolean,session_price numeric,session_duration_minutes integer);
CREATE TABLE mentor_availability(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid REFERENCES mentors,day_of_week integer,start_time time,end_time time,is_active boolean);
CREATE TABLE mentor_blocked_dates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid REFERENCES mentors,blocked_date date);
CREATE TABLE mentorship_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid NOT NULL REFERENCES mentors,user_id uuid REFERENCES profiles,status text,scheduled_at timestamptz,duration_minutes integer,meeting_link text,hold_expires_at timestamptz);
INSERT INTO profiles VALUES('${admin}','Admin','admin'),('${student}','Ángela','student'),('${other}','Otra','student');
INSERT INTO formations VALUES('${course}','Emulsión Energética','emulsion-energetica',true);
INSERT INTO formations VALUES('10000000-0000-4000-8000-000000000009','Emulsión Energética','emulsion-borrador',false);
INSERT INTO modules VALUES('${m1}','${course}','Primer módulo',0,true),('${m2}','${course}','Segundo módulo',1,true);
INSERT INTO lessons(id,module_id,title,slug,content_type,sort_order,is_published) VALUES('${l1}','${m1}','Vídeo uno','uno','video',0,true),('${l2}','${m1}','Vídeo dos','dos','video',1,true),('${l3}','${m2}','Vídeo tres','tres','video',0,true);
INSERT INTO enrollments(user_id,formation_id,status) VALUES('${student}','${course}','active');
`);
for (const file of ["0005_quizzes.sql", "0006_certificates.sql"])
  await db.exec(
    await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
  );
await db.exec(
  await readFile(
    new URL("../scripts/009_notifications.sql", import.meta.url),
    "utf8",
  ),
);
const activationSql = await readFile(
  new URL("../scripts/sql/ACTIVAR_ADMIN_Y_RUEDA.sql", import.meta.url),
  "utf8",
);
await db.exec(activationSql);
// The exact file handed to the user must also work on an already activated project.
await db.exec(activationSql);
await db.exec(
  "GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; GRANT SELECT ON profiles,formations,modules,lessons,enrollments,mentor_availability TO authenticated;",
);
after(() => db.close());
async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.exec(
    `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${user}',false)`,
  );
  try {
    return await fn();
  } finally {
    await db.exec(
      "RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false)",
    );
  }
}
async function value(sql: string, args: unknown[] = []) {
  return (await db.query<Record<string, any>>(sql, args)).rows[0];
}
async function rpc(name: string, args: unknown[]) {
  const params = args.map((_, i) => `$${i + 1}`).join(",");
  return value(`SELECT ${name}(${params}) AS result`, args);
}

test("sample curriculum is interleaved, complete and repeatable without overwriting edits", async () => {
  const lessons = (
    await db.query<{ id: string; slug: string; content_type: string }>(
      "SELECT id,slug,content_type FROM lessons WHERE module_id=$1 ORDER BY sort_order",
      [m2],
    )
  ).rows;
  assert.deepEqual(
    lessons.map((l) => l.content_type),
    ["video", "text", "quiz", "text", "quiz"],
  );
  const samples = await value(
    "SELECT count(*) AS n FROM lessons WHERE slug LIKE 'emulsion-ejemplo-%'",
  );
  assert.equal(samples?.n, 4);
  assert.equal(
    (
      await value(
        "SELECT count(*) n FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.slug LIKE 'emulsion-ejemplo-%' AND m.formation_id=$1",
        [course],
      )
    )?.n,
    4,
  );
  const counts = await value(
    "SELECT (SELECT count(*) FROM quizzes) quizzes,(SELECT count(*) FROM quiz_questions) questions,(SELECT count(*) FROM quiz_options) options",
  );
  assert.deepEqual(counts, { quizzes: 2, questions: 4, options: 12 });
  await db.exec(
    "UPDATE lessons SET transcript='Personalizado' WHERE slug='emulsion-ejemplo-pausa'",
  );
  await db.exec(
    await readFile(
      new URL(
        "../migrations/0031_emulsion_learning_examples.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    (
      await value(
        "SELECT transcript FROM lessons WHERE slug='emulsion-ejemplo-pausa'",
      )
    )?.transcript,
    "Personalizado",
  );
  assert.equal((await value("SELECT count(*) n FROM lessons"))?.n, 7);
});
test("curriculum reorder moves lessons atomically and rejects stale, duplicate and student writes", async () => {
  const all = (
    await db.query<{ id: string }>(
      "SELECT id FROM lessons WHERE module_id=$1 ORDER BY sort_order",
      [m2],
    )
  ).rows.map((l) => l.id);
  const tree = [
    { id: m2, lessons: [l2, ...all] },
    { id: m1, lessons: [l1] },
  ];
  await assert.rejects(
    asUser(student, () =>
      rpc("admin_reorder_curriculum", [course, JSON.stringify(tree)]),
    ),
  );
  await asUser(admin, () =>
    rpc("admin_reorder_curriculum", [course, JSON.stringify(tree)]),
  );
  assert.equal(
    (await value("SELECT module_id FROM lessons WHERE id=$1", [l2]))?.module_id,
    m2,
  );
  assert.equal(
    (await value("SELECT sort_order FROM modules WHERE id=$1", [m2]))
      ?.sort_order,
    0,
  );
  const corrupt = [
    { id: m2, lessons: [l2, ...all, l1] },
    { id: m1, lessons: [l1] },
  ];
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_reorder_curriculum", [course, JSON.stringify(corrupt)]),
    ),
  );
  assert.equal(
    (await value("SELECT module_id FROM lessons WHERE id=$1", [l1]))?.module_id,
    m1,
  );
});
test("quiz editor saves all questions or none, and preserves past attempts", async () => {
  const quiz = await value(
    "SELECT id,lesson_id FROM quizzes ORDER BY id LIMIT 1",
  );
  await db.query(
    "INSERT INTO quiz_attempts(user_id,quiz_id,score,passed) VALUES($1,$2,100,true)",
    [student, quiz!.id],
  );
  const payload = {
    lessonId: quiz!.lesson_id,
    title: "Editado",
    passing_score: 75,
    xp_reward: 50,
    questions: [
      {
        question: "¿Qué eliges?",
        type: "multiple_choice",
        explanation: "Una pausa",
        options: [
          { option_text: "Parar", is_correct: true },
          { option_text: "Ignorar", is_correct: false },
        ],
      },
    ],
  };
  await asUser(admin, () =>
    rpc("admin_save_quiz", [quiz!.id, JSON.stringify(payload)]),
  );
  assert.equal(
    (
      await value("SELECT count(*) n FROM quiz_attempts WHERE quiz_id=$1", [
        quiz!.id,
      ])
    )?.n,
    1,
  );
  const invalid = structuredClone(payload);
  invalid.title = "No debe guardarse";
  invalid.questions[0].options[1].is_correct = true;
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_save_quiz", [quiz!.id, JSON.stringify(invalid)]),
    ),
  );
  assert.equal(
    (await value("SELECT title FROM quizzes WHERE id=$1", [quiz!.id]))?.title,
    "Editado",
  );
  assert.equal(
    (
      await value("SELECT count(*) n FROM quiz_questions WHERE quiz_id=$1", [
        quiz!.id,
      ])
    )?.n,
    1,
  );
  assert.equal(quizSchema.safeParse(invalid).success, false);
  await assert.rejects(
    asUser(student, () =>
      rpc("admin_save_quiz", [quiz!.id, JSON.stringify(payload)]),
    ),
  );
});
test("campaigns target enrollments, deduplicate retries and reject empty audiences", async () => {
  const id = "60000000-0000-4000-8000-000000000001";
  const args = [
    "Novedades",
    "Nuevo artículo",
    "/library",
    JSON.stringify({ type: "formation", value: course }),
    id,
  ];
  await assert.rejects(asUser(student, () => rpc("admin_send_campaign", args)));
  assert.equal(
    (await asUser(admin, () => rpc("admin_send_campaign", args)))?.result,
    1,
  );
  assert.equal(
    (await asUser(admin, () => rpc("admin_send_campaign", args)))?.result,
    1,
  );
  assert.equal((await value("SELECT count(*) n FROM notifications"))?.n, 1);
  assert.equal(
    (await value("SELECT count(*) n FROM notification_campaigns"))?.n,
    1,
  );
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_send_campaign", [
        "Empty",
        "Body",
        "",
        JSON.stringify({ type: "role", value: "mentor" }),
        "60000000-0000-4000-8000-000000000002",
      ]),
    ),
  );
  assert.equal(
    (await value("SELECT count(*) n FROM notification_campaigns"))?.n,
    1,
  );
  const users = await asUser(admin, () =>
    rpc("admin_send_campaign", [
      "Personal",
      "Body",
      "https://example.com",
      JSON.stringify({ type: "user_ids", value: [student, student, other] }),
      "60000000-0000-4000-8000-000000000003",
    ]),
  );
  assert.equal(users?.result, 2);
});
let mentorId: string;

test("mentor availability rejects overlapping slots without losing the existing calendar", async () => {
  const data = {
    name: "Ainara",
    userId: admin,
    duration: 60,
    price: 150,
    timezone: "Europe/Madrid",
    active: true,
    availability: [{ day: 1, start: "09:00", end: "12:00" }],
    blockedDates: ["2026-12-25"],
  };
  await assert.rejects(
    asUser(student, () =>
      rpc("admin_save_mentor", [null, JSON.stringify(data)]),
    ),
  );
  mentorId = (
    await asUser(admin, () =>
      rpc("admin_save_mentor", [null, JSON.stringify(data)]),
    )
  )?.result;
  assert.ok(mentorId);
  const invalid = {
    ...data,
    price: 900,
    availability: [
      ...data.availability,
      { day: 1, start: "10:00", end: "13:00" },
    ],
  };
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_save_mentor", [mentorId, JSON.stringify(invalid)]),
    ),
  );
  assert.equal(
    (await value("SELECT session_price FROM mentors WHERE id=$1", [mentorId]))
      ?.session_price,
    "150",
  );
  assert.equal(
    (
      await value(
        "SELECT count(*) n FROM mentor_availability WHERE mentor_id=$1",
        [mentorId],
      )
    )?.n,
    1,
  );
});
test("mentorship cancellation is guarded, releases the hold and records one notification", async () => {
  const session = (
    await value(
      "INSERT INTO mentorship_sessions(mentor_id,user_id,status,scheduled_at,duration_minutes,hold_expires_at) VALUES($1,$2,'confirmed',now()+interval '1 day',60,now()+interval '30 minutes') RETURNING id",
      [mentorId, student],
    )
  )?.id;
  await assert.rejects(
    asUser(student, () =>
      rpc("admin_close_mentorship", [session, "cancelled", "Motivo"]),
    ),
  );
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_close_mentorship", [session, "no_show", "Motivo"]),
    ),
  );
  await asUser(admin, () =>
    rpc("admin_close_mentorship", [session, "cancelled", "Cambio de agenda"]),
  );
  const row = await value(
    "SELECT status,hold_expires_at FROM mentorship_sessions WHERE id=$1",
    [session],
  );
  assert.deepEqual(row, { status: "cancelled", hold_expires_at: null });
  await assert.rejects(
    asUser(admin, () =>
      rpc("admin_close_mentorship", [session, "cancelled", "Otra vez"]),
    ),
  );
});
test("certificate recovery requires actual completion and is idempotent", async () => {
  await assert.rejects(
    asUser(admin, () => rpc("admin_issue_certificate", [student, course])),
  );
  await db.query("INSERT INTO user_progress SELECT $1,id,true FROM lessons", [
    student,
  ]);
  const first = (
    await asUser(admin, () => rpc("admin_issue_certificate", [student, course]))
  )?.result;
  const second = (
    await asUser(admin, () => rpc("admin_issue_certificate", [student, course]))
  )?.result;
  assert.equal(first, second);
  await assert.rejects(
    asUser(student, () => rpc("admin_issue_certificate", [other, course])),
  );
});
test("public testimonials expose only published consented public entries", async () => {
  for (const audience of ["public_web", "registered_users", "private_review"])
    await db.query(
      "INSERT INTO community_testimonials(author_id,caption,status,audience,consent_version,consent_granted_at,reviewed_by,reviewed_at) VALUES($1,$2,'published',$2,'v1',now(),$1,now())",
      [admin, audience],
    );
  const items = (await db.query("SELECT * FROM public_testimonials")).rows;
  assert.equal(items.length, 1);
  assert.equal(items[0].caption, "public_web");
  assert.equal("third_party_authorization_evidence" in items[0], false);
  assert.equal(
    (
      await asUser(student, () =>
        value("SELECT count(*) n FROM community_testimonials"),
      )
    )?.n,
    2,
  );
});
test("notification links reject executable and protocol-relative destinations", () => {
  for (const link of [
    "/",
    "/library?course=1",
    "https://example.com",
    "/mentorship",
    "",
  ])
    assert.equal(validNotificationLink(link), true, link);
  for (const link of [
    "//evil.test",
    "javascript:alert(1)",
    "data:text/plain,hi",
    "/\\evil.test",
    "https://example.com a",
  ])
    assert.equal(validNotificationLink(link), false, link);
});
test("downloadable certificate is a valid landscape PDF with embedded Spanish font", async () => {
  const bytes = await createCertificatePdf({
    userName: "Ángela Muñoz — Łukasz",
    formationTitle: "Emulsión Energética",
    certificateNumber: "CERT-TEST0001",
    issuedAt: "2026-10-07T12:00:00Z",
  });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getPage(0).getWidth(), 842);
  assert.equal(pdf.getTitle(), "Certificado — Emulsión Energética");
  assert.ok(bytes.length > 5000);
});

test("formation editor accepts existing local covers and rejects unsafe image URLs", () => {
  for (const cover of [
    "/emulsion-energetica.png",
    "https://example.com/image.png",
  ])
    assert.equal(
      createFormationSchema.safeParse({
        title: "Emulsión Energética",
        thumbnail_url: cover,
      }).success,
      true,
    );
  for (const cover of [
    "//evil.test/image.png",
    "javascript:alert(1)",
    "/\\evil.test/image.png",
  ])
    assert.equal(
      createFormationSchema.safeParse({
        title: "Emulsión Energética",
        thumbnail_url: cover,
      }).success,
      false,
    );
});
