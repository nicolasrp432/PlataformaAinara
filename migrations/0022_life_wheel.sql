-- Private, append-only snapshots: users can compare their own history.
BEGIN;
CREATE TABLE IF NOT EXISTS public.life_wheel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores jsonb NOT NULL,
  focus text NOT NULL CHECK (focus IN ('health','relationships','family','work','money','growth','leisure','environment')),
  intention text NOT NULL CHECK (length(trim(intention)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_wheel_scores_valid CHECK (
    jsonb_typeof(scores) = 'object'
    AND scores ?& ARRAY['health','relationships','family','work','money','growth','leisure','environment']
    AND (scores - ARRAY['health','relationships','family','work','money','growth','leisure','environment']) = '{}'::jsonb
    AND (scores->>'health') ~ '^(10|[1-9])$'
    AND (scores->>'relationships') ~ '^(10|[1-9])$'
    AND (scores->>'family') ~ '^(10|[1-9])$'
    AND (scores->>'work') ~ '^(10|[1-9])$'
    AND (scores->>'money') ~ '^(10|[1-9])$'
    AND (scores->>'growth') ~ '^(10|[1-9])$'
    AND (scores->>'leisure') ~ '^(10|[1-9])$'
    AND (scores->>'environment') ~ '^(10|[1-9])$'
    AND jsonb_typeof(scores->'health') = 'number'
    AND jsonb_typeof(scores->'relationships') = 'number'
    AND jsonb_typeof(scores->'family') = 'number'
    AND jsonb_typeof(scores->'work') = 'number'
    AND jsonb_typeof(scores->'money') = 'number'
    AND jsonb_typeof(scores->'growth') = 'number'
    AND jsonb_typeof(scores->'leisure') = 'number'
    AND jsonb_typeof(scores->'environment') = 'number'
  )
);
CREATE INDEX IF NOT EXISTS life_wheel_user_created_idx ON public.life_wheel_entries(user_id, created_at DESC);
ALTER TABLE public.life_wheel_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.life_wheel_entries FROM anon;
GRANT SELECT, INSERT, DELETE ON public.life_wheel_entries TO authenticated;
DROP POLICY IF EXISTS life_wheel_select_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_select_own ON public.life_wheel_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS life_wheel_insert_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_insert_own ON public.life_wheel_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS life_wheel_delete_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_delete_own ON public.life_wheel_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
COMMIT;
