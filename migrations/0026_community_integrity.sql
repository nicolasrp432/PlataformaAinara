BEGIN;
CREATE OR REPLACE FUNCTION public.has_community_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
 AND (p.access_status = 'approved' OR p.has_lifetime_access OR p.role IN ('admin','mentor')));
$$;
REVOKE ALL ON FUNCTION public.has_community_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_community_access() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_read_reflection(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS(SELECT 1 FROM public.reflections r WHERE r.id = p_id AND auth.uid() IS NOT NULL
 AND (r.user_id = auth.uid() OR (r.is_public AND CASE WHEN r.lesson_id IS NULL THEN public.has_community_access() ELSE public.can_access_lesson(r.lesson_id) END)));
$$;
REVOKE ALL ON FUNCTION public.can_read_reflection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_reflection(uuid) TO authenticated;

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_reactions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE rule record; BEGIN
 FOR rule IN SELECT tablename,policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('reflections','reflection_reactions') LOOP
   EXECUTE format('DROP POLICY %I ON public.%I',rule.policyname,rule.tablename);
 END LOOP;
END $$;
CREATE POLICY reflections_read ON public.reflections FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.can_read_reflection(id));
CREATE POLICY reflections_write ON public.reflections FOR INSERT TO authenticated WITH CHECK(
 user_id = auth.uid() AND char_length(btrim(content)) BETWEEN 1 AND 4000
 AND CASE WHEN lesson_id IS NULL THEN public.has_community_access() ELSE public.can_access_lesson(lesson_id) END
 AND (parent_id IS NULL OR EXISTS(SELECT 1 FROM public.reflections parent WHERE parent.id = reflections.parent_id
   AND parent.is_public AND parent.lesson_id IS NOT DISTINCT FROM reflections.lesson_id)));
CREATE POLICY reflections_edit ON public.reflections FOR UPDATE TO authenticated USING(user_id = auth.uid()) WITH CHECK(user_id = auth.uid() AND char_length(btrim(content)) BETWEEN 1 AND 4000);
CREATE POLICY reflections_delete ON public.reflections FOR DELETE TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());
REVOKE UPDATE ON public.reflections FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.reflections TO authenticated;
GRANT UPDATE(content,is_public) ON public.reflections TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reflection_reactions_unique ON public.reflection_reactions(reflection_id,user_id,reaction_type);
CREATE POLICY reactions_read ON public.reflection_reactions FOR SELECT TO authenticated USING(public.can_read_reflection(reflection_id));
CREATE POLICY reactions_insert ON public.reflection_reactions FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid() AND public.can_read_reflection(reflection_id));
CREATE POLICY reactions_delete ON public.reflection_reactions FOR DELETE TO authenticated USING(user_id = auth.uid());
REVOKE UPDATE ON public.reflection_reactions FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.reflection_reactions TO authenticated;

-- Legacy increment RPCs may return void and allow repeated likes.
DO $$ BEGIN
 IF to_regprocedure('public.increment_reflection_likes(uuid)') IS NOT NULL THEN
   REVOKE ALL ON FUNCTION public.increment_reflection_likes(uuid) FROM PUBLIC,anon,authenticated;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.resonate_reflection(p_reflection_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted integer; total integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.can_read_reflection(p_reflection_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 INSERT INTO public.reflection_reactions(reflection_id,user_id,reaction_type) VALUES(p_reflection_id,auth.uid(),'resonate') ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted = ROW_COUNT;
 IF inserted = 1 THEN UPDATE public.reflections SET likes_count = COALESCE(likes_count,0)+1 WHERE id = p_reflection_id RETURNING likes_count INTO total;
 ELSE SELECT likes_count INTO total FROM public.reflections WHERE id = p_reflection_id; END IF;
 RETURN COALESCE(total,0);
END $$;
REVOKE ALL ON FUNCTION public.resonate_reflection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resonate_reflection(uuid) TO authenticated;
COMMIT;
