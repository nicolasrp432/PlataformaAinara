-- ============================================================
-- 008_comments_replies_reactions.sql
-- Threading (replies) + ampliación de tipos de reacciones emoji
-- + RLS sobre reflections y reflection_reactions
-- ============================================================

-- 1) Threading: parent_id apunta a la reflexión padre (NULL = comentario raíz)
ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES reflections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reflections_parent ON reflections(parent_id);
CREATE INDEX IF NOT EXISTS idx_reflections_lesson_parent ON reflections(lesson_id, parent_id);

-- 2) Ampliar tipos de reacción emoji
--    Tipos: 'heart', 'pray', 'lightbulb', 'fire' (nuevos)
--    Compatibilidad: 'resonate', 'support' (legacy) se conservan
ALTER TABLE reflection_reactions
  DROP CONSTRAINT IF EXISTS reflection_reactions_reaction_type_check;

ALTER TABLE reflection_reactions
  ADD CONSTRAINT reflection_reactions_reaction_type_check
  CHECK (reaction_type IN ('heart', 'pray', 'lightbulb', 'fire', 'resonate', 'support'));

-- Garantizar que (reflection, user, type) sea único
CREATE UNIQUE INDEX IF NOT EXISTS uq_reflection_reactions_unique
  ON reflection_reactions(reflection_id, user_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_reflection_reactions_reflection
  ON reflection_reactions(reflection_id);

-- 3) RLS sobre reflections
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reflections_select_public_or_own" ON reflections;
CREATE POLICY "reflections_select_public_or_own" ON reflections
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "reflections_insert_own" ON reflections;
CREATE POLICY "reflections_insert_own" ON reflections
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reflections_update_own" ON reflections;
CREATE POLICY "reflections_update_own" ON reflections
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "reflections_delete_own" ON reflections;
CREATE POLICY "reflections_delete_own" ON reflections
  FOR DELETE USING (user_id = auth.uid());

-- 4) RLS sobre reflection_reactions
ALTER TABLE reflection_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON reflection_reactions;
CREATE POLICY "reactions_select_all" ON reflection_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON reflection_reactions;
CREATE POLICY "reactions_insert_own" ON reflection_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_delete_own" ON reflection_reactions;
CREATE POLICY "reactions_delete_own" ON reflection_reactions
  FOR DELETE USING (user_id = auth.uid());
