BEGIN;
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Madrid';
ALTER TABLE public.mentorship_sessions ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;
-- Existing unpaid holds get a finite lifetime; confirmed sessions are unchanged.
UPDATE public.mentorship_sessions SET hold_expires_at = COALESCE(created_at,now()) + interval '31 minutes'
 WHERE status = 'pending' AND hold_expires_at IS NULL;
CREATE INDEX IF NOT EXISTS mentorship_blocked_calendar ON public.mentor_blocked_dates(mentor_id,blocked_date);
CREATE INDEX IF NOT EXISTS mentorship_busy_calendar ON public.mentorship_sessions(mentor_id,scheduled_at) WHERE status IN ('pending','confirmed');

CREATE OR REPLACE FUNCTION public.mentor_busy_intervals(p_mentor_id uuid,p_from timestamptz,p_to timestamptz)
RETURNS TABLE(scheduled_at timestamptz,duration_minutes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT s.scheduled_at,s.duration_minutes FROM public.mentorship_sessions s
 WHERE auth.uid() IS NOT NULL AND s.mentor_id = p_mentor_id
 AND (s.status = 'confirmed' OR (s.status = 'pending' AND s.hold_expires_at > now()))
 AND s.scheduled_at < p_to AND s.scheduled_at + make_interval(mins => s.duration_minutes) > p_from
 AND p_to <= p_from + interval '32 days';
$$;
REVOKE ALL ON FUNCTION public.mentor_busy_intervals(uuid,timestamptz,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mentor_busy_intervals(uuid,timestamptz,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.book_mentorship_session(p_mentor_id uuid,p_scheduled_at timestamptz,p_notes text DEFAULT NULL)
RETURNS TABLE(id uuid,status text,duration_minutes integer,price numeric,hold_expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE mentor public.mentors%ROWTYPE; account public.profiles%ROWTYPE; local_time timestamp; included boolean; booking uuid; expires timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthenticated' USING ERRCODE = '42501'; END IF;
 SELECT * INTO account FROM public.profiles WHERE profiles.id = auth.uid();
 IF account.id IS NULL OR NOT (COALESCE(account.access_status = 'approved',false) OR COALESCE(account.has_lifetime_access,false) OR COALESCE(account.role IN ('admin','mentor'),false)) THEN
   RAISE EXCEPTION 'Content access required' USING ERRCODE = '42501';
 END IF;
 SELECT * INTO mentor FROM public.mentors WHERE mentors.id = p_mentor_id AND is_active FOR UPDATE;
 IF mentor.id IS NULL THEN RAISE EXCEPTION 'Mentor unavailable' USING ERRCODE = '22023'; END IF;
 IF mentor.session_duration_minutes NOT BETWEEN 1 AND 480 OR p_scheduled_at <= now() OR p_scheduled_at > now() + interval '30 days' OR char_length(COALESCE(p_notes,'')) > 1000 THEN
   RAISE EXCEPTION 'Invalid booking' USING ERRCODE = '22023';
 END IF;
 local_time := p_scheduled_at AT TIME ZONE mentor.timezone;
 IF EXISTS (SELECT 1 FROM public.mentor_blocked_dates b WHERE b.mentor_id = mentor.id AND b.blocked_date = local_time::date)
 OR NOT EXISTS (SELECT 1 FROM public.mentor_availability a WHERE a.mentor_id = mentor.id AND a.is_active
   AND a.day_of_week = extract(dow FROM local_time)::integer
   AND local_time::time >= a.start_time::time
   AND (local_time + make_interval(mins => mentor.session_duration_minutes))::date = local_time::date
   AND (local_time + make_interval(mins => mentor.session_duration_minutes))::time <= a.end_time::time
   AND mod(extract(epoch FROM (local_time::time - a.start_time::time))::integer,mentor.session_duration_minutes * 60) = 0) THEN
   RAISE EXCEPTION 'Slot unavailable' USING ERRCODE = '23P01';
 END IF;
 IF EXISTS (SELECT 1 FROM public.mentorship_sessions s WHERE s.mentor_id = mentor.id
   AND (s.status = 'confirmed' OR (s.status = 'pending' AND s.hold_expires_at > now()))
   AND s.scheduled_at < p_scheduled_at + make_interval(mins => mentor.session_duration_minutes)
   AND s.scheduled_at + make_interval(mins => s.duration_minutes) > p_scheduled_at) THEN
   RAISE EXCEPTION 'Slot already booked' USING ERRCODE = '23P01';
 END IF;
 included := COALESCE(account.access_status = 'approved',false) OR COALESCE(account.role IN ('admin','mentor'),false);
 IF NOT included AND COALESCE(mentor.session_price,0) <= 0 THEN RAISE EXCEPTION 'Price not configured' USING ERRCODE = '22023'; END IF;
 expires := CASE WHEN included THEN NULL ELSE now() + interval '31 minutes' END;
 INSERT INTO public.mentorship_sessions(mentor_id,user_id,scheduled_at,duration_minutes,status,user_notes,hold_expires_at)
 VALUES(mentor.id,auth.uid(),p_scheduled_at,mentor.session_duration_minutes,CASE WHEN included THEN 'confirmed' ELSE 'pending' END,NULLIF(btrim(p_notes),''),expires) RETURNING mentorship_sessions.id INTO booking;
 RETURN QUERY SELECT booking,CASE WHEN included THEN 'confirmed' ELSE 'pending' END,mentor.session_duration_minutes,CASE WHEN included THEN 0::numeric ELSE mentor.session_price::numeric END,expires;
END $$;
REVOKE ALL ON FUNCTION public.book_mentorship_session(uuid,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_mentorship_session(uuid,timestamptz,text) TO authenticated;
-- Authenticated users cannot change statuses/payment references directly.
REVOKE INSERT,UPDATE,DELETE ON public.mentorship_sessions FROM anon,authenticated;

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL, notes text NOT NULL CHECK (char_length(btrim(notes)) BETWEEN 10 AND 1000),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','contacted','closed')), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mentorship_requests_owner_read ON public.mentorship_requests;
CREATE POLICY mentorship_requests_owner_read ON public.mentorship_requests FOR SELECT TO authenticated
 USING(user_id = auth.uid() OR public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid()));
DROP POLICY IF EXISTS mentorship_requests_owner_insert ON public.mentorship_requests;
CREATE POLICY mentorship_requests_owner_insert ON public.mentorship_requests FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid() AND status = 'pending'
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.access_status = 'approved' OR p.has_lifetime_access OR p.role IN ('admin','mentor')))
 AND (mentor_id IS NULL OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.is_active)));
