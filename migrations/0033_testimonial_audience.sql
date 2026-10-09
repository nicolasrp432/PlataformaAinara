BEGIN;
-- Do not expose admin-only consent evidence with public video metadata.
DROP POLICY IF EXISTS testimonials_read ON public.community_testimonials;
CREATE POLICY testimonials_read ON public.community_testimonials FOR SELECT TO authenticated USING (
 public.is_platform_admin() OR author_id=auth.uid() OR
 (status='published' AND deleted_at IS NULL AND COALESCE(audience,'registered_users') IN ('registered_users','public_web') AND public.has_community_access())
);
CREATE OR REPLACE VIEW public.public_testimonials WITH (security_barrier=true) AS
 SELECT id,subject_name,caption,testimonial_text,playback_url,thumbnail_url
 FROM public.community_testimonials WHERE status='published' AND audience='public_web' AND deleted_at IS NULL
 AND consent_granted_at IS NOT NULL AND consent_version IS NOT NULL;
GRANT SELECT ON public.public_testimonials TO anon,authenticated;
COMMIT;
