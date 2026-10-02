BEGIN;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_lesson_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id JOIN public.formations f ON f.id = m.formation_id
  JOIN public.profiles p ON p.id = auth.uid()
  WHERE l.id = p_lesson_id AND (
   p.role IN ('admin','mentor') OR (
    l.is_published AND m.is_published AND f.is_published
    AND (p.access_status = 'approved' OR COALESCE(p.has_lifetime_access,false)
      OR (COALESCE(p.access_status,'pending') <> 'suspended' AND (l.is_free OR l.id = (
        SELECT first.id FROM public.lessons first JOIN public.modules fm ON fm.id = first.module_id
        WHERE fm.formation_id = f.id AND fm.is_published AND first.is_published
        ORDER BY fm.sort_order,fm.id,first.sort_order,first.id LIMIT 1
      ))))
   )
  )
 );
$$;
REVOKE ALL ON FUNCTION public.can_access_lesson(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid) TO authenticated;

DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT tablename,policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('modules','lessons','user_progress','enrollments','quizzes','quiz_questions','quiz_options','quiz_attempts','certificates') LOOP
  EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
 END LOOP;
END $$;
CREATE POLICY modules_published_read ON public.modules FOR SELECT USING(is_published AND EXISTS(SELECT 1 FROM public.formations f WHERE f.id = formation_id AND f.is_published));
CREATE POLICY modules_admin_write ON public.modules FOR ALL TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE POLICY quizzes_lesson_read ON public.quizzes FOR SELECT TO authenticated USING(public.can_access_lesson(lesson_id));
CREATE POLICY quizzes_admin_write ON public.quizzes FOR ALL TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE OR REPLACE VIEW public.quiz_prompts WITH (security_barrier = true) AS
 SELECT q.id,q.quiz_id,q.question,q.type,q.sort_order FROM public.quiz_questions q JOIN public.quizzes quiz ON quiz.id = q.quiz_id
 WHERE public.can_access_lesson(quiz.lesson_id);
GRANT SELECT ON public.quiz_prompts TO authenticated;
CREATE POLICY questions_admin_write ON public.quiz_questions FOR ALL TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE POLICY lesson_content_access ON public.lessons FOR SELECT TO authenticated USING(public.can_access_lesson(id));
CREATE POLICY lesson_admin_write ON public.lessons FOR ALL TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
-- Safe public curriculum metadata is separate from video URLs and lesson content.
CREATE OR REPLACE VIEW public.lesson_catalog WITH (security_barrier = true) AS
 SELECT l.id,l.module_id,l.title,l.slug,l.duration_seconds,l.is_free,l.sort_order,l.xp_reward,l.content_type
 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id JOIN public.formations f ON f.id = m.formation_id
 WHERE (l.is_published AND m.is_published AND f.is_published) OR public.is_platform_admin();
GRANT SELECT ON public.lesson_catalog TO anon,authenticated;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrollments_read_owner ON public.enrollments FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY enrollments_insert_owner ON public.enrollments FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid() AND completed_at IS NULL AND COALESCE(progress_percent,0) = 0 AND status = 'active'
 AND EXISTS(SELECT 1 FROM public.formations f WHERE f.id = formation_id AND f.is_published)
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (COALESCE(p.access_status,'pending') <> 'suspended' OR p.has_lifetime_access OR p.role IN ('admin','mentor'))));
CREATE POLICY enrollments_delete_owner ON public.enrollments FOR DELETE TO authenticated USING(user_id = auth.uid());
REVOKE UPDATE ON public.enrollments FROM anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.enrollments TO authenticated;

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_read_owner ON public.user_progress FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());
REVOKE INSERT,UPDATE,DELETE ON public.user_progress FROM anon,authenticated;
CREATE POLICY quiz_options_admin ON public.quiz_options FOR ALL TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE OR REPLACE VIEW public.quiz_choices WITH (security_barrier = true) AS
 SELECT o.id,o.question_id,o.option_text,o.sort_order FROM public.quiz_options o
 JOIN public.quiz_questions q ON q.id = o.question_id JOIN public.quizzes quiz ON quiz.id = q.quiz_id
 WHERE public.can_access_lesson(quiz.lesson_id);
GRANT SELECT ON public.quiz_choices TO authenticated;
CREATE POLICY attempts_read_owner ON public.quiz_attempts FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());
REVOKE INSERT,UPDATE,DELETE ON public.quiz_attempts FROM anon,authenticated;
CREATE POLICY certificates_read_owner ON public.certificates FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());
REVOKE INSERT,UPDATE,DELETE ON public.certificates FROM anon,authenticated;

