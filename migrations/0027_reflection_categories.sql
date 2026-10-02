BEGIN;

ALTER TABLE public.reflections
  ADD COLUMN category text NOT NULL DEFAULT 'reflection';

ALTER TABLE public.reflections
  ADD CONSTRAINT reflections_category_check
  CHECK (category IN ('reflection', 'question', 'practice', 'gratitude', 'testimonial'));

COMMENT ON COLUMN public.reflections.category IS
  'Explicit community post category used for browsing and filtering.';

COMMIT;
