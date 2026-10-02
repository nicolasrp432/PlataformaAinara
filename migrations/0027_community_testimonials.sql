BEGIN;

CREATE TYPE public.community_testimonial_status AS ENUM
  ('draft', 'processing', 'pending_review', 'published', 'rejected', 'archived');

CREATE TABLE public.community_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id text UNIQUE,
  playback_url text,
  thumbnail_url text,
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 1000),
  duration_seconds numeric(7,2) CHECK (duration_seconds > 0 AND duration_seconds <= 90),
  status public.community_testimonial_status NOT NULL DEFAULT 'draft',
  consent_version text,
  consent_granted_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text CHECK (char_length(rejection_reason) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT testimonial_consent_complete CHECK (
    status = 'draft' OR (consent_version IS NOT NULL AND consent_granted_at IS NOT NULL)
  ),
  CONSTRAINT testimonial_review_complete CHECK (
    status NOT IN ('published', 'rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX community_testimonials_feed_idx
  ON public.community_testimonials (created_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX community_testimonials_moderation_idx
  ON public.community_testimonials (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX community_testimonials_author_idx
  ON public.community_testimonials (author_id, created_at DESC);

ALTER TABLE public.community_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonials_read ON public.community_testimonials FOR SELECT TO authenticated USING (
  public.is_platform_admin() OR author_id = auth.uid() OR
  (status = 'published' AND deleted_at IS NULL AND public.has_community_access())
);
CREATE POLICY testimonials_create_draft ON public.community_testimonials FOR INSERT TO authenticated WITH CHECK (
  author_id = auth.uid() AND status = 'draft' AND reviewed_by IS NULL AND reviewed_at IS NULL
);
CREATE POLICY testimonials_author_edit ON public.community_testimonials FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft', 'processing', 'rejected') AND deleted_at IS NULL)
  WITH CHECK (author_id = auth.uid() AND status IN ('draft', 'processing', 'pending_review')
    AND reviewed_by IS NULL AND reviewed_at IS NULL AND deleted_at IS NULL);
CREATE POLICY testimonials_admin_all ON public.community_testimonials FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY testimonials_author_delete_draft ON public.community_testimonials FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft', 'rejected'));

REVOKE ALL ON public.community_testimonials FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_testimonials TO authenticated;

CREATE TABLE public.community_testimonial_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id uuid NOT NULL REFERENCES public.community_testimonials(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (testimonial_id, reporter_id)
);
ALTER TABLE public.community_testimonial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonial_reports_create ON public.community_testimonial_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.community_testimonials t WHERE t.id = testimonial_id AND t.status = 'published' AND t.deleted_at IS NULL
  ));
CREATE POLICY testimonial_reports_admin_read ON public.community_testimonial_reports FOR SELECT TO authenticated
  USING (public.is_platform_admin());
GRANT SELECT, INSERT ON public.community_testimonial_reports TO authenticated;
REVOKE ALL ON public.community_testimonial_reports FROM anon;

COMMIT;
