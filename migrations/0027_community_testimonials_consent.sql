BEGIN;

CREATE TABLE IF NOT EXISTS public.community_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subject_name TEXT NOT NULL CHECK (char_length(btrim(subject_name)) BETWEEN 1 AND 160),
  testimonial_text TEXT CHECK (testimonial_text IS NULL OR char_length(testimonial_text) <= 4000),
  video_id TEXT NOT NULL UNIQUE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  original_file_name TEXT,
  original_content_type TEXT,
  original_file_size BIGINT CHECK (original_file_size IS NULL OR original_file_size >= 0),
  audience TEXT NOT NULL DEFAULT 'public_web'
    CHECK (audience IN ('public_web', 'registered_users', 'private_review')),
  consent_accepted_at TIMESTAMPTZ NOT NULL,
  consent_legal_version TEXT NOT NULL,
  consent_method TEXT NOT NULL DEFAULT 'uploader_checkbox'
    CHECK (consent_method IN ('uploader_checkbox', 'written_third_party_authorization')),
  third_party_authorization_evidence TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'withdrawal_requested', 'removed')),
  moderation_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  withdrawal_requested_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT third_party_evidence_required CHECK (
    consent_method <> 'written_third_party_authorization'
    OR nullif(btrim(third_party_authorization_evidence), '') IS NOT NULL
  )
);

COMMENT ON TABLE public.community_testimonials IS
  'Testimonios audiovisuales: prueba separada del consentimiento, versión legal, moderación y retirada.';
COMMENT ON COLUMN public.community_testimonials.third_party_authorization_evidence IS
  'Referencia verificable al documento o comunicación que acredita alcance, audiencia y autorización de la persona retratada.';

CREATE INDEX IF NOT EXISTS idx_community_testimonials_status
  ON public.community_testimonials(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_testimonials_contributor
  ON public.community_testimonials(contributor_user_id);

ALTER TABLE public.community_testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_testimonials_admin_all ON public.community_testimonials;
CREATE POLICY community_testimonials_admin_all ON public.community_testimonials
  FOR ALL TO authenticated USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
REVOKE ALL ON public.community_testimonials FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_testimonials TO authenticated;

COMMIT;
