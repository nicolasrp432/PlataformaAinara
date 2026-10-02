import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const A = "10000000-0000-4000-8000-000000000001";
const B = "10000000-0000-4000-8000-000000000002";
const C = "10000000-0000-4000-8000-000000000003";
const admin = "10000000-0000-4000-8000-000000000004";
const course = "20000000-0000-4000-8000-000000000001";
const moduleId = "30000000-0000-4000-8000-000000000001";
const first = "40000000-0000-4000-8000-000000000001";
const paid = "40000000-0000-4000-8000-000000000002";
const mentor = "50000000-0000-4000-8000-000000000001";
await db.exec(`
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE SCHEMA realtime;
CREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('realtime.topic',true) $$;
CREATE TABLE realtime.messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),body text);
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY realtime_legacy_open ON realtime.messages FOR ALL USING(true) WITH CHECK(true);
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT ALL ON realtime.messages TO authenticated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
CREATE TABLE profiles(id uuid PRIMARY KEY,email text,full_name text,avatar_url text,bio text,role text DEFAULT 'student',level integer DEFAULT 1,xp integer DEFAULT 0,streak_days integer DEFAULT 0,last_activity_date timestamptz,access_status text DEFAULT 'pending',has_lifetime_access boolean DEFAULT false,profile_visibility text DEFAULT 'community',allow_direct_messages boolean DEFAULT true,birth_date date,stripe_customer_id text);
CREATE TABLE conversations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_at timestamptz DEFAULT now(),last_message_at timestamptz DEFAULT now());
CREATE TABLE conversation_participants(conversation_id uuid REFERENCES conversations ON DELETE CASCADE,user_id uuid REFERENCES profiles,last_read_at timestamptz,PRIMARY KEY(conversation_id,user_id));
CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid REFERENCES conversations,sender_id uuid REFERENCES profiles,body text,created_at timestamptz DEFAULT now());
CREATE FUNCTION public.is_conversation_participant(conv_id uuid,user_id uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
CREATE FUNCTION public.increment_reflection_likes(reflection_id uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,body text,read_at timestamptz);
CREATE TABLE ai_conversations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,lesson_id uuid,formation_id uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE ai_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid REFERENCES ai_conversations,role text,content text,created_at timestamptz DEFAULT now());
CREATE TABLE profile_comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),profile_id uuid REFERENCES profiles,author_id uuid REFERENCES profiles,content text);
CREATE TABLE natal_charts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,chart_data jsonb);
CREATE TABLE formations(id uuid PRIMARY KEY,is_published boolean,slug text,title text);
CREATE TABLE modules(id uuid PRIMARY KEY,formation_id uuid REFERENCES formations,is_published boolean,sort_order integer);
CREATE TABLE lessons(id uuid PRIMARY KEY,module_id uuid REFERENCES modules,title text,slug text,duration_seconds integer,is_free boolean DEFAULT false,is_published boolean DEFAULT true,sort_order integer,xp_reward integer DEFAULT 50,content_type text DEFAULT 'video',video_url text,transcript text);
CREATE TABLE enrollments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,formation_id uuid REFERENCES formations,status text,enrolled_at timestamptz,completed_at timestamptz,progress_percent integer,UNIQUE(user_id,formation_id));
CREATE TABLE user_progress(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,lesson_id uuid REFERENCES lessons,watched_seconds integer DEFAULT 0,last_position_seconds integer DEFAULT 0,progress_percent integer DEFAULT 0,is_completed boolean DEFAULT false,status text,completed_at timestamptz,UNIQUE(user_id,lesson_id));
CREATE TABLE quizzes(id uuid PRIMARY KEY,lesson_id uuid REFERENCES lessons,xp_reward integer DEFAULT 100);
CREATE TABLE quiz_questions(id uuid PRIMARY KEY,quiz_id uuid REFERENCES quizzes,question text,type text,sort_order integer,explanation text);
CREATE TABLE quiz_options(id uuid PRIMARY KEY,question_id uuid REFERENCES quiz_questions,option_text text,sort_order integer,is_correct boolean);
CREATE TABLE quiz_attempts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,quiz_id uuid REFERENCES quizzes,passed boolean);
CREATE TABLE certificates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,formation_id uuid REFERENCES formations,UNIQUE(user_id,formation_id));
CREATE TABLE reflections(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES profiles,lesson_id uuid REFERENCES lessons,parent_id uuid REFERENCES reflections,content text,is_public boolean,likes_count integer DEFAULT 0,created_at timestamptz DEFAULT now());
CREATE TABLE reflection_reactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reflection_id uuid REFERENCES reflections,user_id uuid REFERENCES profiles,reaction_type text);
CREATE TABLE mentors(id uuid PRIMARY KEY,user_id uuid REFERENCES profiles,is_active boolean,name text,session_duration_minutes integer,session_price numeric);
CREATE TABLE mentor_availability(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid REFERENCES mentors,day_of_week integer,start_time time,end_time time,is_active boolean);
CREATE TABLE mentor_blocked_dates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid REFERENCES mentors,blocked_date date);
CREATE TABLE mentorship_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),mentor_id uuid REFERENCES mentors,user_id uuid REFERENCES profiles,scheduled_at timestamptz,duration_minutes integer,status text,user_notes text,meeting_link text,notes text,payment_reference text,created_at timestamptz DEFAULT now());
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_own ON mentorship_sessions FOR SELECT USING(user_id = auth.uid());
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated,service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- Legacy permissive policies must be removed, not OR'ed with the new policies.
ALTER TABLE messages ENABLE ROW LEVEL SECURITY; CREATE POLICY legacy_message_public ON messages FOR ALL USING(true) WITH CHECK(true);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; CREATE POLICY legacy_profiles_public ON profiles FOR ALL USING(true) WITH CHECK(true);
INSERT INTO profiles(id,email,full_name,birth_date,access_status,has_lifetime_access,role) VALUES
('${A}','a@example.test','Ana','1990-01-01','pending',false,'student'),
('${B}','b@example.test','Bea','1991-02-02','approved',false,'student'),
('${C}','c@example.test','Cris','1992-03-03','pending',true,'student'),
('${admin}','admin@example.test','Admin','1993-04-04','approved',false,'admin');
INSERT INTO formations VALUES('${course}',true,'test-course','Formación');
INSERT INTO modules VALUES('${moduleId}','${course}',true,1);
INSERT INTO lessons(id,module_id,title,slug,duration_seconds,sort_order,video_url) VALUES
('${first}','${moduleId}','Primera','primera',600,1,'https://example.test/free-video'),
('${paid}','${moduleId}','Segunda','segunda',600,2,'https://example.test/paid-video');
INSERT INTO mentors VALUES('${mentor}','${admin}',true,'Ainara',60,150);
INSERT INTO mentor_availability(mentor_id,day_of_week,start_time,end_time,is_active) SELECT '${mentor}',day,'09:00','18:00',true FROM generate_series(0,6) day;
`);
for (const file of [
  "0023_multiuser_isolation.sql",
  "0024_mentorship_bookings.sql",
  "0025_learning_integrity.sql",
  "0026_community_integrity.sql",
  "0027_community_testimonials.sql",
]) {
  await db.exec(
    await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
  );
}
async function asUser<T>(id: string, action: () => Promise<T>) {
  await db.exec(
    `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',false)`,
  );
  try {
    return await action();
  } finally {
    await db.exec(
      "RESET ROLE; SELECT set_config('request.jwt.claim.sub','',false)",
    );
  }
}
async function scalar(sql: string) {
  return (await db.query<Record<string, any>>(sql)).rows[0];
}
after(async () => {
  await db.close();
});

