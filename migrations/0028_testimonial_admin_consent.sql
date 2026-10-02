BEGIN;

-- Extiende el flujo comunitario de 0027 sin crear una segunda tabla incompatible.
-- Estos campos conservan la prueba de consentimiento cuando un administrador
-- publica un testimonio propio o de una tercera persona.
ALTER TABLE public.community_testimonials
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS contributor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_name text,
  ADD COLUMN IF NOT EXISTS testimonial_text text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS consent_method text,
  ADD COLUMN IF NOT EXISTS third_party_authorization_evidence text,
  ADD COLUMN IF NOT EXISTS original_file_name text,
  ADD COLUMN IF NOT EXISTS original_content_type text,
  ADD COLUMN IF NOT EXISTS original_file_size bigint;

ALTER TABLE public.community_testimonials
  DROP CONSTRAINT IF EXISTS community_testimonials_admin_metadata_check;
ALTER TABLE public.community_testimonials
  ADD CONSTRAINT community_testimonials_admin_metadata_check CHECK (
    uploaded_by IS NULL OR (
      subject_name IS NOT NULL
      AND char_length(btrim(subject_name)) BETWEEN 1 AND 160
      AND audience IN ('public_web', 'registered_users', 'private_review')
      AND consent_method IN ('uploader_checkbox', 'written_third_party_authorization')
      AND (
        consent_method <> 'written_third_party_authorization'
        OR nullif(btrim(third_party_authorization_evidence), '') IS NOT NULL
      )
    )
  );

ALTER TABLE public.community_testimonials
  DROP CONSTRAINT IF EXISTS community_testimonials_admin_text_length_check;
ALTER TABLE public.community_testimonials
  ADD CONSTRAINT community_testimonials_admin_text_length_check CHECK (
    testimonial_text IS NULL OR char_length(testimonial_text) <= 4000
  );

ALTER TABLE public.community_testimonials
  DROP CONSTRAINT IF EXISTS community_testimonials_original_file_size_check;
ALTER TABLE public.community_testimonials
  ADD CONSTRAINT community_testimonials_original_file_size_check CHECK (
    original_file_size IS NULL OR original_file_size >= 0
  );

CREATE INDEX IF NOT EXISTS community_testimonials_contributor_idx
  ON public.community_testimonials (contributor_user_id)
  WHERE contributor_user_id IS NOT NULL;

COMMENT ON COLUMN public.community_testimonials.third_party_authorization_evidence IS
  'Referencia verificable a la autorización escrita de la persona retratada.';

COMMIT;
