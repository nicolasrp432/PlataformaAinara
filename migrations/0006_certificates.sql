-- Certificate System
-- Apply in Supabase SQL Editor after 0005_quizzes.sql

CREATE TABLE IF NOT EXISTS certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formation_id       UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL DEFAULT
    'CERT-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

CREATE INDEX certificates_user_id_idx ON certificates(user_id);
CREATE INDEX certificates_formation_id_idx ON certificates(formation_id);

-- Row Level Security
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Users can see their own certificates
CREATE POLICY "Users see own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins manage certificates" ON certificates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role can insert (used from server actions)
CREATE POLICY "Service role inserts certificates" ON certificates
  FOR INSERT WITH CHECK (true);