let room: string;

test("direct conversations cannot be joined, read or forged by a third account", async () => {
  room = await asUser(
    A,
    async () =>
      (await scalar(`SELECT start_direct_conversation('${B}') AS id`))!.id,
  );
  const duplicate = await asUser(
    B,
    async () =>
      (await scalar(`SELECT start_direct_conversation('${A}') AS id`))!.id,
  );
  assert.equal(duplicate, room);
  await asUser(A, async () => {
    await db.exec(
      `INSERT INTO messages(conversation_id,sender_id,body) VALUES('${room}','${A}','Mensaje privado')`,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM messages"))!.n,
      1,
    );
  });
  await asUser(C, async () => {
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM messages"))!.n,
      0,
    );
    assert.equal(
      (await scalar(
        "SELECT count(*)::int AS n FROM conversation_participants",
      ))!.n,
      0,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO messages(conversation_id,sender_id,body) VALUES('${room}','${C}','Intrusión')`,
      ),
    );
    await assert.rejects(
      db.exec(`SELECT is_conversation_participant('${room}','${A}')`),
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO conversation_participants VALUES('${room}','${C}',now())`,
      ),
    );
    assert.equal(
      (await scalar(
        "SELECT count(*)::int AS n FROM direct_conversation_summaries()",
      ))!.n,
      0,
    );
  });
  await asUser(B, async () =>
    assert.equal(
      (await scalar(
        "SELECT unread_count::int AS n FROM direct_conversation_summaries()",
      ))!.n,
      1,
    ),
  );
});

