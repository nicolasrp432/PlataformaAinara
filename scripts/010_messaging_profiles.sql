-- 010_messaging_profiles.sql
-- Perfiles públicos + mensajería directa + comentarios en perfil
-- Aditivo: safe to run multiple times

-- ── Columnas nuevas en profiles ───────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'community'
    CHECK (profile_visibility IN ('private', 'community', 'public'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN NOT NULL DEFAULT true;

-- ── Conversaciones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user
  ON conversation_participants(user_id);

-- ── Comentarios en perfil (muro) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  parent_id  UUID REFERENCES profile_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile
  ON profile_comments(profile_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

-- conversations: visible si eres participante
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participants view conversation" ON conversations;
CREATE POLICY "participants view conversation"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants insert conversation" ON conversations;
CREATE POLICY "participants insert conversation"
  ON conversations FOR INSERT
  WITH CHECK (true); -- server action controla quién puede insertar

-- conversation_participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view own participations" ON conversation_participants;
CREATE POLICY "view own participations"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert participations" ON conversation_participants;
CREATE POLICY "insert participations"
  ON conversation_participants FOR INSERT
  WITH CHECK (true); -- server action

DROP POLICY IF EXISTS "update own participation" ON conversation_participants;
CREATE POLICY "update own participation"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- messages: solo participantes de la conversación
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participants view messages" ON messages;
CREATE POLICY "participants view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants send messages" ON messages;
CREATE POLICY "participants send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- profile_comments: cualquier autenticado puede leer; solo tú insertas
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view profile comments" ON profile_comments;
CREATE POLICY "view profile comments"
  ON profile_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert profile comments" ON profile_comments;
CREATE POLICY "insert profile comments"
  ON profile_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "delete own profile comments" ON profile_comments;
CREATE POLICY "delete own profile comments"
  ON profile_comments FOR DELETE
  USING (author_id = auth.uid());
