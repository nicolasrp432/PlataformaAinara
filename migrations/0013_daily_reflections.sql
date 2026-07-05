-- Diario de reflexión privado: una entrada por usuario y día.
-- Tabla independiente de `reflections` (esa alimenta la Comunidad/Taberna,
-- los comentarios de lecciones, la moderación de admin y el contador de
-- logros — las entradas privadas no deben mezclarse ahí).

CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL CHECK (mood IN ('radiante', 'en_calma', 'neutral', 'nublado', 'tormenta')),
  content TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date
  ON public.daily_reflections (user_id, entry_date DESC);

ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- Estrictamente privado: solo el dueño lee y escribe.
DROP POLICY IF EXISTS "daily_reflections_select_own" ON public.daily_reflections;
CREATE POLICY "daily_reflections_select_own" ON public.daily_reflections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reflections_insert_own" ON public.daily_reflections;
CREATE POLICY "daily_reflections_insert_own" ON public.daily_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reflections_update_own" ON public.daily_reflections;
CREATE POLICY "daily_reflections_update_own" ON public.daily_reflections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_reflections_delete_own" ON public.daily_reflections;
CREATE POLICY "daily_reflections_delete_own" ON public.daily_reflections
  FOR DELETE USING (auth.uid() = user_id);