test("account authority and private profile fields are isolated from the member directory", async () => {
  await asUser(A, async () => {
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM profiles"))!.n,
      1,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM member_profiles"))!.n,
      4,
    );
    await assert.rejects(
      db.exec("SELECT email,birth_date FROM member_profiles"),
    );
    await assert.rejects(
      db.exec(`UPDATE profiles SET role = 'admin' WHERE id = '${A}'`),
    );
    await assert.rejects(
      db.exec(
        `UPDATE profiles SET has_lifetime_access = true WHERE id = '${A}'`,
      ),
    );
    await assert.rejects(
      db.exec(`UPDATE profiles SET xp = 99999 WHERE id = '${A}'`),
    );
    await db.exec(
      `UPDATE profiles SET bio = 'Mi presentación' WHERE id = '${A}'`,
    );
  });
  await asUser(admin, async () =>
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM profiles"))!.n,
      4,
    ),
  );
});

test("AI, notifications and natal charts remain private even when their ids are known", async () => {
  const conv = (await scalar(
    `INSERT INTO ai_conversations(user_id) VALUES('${A}') RETURNING id`,
  ))!.id;
  await db.exec(
    `INSERT INTO ai_messages(conversation_id,role,content) VALUES('${conv}','user','Pregunta privada'); INSERT INTO notifications(user_id,body) VALUES('${A}','Aviso privado'); INSERT INTO natal_charts(user_id,chart_data) VALUES('${A}','{}')`,
  );
  await asUser(C, async () => {
    for (const table of [
      "ai_conversations",
      "ai_messages",
      "notifications",
      "natal_charts",
    ])
      assert.equal(
        (await scalar(`SELECT count(*)::int AS n FROM ${table}`))!.n,
        0,
      );
    await assert.rejects(
      db.exec(
        `INSERT INTO ai_messages(conversation_id,role,content) VALUES('${conv}','user','Intrusión')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO notifications(user_id,body) VALUES('${A}','Falsificación')`,
      ),
    );
  });
});

test("free lesson access, sticky completion and XP awards are enforced atomically", async () => {
  await asUser(A, async () => {
    assert.equal(
      (await scalar(`SELECT can_access_lesson('${first}') AS allowed`))!
        .allowed,
      true,
    );
    assert.equal(
      (await scalar(`SELECT can_access_lesson('${paid}') AS allowed`))!.allowed,
      false,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM lesson_catalog"))!.n,
      2,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM lessons"))!.n,
      1,
    );
    await assert.rejects(db.exec(`SELECT complete_lesson('${paid}')`));
    await assert.rejects(
      db.exec(
        `INSERT INTO certificates(user_id,formation_id) VALUES('${A}','${course}')`,
      ),
    );
    await assert.rejects(
      db.exec(`SELECT award_activity_xp('${A}',1000,'fake','award')`),
    );
    const completed = (await scalar(
      `SELECT complete_lesson('${first}') AS result`,
    ))!.result;
    assert.equal(completed.xpEarned, 50);
    assert.equal(
      (await scalar(`SELECT complete_lesson('${first}') AS result`))!.result
        .xpEarned,
      0,
    );
    const saved = (await scalar(
      `SELECT save_lesson_progress('${first}',15) AS result`,
    ))!.result;
    assert.equal(saved.is_completed, true);
    assert.equal(saved.progress_percent, 100);
    assert.equal(saved.watched_seconds, 600);
    assert.equal(saved.last_position_seconds, 15);
    assert.equal(
      (await scalar(`SELECT xp FROM profiles WHERE id = '${A}'`))!.xp,
      50,
    );
    assert.equal(
      (await scalar(
        `SELECT progress_percent FROM enrollments WHERE user_id = '${A}'`,
      ))!.progress_percent,
      50,
    );
  });
});

