-- Quiz System: quizzes, questions, options, attempts
-- Apply in Supabase SQL Editor

-- ── Quizzes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  passing_score   INTEGER NOT NULL DEFAULT 70,  -- minimum % to pass
  xp_reward       INTEGER NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX quizzes_lesson_id_idx ON quizzes(lesson_id);

-- ── Questions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false')) DEFAULT 'multiple_choice',
  explanation TEXT,                        -- shown after answering
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_questions_quiz_id_idx ON quiz_questions(quiz_id);

-- ── Options ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX quiz_options_question_id_idx ON quiz_options(question_id);

-- ── Attempts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,           -- percentage 0–100
  passed       BOOLEAN NOT NULL,
  answers      JSONB,                      -- { question_id: option_id }
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_attempts_user_quiz_idx ON quiz_attempts(user_id, quiz_id);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE quizzes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts   ENABLE ROW LEVEL SECURITY;

-- Public read for quiz content (same visibility as lessons)
CREATE POLICY "Anyone can read quizzes"        ON quizzes        FOR SELECT USING (true);
CREATE POLICY "Anyone can read quiz_questions" ON quiz_questions  FOR SELECT USING (true);
CREATE POLICY "Anyone can read quiz_options"   ON quiz_options    FOR SELECT USING (true);

-- Users manage own attempts only
CREATE POLICY "Users manage own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins manage quiz_questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins manage quiz_options" ON quiz_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
