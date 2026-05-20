-- ============================================================
-- 008b_seed_mentor.sql
-- Seed del único mentor activo + horarios L-V 16:00-20:00.
-- Idempotente: WHERE NOT EXISTS evita duplicados.
-- ============================================================

-- Insertar mentor sólo si no existe ninguno activo.
-- (Las columnas id usan UUID en Supabase; gen_random_uuid() devuelve UUID directamente.)
INSERT INTO mentors (id, name, title, bio, specialties, session_price, session_duration_minutes, is_active)
SELECT
  gen_random_uuid(),
  'Ainara',
  'Fundadora & Mentora Principal',
  'Guía estratégica para líderes disruptivos. Te ayudo a desbloquear tu máximo potencial, conectar con tu propósito y escalar tu visión con claridad y enfoque láser.',
  '["Liderazgo","Mentalidad","Escalabilidad","Propósito"]'::jsonb,
  150,
  60,
  true
WHERE NOT EXISTS (SELECT 1 FROM mentors WHERE is_active = true);

-- Disponibilidad: L-V (1..5) 16:00-20:00 para el primer mentor activo.
INSERT INTO mentor_availability (id, mentor_id, day_of_week, start_time, end_time, is_active)
SELECT
  gen_random_uuid(),
  (SELECT id FROM mentors WHERE is_active = true LIMIT 1),
  dow,
  '16:00'::time,
  '20:00'::time,
  true
FROM generate_series(1, 5) AS dow
WHERE NOT EXISTS (
  SELECT 1 FROM mentor_availability
  WHERE mentor_id = (SELECT id FROM mentors WHERE is_active = true LIMIT 1)
    AND day_of_week = dow
);

-- RLS para mentorship_sessions: usuario sólo ve sus propias sesiones
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentorship_sessions_select_own" ON mentorship_sessions;
CREATE POLICY "mentorship_sessions_select_own" ON mentorship_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mentorship_sessions_insert_own" ON mentorship_sessions;
CREATE POLICY "mentorship_sessions_insert_own" ON mentorship_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mentorship_sessions_update_own" ON mentorship_sessions;
CREATE POLICY "mentorship_sessions_update_own" ON mentorship_sessions
  FOR UPDATE USING (user_id = auth.uid());