test("calendar reservations respect other users and included membership without a second charge", async () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 2);
  date.setUTCHours(9, 0, 0, 0);
  // 09:00 UTC is within Madrid business hours in both summer and winter.
  const iso = date.toISOString();
  await db.exec(`UPDATE profiles SET access_status = NULL WHERE id = '${A}'`);
  await asUser(
    A,
    async () =>
      await assert.rejects(
        db.exec(
          `SELECT * FROM book_mentorship_session('${mentor}','${iso}',NULL)`,
        ),
      ),
  );
  await db.exec(
    `UPDATE profiles SET access_status = 'pending' WHERE id = '${A}'`,
  );
  const included = await asUser(
    B,
    async () =>
      (await scalar(
        `SELECT * FROM book_mentorship_session('${mentor}','${iso}','Objetivo personal')`,
      ))!,
  );
  assert.equal(included.status, "confirmed");
  assert.equal(Number(included.price), 0);
  await asUser(C, async () => {
    const busy = await db.query(
      `SELECT * FROM mentor_busy_intervals('${mentor}','${new Date(date.getTime() - 60000).toISOString()}','${new Date(date.getTime() + 3600000).toISOString()}')`,
    );
    assert.equal(busy.rows.length, 1);
    assert.deepEqual(Object.keys(busy.rows[0]!).sort(), [
      "duration_minutes",
      "scheduled_at",
    ]);
    await assert.rejects(
      db.exec(
        `SELECT * FROM book_mentorship_session('${mentor}','${iso}',NULL)`,
      ),
    );
  });
  const nextIso = new Date(date.getTime() + 3600000).toISOString();
  const paidBooking = await asUser(
    C,
    async () =>
      (await scalar(
        `SELECT * FROM book_mentorship_session('${mentor}','${nextIso}',NULL)`,
      ))!,
  );
  assert.equal(paidBooking.status, "pending");
  assert.equal(Number(paidBooking.price), 150);
  await db.exec(
    `UPDATE mentorship_sessions SET hold_expires_at = now()-interval '1 minute' WHERE id = '${paidBooking.id}'`,
  );
  await asUser(B, async () =>
    assert.equal(
      (await scalar(
        `SELECT * FROM book_mentorship_session('${mentor}','${nextIso}',NULL)`,
      ))!.status,
      "confirmed",
    ),
  );
  assert.equal(
    (await scalar(
      `SELECT confirm_mentorship_payment('${paidBooking.id}','cs_test_delayed') AS confirmed`,
    ))!.confirmed,
    false,
  );
});

test("private Realtime topics remain protected despite a legacy open policy", async () => {
  await db.exec(
    `SELECT set_config('realtime.topic','chat:${room}',false); INSERT INTO realtime.messages(body) VALUES('typing')`,
  );
  await asUser(B, async () =>
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM realtime.messages"))!.n,
      1,
    ),
  );
  await asUser(C, async () => {
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM realtime.messages"))!.n,
      0,
    );
    await assert.rejects(
      db.exec("INSERT INTO realtime.messages(body) VALUES('intrusion')"),
    );
    assert.equal(
      (await scalar(
        `SELECT can_access_chat_topic('chat:malformed') AS allowed`,
      ))!.allowed,
      false,
    );
  });
});

test("quiz answers and explanations are hidden and a passed attempt cannot be forged", async () => {
  const quiz = "60000000-0000-4000-8000-000000000001";
  const question = "60000000-0000-4000-8000-000000000002";
  const choice = "60000000-0000-4000-8000-000000000003";
  await db.exec(
    `UPDATE lessons SET content_type = 'quiz' WHERE id = '${paid}'; INSERT INTO quizzes VALUES('${quiz}','${paid}',100); INSERT INTO quiz_questions VALUES('${question}','${quiz}','Pregunta','multiple_choice',1,'Explicación secreta'); INSERT INTO quiz_options VALUES('${choice}','${question}','Opción',1,true)`,
  );
  await asUser(B, async () => {
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM quiz_options"))!.n,
      0,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM quiz_questions"))!.n,
      0,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM quiz_choices"))!.n,
      1,
    );
    await assert.rejects(db.exec("SELECT is_correct FROM quiz_choices"));
    await assert.rejects(db.exec("SELECT explanation FROM quiz_prompts"));
    await assert.rejects(
      db.exec(
        `INSERT INTO quiz_attempts(user_id,quiz_id,passed) VALUES('${B}','${quiz}',true)`,
      ),
    );
    await assert.rejects(db.exec(`SELECT complete_lesson('${paid}')`));
  });
  await asUser(A, async () =>
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM quiz_choices"))!.n,
      0,
    ),
  );
  await db.exec(
    `INSERT INTO quiz_attempts(user_id,quiz_id,passed) VALUES('${B}','${quiz}',true)`,
  );
  await asUser(B, async () => {
    assert.equal(
      (await scalar(`SELECT complete_lesson('${paid}') AS result`))!.result
        .xpEarned,
      100,
    );
    assert.equal(
      (await scalar(`SELECT complete_lesson('${paid}') AS result`))!.result
        .xpEarned,
      0,
    );
    const completed = (await scalar(
      `SELECT complete_lesson('${first}') AS result`,
    ))!.result;
    assert.equal(completed.certificateIssued, true);
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM certificates"))!.n,
      1,
    );
  });
});

