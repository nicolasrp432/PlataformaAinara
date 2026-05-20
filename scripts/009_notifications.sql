-- 009_notifications.sql
-- Sistema de notificaciones in-app + campañas admin
-- Aditivo: safe to run multiple times (idempotente)

-- ── Tipos ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_kind AS ENUM (
    'admin_announcement', 'comment_reply', 'mention',
    'new_message', 'mentorship_booked', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabla principal ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind        notification_kind NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own notifications"   ON notifications;
DROP POLICY IF EXISTS "users update own notifications" ON notifications;

CREATE POLICY "users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT solo vía service role (server actions admin / triggers); sin policy de INSERT a clientes.

-- ── Tabla de campañas admin (auditoría) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  audience        JSONB NOT NULL,
  channel         notification_channel NOT NULL DEFAULT 'in_app',
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  link            TEXT,
  recipient_count INT NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage campaigns" ON notification_campaigns;

CREATE POLICY "admins manage campaigns"
  ON notification_campaigns
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
