-- ============================================================
-- 011_ai_assistant.sql
-- Asistente IA: conversaciones y mensajes con RLS
-- Aplica en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS ai_conversations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id     UUID        REFERENCES lessons(id) ON DELETE SET NULL,
  formation_id  UUID        REFERENCES formations(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS ai_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  tokens_used     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages      ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- ai_conversations: cada usuario gestiona solo las suyas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_conversations'
      AND policyname = 'Users manage own AI conversations'
  ) THEN
    CREATE POLICY "Users manage own AI conversations"
      ON ai_conversations FOR ALL
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- ai_messages: acceso solo si eres dueño de la conversación
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_messages'
      AND policyname = 'Users access own AI messages'
  ) THEN
    CREATE POLICY "Users access own AI messages"
      ON ai_messages FOR ALL
      USING (
        conversation_id IN (
          SELECT id FROM ai_conversations WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON ai_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv
  ON ai_messages(conversation_id, created_at ASC);