test("community replies require matching context and private posts cannot be read or reacted to", async () => {
  const post = await asUser(
    B,
    async () =>
      (await scalar(
        `INSERT INTO reflections(user_id,content,is_public) VALUES('${B}','Publicación compartida',true) RETURNING id`,
      ))!.id,
  );
  const secret = await asUser(
    B,
    async () =>
      (await scalar(
        `INSERT INTO reflections(user_id,content,is_public) VALUES('${B}','Reflexión privada',false) RETURNING id`,
      ))!.id,
  );
  await asUser(C, async () => {
    assert.equal(
      (await scalar(
        `SELECT count(*)::int AS n FROM reflections WHERE id = '${secret}'`,
      ))!.n,
      0,
    );
    await assert.rejects(db.exec(`SELECT resonate_reflection('${secret}')`));
    assert.equal(
      (await scalar(`SELECT resonate_reflection('${post}') AS n`))!.n,
      1,
    );
    assert.equal(
      (await scalar(`SELECT resonate_reflection('${post}') AS n`))!.n,
      1,
    );
    await db.exec(
      `INSERT INTO reflections(user_id,parent_id,content,is_public) VALUES('${C}','${post}','Respuesta de la comunidad',true)`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO reflections(user_id,parent_id,lesson_id,content,is_public) VALUES('${C}','${post}','${first}','Contexto equivocado',true)`,
      ),
    );
    await assert.rejects(
      db.exec(`UPDATE reflections SET likes_count = 999 WHERE id = '${post}'`),
    );
  });
  await asUser(A, async () => {
    await assert.rejects(
      db.exec(
        `INSERT INTO reflections(user_id,content,is_public) VALUES('${A}','Comunidad de pago',true)`,
      ),
    );
    await db.exec(
      `INSERT INTO reflections(user_id,lesson_id,content,is_public) VALUES('${A}','${first}','Comentario en clase gratuita',true)`,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO reflections(user_id,lesson_id,content,is_public) VALUES('${A}','${paid}','Comentario no permitido',true)`,
      ),
    );
  });
});