CREATE TABLE IF NOT EXISTS public.xp_awards (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 source text NOT NULL,source_id text NOT NULL,amount integer NOT NULL CHECK(amount BETWEEN 1 AND 10000),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,source,source_id)
);
ALTER TABLE public.xp_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xp_awards_owner ON public.xp_awards;
CREATE POLICY xp_awards_owner ON public.xp_awards FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.award_activity_xp(p_user_id uuid,p_amount integer,p_source text,p_source_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE profile public.profiles%ROWTYPE; inserted integer; amount integer := 0; previous_level integer;
BEGIN
 SELECT * INTO profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
 IF profile.id IS NULL OR p_amount NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid XP award' USING ERRCODE = '22023'; END IF;
 INSERT INTO public.xp_awards(user_id,source,source_id,amount) VALUES(p_user_id,p_source,p_source_id,p_amount) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted = ROW_COUNT;
 previous_level := COALESCE(profile.level,1);
 IF inserted > 0 THEN
  amount := p_amount;
  UPDATE public.profiles SET xp = COALESCE(xp,0) + p_amount,level = floor((COALESCE(xp,0)+p_amount)::numeric / 500)::integer + 1,
   streak_days = CASE WHEN last_activity_date::date = (now() AT TIME ZONE 'UTC')::date THEN streak_days
      WHEN last_activity_date::date = (now() AT TIME ZONE 'UTC')::date - 1 THEN COALESCE(streak_days,0)+1 ELSE 1 END,
   last_activity_date = now() WHERE id = p_user_id RETURNING * INTO profile;
 END IF;
 RETURN jsonb_build_object('newXP',profile.xp,'newLevel',profile.level,'streakDays',profile.streak_days,'leveledUp',profile.level > previous_level,'xpEarned',amount);
END $$;
REVOKE ALL ON FUNCTION public.award_activity_xp(uuid,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_activity_xp(uuid,integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.save_lesson_progress(p_lesson_id uuid,p_seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE course uuid; duration integer; progress public.user_progress%ROWTYPE; position integer;
BEGIN
 IF NOT public.can_access_lesson(p_lesson_id) THEN RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE = '42501'; END IF;
 IF p_seconds NOT BETWEEN 0 AND 86400 THEN RAISE EXCEPTION 'Invalid position' USING ERRCODE = '22023'; END IF;
 SELECT m.formation_id,l.duration_seconds INTO course,duration FROM public.lessons l JOIN public.modules m ON m.id = l.module_id WHERE l.id = p_lesson_id;
 position := CASE WHEN COALESCE(duration,0) > 0 THEN LEAST(p_seconds,duration) ELSE p_seconds END;
 INSERT INTO public.enrollments(user_id,formation_id,status,enrolled_at) VALUES(auth.uid(),course,'active',now()) ON CONFLICT(user_id,formation_id) DO NOTHING;
 INSERT INTO public.user_progress(user_id,lesson_id,watched_seconds,last_position_seconds,progress_percent,is_completed,status)
 VALUES(auth.uid(),p_lesson_id,position,position,CASE WHEN COALESCE(duration,0) > 0 THEN LEAST(100,round(position::numeric/duration*100)::integer) ELSE 0 END,false,'in_progress')
 ON CONFLICT(user_id,lesson_id) DO UPDATE SET
 watched_seconds = GREATEST(user_progress.watched_seconds,EXCLUDED.watched_seconds),last_position_seconds = EXCLUDED.last_position_seconds,
 progress_percent = CASE WHEN user_progress.is_completed THEN 100 ELSE GREATEST(user_progress.progress_percent,EXCLUDED.progress_percent) END
 RETURNING * INTO progress;
 RETURN to_jsonb(progress);
END $$;
REVOKE ALL ON FUNCTION public.save_lesson_progress(uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_lesson_progress(uuid,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lesson public.lessons%ROWTYPE; progress public.user_progress%ROWTYPE; course uuid; reward integer; awarded jsonb; certificate uuid; total integer; completed integer;
BEGIN
 IF NOT public.can_access_lesson(p_lesson_id) THEN RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE = '42501'; END IF;
 SELECT * INTO lesson FROM public.lessons WHERE id = p_lesson_id;
 SELECT formation_id INTO course FROM public.modules WHERE id = lesson.module_id;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':formation:'||course::text,0));
 SELECT * INTO progress FROM public.user_progress WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;
 IF progress.is_completed THEN RETURN jsonb_build_object('alreadyCompleted',true,'xpEarned',0,'leveledUp',false,'certificateIssued',false); END IF;
 IF lesson.content_type = 'quiz' AND NOT EXISTS (SELECT 1 FROM public.quiz_attempts a JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE q.lesson_id = p_lesson_id AND a.user_id = auth.uid() AND a.passed) THEN RAISE EXCEPTION 'Pass the quiz first' USING ERRCODE = '42501'; END IF;
 PERFORM public.save_lesson_progress(p_lesson_id,COALESCE(lesson.duration_seconds,0));
 UPDATE public.user_progress SET is_completed = true,status = 'completed',progress_percent = 100,completed_at = now() WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;
 reward := COALESCE(lesson.xp_reward,50);
 IF lesson.content_type = 'quiz' THEN SELECT COALESCE(xp_reward,reward) INTO reward FROM public.quizzes WHERE lesson_id = p_lesson_id; END IF;
 IF reward > 0 THEN awarded := public.award_activity_xp(auth.uid(),LEAST(reward,10000),'lesson',p_lesson_id::text); ELSE awarded := '{"xpEarned":0,"leveledUp":false}'::jsonb; END IF;
 SELECT count(*),count(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.user_progress p WHERE p.user_id = auth.uid() AND p.lesson_id = l.id AND p.is_completed)) INTO total,completed
 FROM public.lessons l JOIN public.modules m ON m.id = l.module_id WHERE m.formation_id = course AND m.is_published AND l.is_published;
 UPDATE public.enrollments SET progress_percent = CASE WHEN total > 0 THEN round(100.0*completed/total)::integer ELSE 0 END WHERE user_id = auth.uid() AND formation_id = course;
 IF total > 0 AND completed = total THEN
  INSERT INTO public.certificates(user_id,formation_id) VALUES(auth.uid(),course) ON CONFLICT(user_id,formation_id) DO NOTHING RETURNING id INTO certificate;
  UPDATE public.enrollments SET status = 'completed',completed_at = now(),progress_percent = 100 WHERE user_id = auth.uid() AND formation_id = course;
 END IF;
 RETURN awarded || jsonb_build_object('alreadyCompleted',false,'certificateIssued',certificate IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;
COMMIT;
