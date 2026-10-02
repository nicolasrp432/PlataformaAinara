BEGIN;

ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'reflection';

ALTER TABLE public.reflections
  DROP CONSTRAINT IF EXISTS reflections_category_check;

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_category_check
  CHECK (category IN ('reflection', 'question', 'practice', 'gratitude', 'testimonial'));

COMMENT ON COLUMN public.reflections.category IS
  'Explicit community post category used for browsing and filtering.';

COMMIT;