test("mentorship management is assigned, staff notes are private and requests persist per owner", async () => {
  const session = (await scalar(
    `SELECT id FROM mentorship_sessions WHERE user_id = '${B}' LIMIT 1`,
  ))!.id;
  const request = await asUser(
    B,
    async () =>
      (await scalar(
        `INSERT INTO mentorship_requests(user_id,mentor_id,notes) VALUES('${B}','${mentor}','Trabajar una decisión importante') RETURNING id`,
      ))!.id,
  );
  const assigned = "10000000-0000-4000-8000-000000000005";
  const unassigned = "10000000-0000-4000-8000-000000000006";
  await db.exec(
    `INSERT INTO profiles(id,full_name,role) VALUES('${assigned}','Mentora asignada','mentor'),('${unassigned}','Otra mentora','mentor'); UPDATE mentors SET user_id = '${assigned}' WHERE id = '${mentor}'`,
  );
  await asUser(assigned, async () => {
    assert.ok(
      (await scalar(`SELECT mentorship_workspace() AS data`))!.data.sessions
        .length > 0,
    );
    await db.exec(
      `SELECT update_mentorship_session('${session}','https://example.test/assigned','Notas del encuentro',false)`,
    );
  });
  await asUser(unassigned, async () => {
    assert.equal(
      (await scalar(`SELECT mentorship_workspace() AS data`))!.data.sessions
        .length,
      0,
    );
    await assert.rejects(
      db.exec(
        `SELECT update_mentorship_session('${session}','https://example.test/other','',false)`,
      ),
    );
  });
  await asUser(C, async () => {
    await assert.rejects(
      db.exec(
        `SELECT update_mentorship_session('${session}','https://example.test/meeting','Notas',false)`,
      ),
    );
    await assert.rejects(
      db.exec(`SELECT update_mentorship_request('${request}','contacted')`),
    );
    assert.equal(
      (await scalar(`SELECT mentorship_workspace() AS data`))!.data.sessions
        .length,
      0,
    );
    assert.equal(
      (await scalar("SELECT count(*)::int AS n FROM mentorship_requests"))!.n,
      0,
    );
  });
  await asUser(admin, async () => {
    await db.exec(
      `SELECT update_mentorship_session('${session}','https://example.test/meeting','Notas privadas',false); SELECT update_mentorship_request('${request}','contacted')`,
    );
    assert.ok(
      (await scalar(`SELECT mentorship_workspace() AS data`))!.data.sessions
        .length > 0,
    );
    await assert.rejects(
      db.exec(
        `SELECT update_mentorship_session('${session}','javascript:alert(1)','',false)`,
      ),
    );
    await assert.rejects(
      db.exec(
        `SELECT update_mentorship_session('${session}','https://example.test/meeting','',true)`,
      ),
    );
  });
  await asUser(B, async () => {
    assert.equal(
      (await scalar(
        `SELECT status FROM mentorship_requests WHERE id = '${request}'`,
      ))!.status,
      "contacted",
    );
    assert.equal(
      (await scalar(
        `SELECT meeting_link FROM mentorship_sessions WHERE id = '${session}'`,
      ))!.meeting_link,
      "https://example.test/meeting",
    );
    await assert.rejects(db.exec("SELECT notes FROM mentorship_sessions"));
  });
});

test("authority migrations can be reapplied without reopening legacy permissions", async () => {
  for (const file of [
    "0023_multiuser_isolation.sql",
    "0024_mentorship_bookings.sql",
    "0025_learning_integrity.sql",
    "0026_community_integrity.sql",
  ])
    await db.exec(
      await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
    );
  await asUser(C, async () =>
    assert.equal(
      (await scalar(
        `SELECT count(*)::int AS n FROM messages WHERE conversation_id = '${room}'`,
      ))!.n,
      0,
    ),
  );
});

test("testimonial drafts, moderation and published visibility are isolated by RLS", async () => {
  let testimonial = "";
  await asUser(B, async () => {
    testimonial = (await scalar(`INSERT INTO community_testimonials(author_id,caption,consent_version,consent_granted_at)
      VALUES('${B}','Mi proceso','2026-10-02',now()) RETURNING id`))!.id;
    assert.equal((await scalar("SELECT count(*)::int AS n FROM community_testimonials"))!.n, 1);
    await assert.rejects(db.exec(`UPDATE community_testimonials SET status='published' WHERE id='${testimonial}'`));
  });
  await asUser(C, async () => {
    assert.equal((await scalar("SELECT count(*)::int AS n FROM community_testimonials"))!.n, 0);
    await db.exec(`UPDATE community_testimonials SET caption='intrusión' WHERE id='${testimonial}'`);
  });
  await asUser(B, async () => assert.equal((await scalar(`SELECT caption FROM community_testimonials WHERE id='${testimonial}'`))!.caption, "Mi proceso"));
  await asUser(admin, async () => {
    await db.exec(`UPDATE community_testimonials SET status='published',reviewed_by='${admin}',reviewed_at=now(),
      playback_url='https://example.test/video.m3u8' WHERE id='${testimonial}'`);
  });
  await asUser(C, async () => {
    assert.equal((await scalar("SELECT count(*)::int AS n FROM community_testimonials WHERE status='published'"))!.n, 1);
  });
  await asUser(admin, async () => {
    await db.exec(`UPDATE community_testimonials SET status='archived' WHERE id='${testimonial}'`);
  });
  await asUser(C, async () => {
    assert.equal((await scalar("SELECT count(*)::int AS n FROM community_testimonials"))!.n, 0);
  });
});