GRANT SELECT,INSERT ON public.mentorship_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_mentorship_payment(p_session_id uuid,p_reference text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE booking public.mentorship_sessions%ROWTYPE;
BEGIN
 SELECT * INTO booking FROM public.mentorship_sessions WHERE id = p_session_id;
 IF booking.id IS NULL THEN RETURN false; END IF;
 PERFORM 1 FROM public.mentors WHERE id = booking.mentor_id FOR UPDATE;
 SELECT * INTO booking FROM public.mentorship_sessions WHERE id = p_session_id FOR UPDATE;
 IF booking.status = 'confirmed' AND booking.payment_reference = p_reference THEN RETURN true; END IF;
 IF booking.status <> 'pending' OR booking.scheduled_at <= now() OR (booking.payment_reference IS NOT NULL AND booking.payment_reference <> p_reference) OR EXISTS (SELECT 1 FROM public.mentorship_sessions s WHERE s.mentor_id = booking.mentor_id AND s.id <> booking.id
   AND (s.status = 'confirmed' OR (s.status = 'pending' AND s.hold_expires_at > now()))
   AND s.scheduled_at < booking.scheduled_at + make_interval(mins => booking.duration_minutes)
   AND s.scheduled_at + make_interval(mins => s.duration_minutes) > booking.scheduled_at) THEN RETURN false; END IF;
 UPDATE public.mentorship_sessions SET status = 'confirmed',payment_reference = p_reference,hold_expires_at = NULL WHERE id = booking.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.confirm_mentorship_payment(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_mentorship_payment(uuid,text) TO service_role;
-- Staff see only their assigned agenda; students see only their own sessions.
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE rule record; BEGIN
 FOR rule IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentorship_sessions' LOOP
   EXECUTE format('DROP POLICY %I ON public.mentorship_sessions',rule.policyname);
 END LOOP;
END $$;
CREATE POLICY mentorship_sessions_read ON public.mentorship_sessions FOR SELECT TO authenticated
 USING(user_id = auth.uid() OR public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid()));
REVOKE SELECT ON public.mentorship_sessions FROM authenticated;
GRANT SELECT(id,mentor_id,user_id,scheduled_at,duration_minutes,status,meeting_link,user_notes,payment_reference,created_at,hold_expires_at) ON public.mentorship_sessions TO authenticated;

CREATE OR REPLACE FUNCTION public.mentorship_workspace()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object(
 'sessions',COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM (
   SELECT s.id,s.user_id,s.scheduled_at,s.duration_minutes,s.status,s.meeting_link,s.notes,s.user_notes,p.full_name,m.timezone
   FROM public.mentorship_sessions s JOIN public.profiles p ON p.id = s.user_id JOIN public.mentors m ON m.id = s.mentor_id
   WHERE auth.uid() IS NOT NULL AND (public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = s.mentor_id AND m.user_id = auth.uid()))
   AND (s.status <> 'pending' OR s.hold_expires_at > now()) ORDER BY s.scheduled_at DESC LIMIT 100
 ) s),'[]'::jsonb),
 'requests',COALESCE((SELECT jsonb_agg(row_to_json(r)) FROM (
   SELECT r.id,r.user_id,r.notes,r.status,r.created_at,p.full_name FROM public.mentorship_requests r JOIN public.profiles p ON p.id = r.user_id
   WHERE auth.uid() IS NOT NULL AND (public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = r.mentor_id AND m.user_id = auth.uid()))
   ORDER BY r.created_at DESC LIMIT 50
 ) r),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.mentorship_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mentorship_workspace() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_mentorship_session(p_id uuid,p_meeting_link text,p_notes text,p_completed boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE session public.mentorship_sessions%ROWTYPE;
BEGIN
 SELECT * INTO session FROM public.mentorship_sessions WHERE id = p_id FOR UPDATE;
 IF auth.uid() IS NULL OR session.id IS NULL OR NOT (public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = session.mentor_id AND m.user_id = auth.uid())) THEN
   RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 IF char_length(COALESCE(p_meeting_link,'')) > 2048 OR (NULLIF(btrim(p_meeting_link),'') IS NOT NULL AND p_meeting_link !~ '^https://[^[:space:]]+$') OR char_length(COALESCE(p_notes,'')) > 4000 THEN
   RAISE EXCEPTION 'Invalid session data' USING ERRCODE = '22023';
 END IF;
 IF p_completed AND (session.status NOT IN ('confirmed','completed') OR session.scheduled_at > now()) THEN
   RAISE EXCEPTION 'Session not ready to complete' USING ERRCODE = '22023';
 END IF;
 UPDATE public.mentorship_sessions SET meeting_link = NULLIF(btrim(p_meeting_link),''),notes = NULLIF(btrim(p_notes),''),status = CASE WHEN p_completed THEN 'completed' ELSE status END WHERE id = p_id;
END $$;
REVOKE ALL ON FUNCTION public.update_mentorship_session(uuid,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_mentorship_session(uuid,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_mentorship_request(p_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR p_status NOT IN ('pending','contacted','closed') THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE = '22023'; END IF;
 UPDATE public.mentorship_requests r SET status = p_status WHERE r.id = p_id
 AND (public.is_platform_admin() OR EXISTS(SELECT 1 FROM public.mentors m WHERE m.id = r.mentor_id AND m.user_id = auth.uid()));
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.update_mentorship_request(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_mentorship_request(uuid,text) TO authenticated;
COMMIT;
