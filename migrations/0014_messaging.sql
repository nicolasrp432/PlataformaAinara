-- 0014_messaging.sql
-- Mensajería directa entre usuarios: tablas, RLS corregida y Realtime.
-- Idempotente: seguro de ejecutar varias veces en el SQL Editor de Supabase.
-- Consolida scripts/010_messaging_profiles.sql y corrige dos problemas:
--   1. is_conversation_participant tenía un parámetro llamado igual que la
--      columna (user_id = user_id → siempre true): cualquier usuario podía
--      ver los participantes de cualquier conversación.
--   2. La tabla messages no estaba en la publicación supabase_realtime,
--      así que los mensajes no llegaban en vivo al hilo abierto.

-- ── Columnas de profiles ──────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'community'
    CHECK (profile_visibility IN ('private', 'community', 'public'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN NOT NULL DEFAULT true;

-- ── Tablas ────────────────────────────────────────────────────────────────────
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

-- ── Función auxiliar (parámetros renombrados para evitar la ambigüedad) ──────
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conv_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = p_conv_id AND cp.user_id = p_user_id
  );
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants view conversation" ON conversations;
CREATE POLICY "participants view conversation"
  ON conversations FOR SELECT
  USING (public.is_conversation_participant(conversations.id, auth.uid()));

DROP POLICY IF EXISTS "participants insert conversation" ON conversations;
CREATE POLICY "participants insert conversation"
  ON conversations FOR INSERT
  WITH CHECK (true); -- la creación real pasa por server action con service role

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view own participations" ON conversation_participants;
CREATE POLICY "view own participations"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "insert participations" ON conversation_participants;
CREATE POLICY "insert participations"
  ON conversation_participants FOR INSERT
  WITH CHECK (true); -- server action

DROP POLICY IF EXISTS "update own participation" ON conversation_participants;
CREATE POLICY "update own participation"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

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

-- ── Enum de notificaciones (por si 009 no se ejecutó completo) ───────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_kind') THEN
    ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'new_message';
  END IF;
END $$;

-- ── Realtime: publicar INSERTs de messages ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
