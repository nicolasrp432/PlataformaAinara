BEGIN;
-- Campaign delivery and its audit record commit together, including large audiences.
CREATE OR REPLACE FUNCTION public.admin_send_campaign(p_title text,p_body text,p_link text,p_audience jsonb,p_request_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE recipients integer; audience_type text := p_audience->>'type';
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('campaign:'||p_request_id::text,0));
 SELECT recipient_count INTO recipients FROM notification_campaigns WHERE id=p_request_id;
 IF FOUND THEN RETURN recipients; END IF;
 IF p_request_id IS NULL OR p_title IS NULL OR p_body IS NULL OR p_audience IS NULL THEN RAISE EXCEPTION 'Invalid campaign'; END IF;
 IF char_length(btrim(p_title)) NOT BETWEEN 1 AND 200 OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 2000
 OR (NULLIF(p_link,'') IS NOT NULL AND p_link <> '/' AND p_link !~ '^(/[^/\\]|https://)[^[:space:]\\]*$')
 OR audience_type NOT IN ('all','role','formation','user_ids')
 OR (audience_type='role' AND p_audience->>'value' NOT IN ('student','mentor')) THEN RAISE EXCEPTION 'Invalid campaign'; END IF;
 INSERT INTO notifications(user_id,kind,title,body,link,created_by,metadata)
 SELECT p.id,'admin_announcement',btrim(p_title),btrim(p_body),NULLIF(p_link,''),auth.uid(),jsonb_build_object('campaign_id',p_request_id)
 FROM profiles p WHERE audience_type='all'
 OR (audience_type='role' AND p.role::text=p_audience->>'value')
 OR (audience_type='formation' AND EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id=p.id AND e.formation_id=(p_audience->>'value')::uuid))
 OR (audience_type='user_ids' AND p.id IN (SELECT value::uuid FROM jsonb_array_elements_text(p_audience->'value')));
 GET DIAGNOSTICS recipients=ROW_COUNT;
 IF recipients=0 THEN RAISE EXCEPTION 'La audiencia no contiene destinatarios'; END IF;
 INSERT INTO notification_campaigns(id,created_by,audience,channel,title,body,link,recipient_count)
 VALUES(p_request_id,auth.uid(),p_audience,'in_app',btrim(p_title),btrim(p_body),NULLIF(p_link,''),recipients);
 RETURN recipients;
END $$;
REVOKE ALL ON FUNCTION public.admin_send_campaign(text,text,text,jsonb,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_send_campaign(text,text,text,jsonb,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_mentor(p_id uuid,p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved_mentor_id uuid; slot jsonb; blocked jsonb; starts time; ends time;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF COALESCE(jsonb_typeof(p_data->'availability'),'null') <> 'array' OR COALESCE(jsonb_typeof(p_data->'blockedDates'),'null') <> 'array' OR p_data->>'active' IS NULL THEN RAISE EXCEPTION 'Invalid calendar'; END IF;
 IF char_length(btrim(COALESCE(p_data->>'name',''))) NOT BETWEEN 1 AND 160
 OR COALESCE((p_data->>'duration')::integer,0) NOT BETWEEN 15 AND 240 OR COALESCE((p_data->>'price')::numeric,-1) NOT BETWEEN 0 AND 10000
 OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=p_data->>'timezone')
 OR jsonb_array_length(p_data->'availability')>35 OR jsonb_array_length(p_data->'blockedDates')>365 THEN RAISE EXCEPTION 'Invalid mentor'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('admin:mentor-settings',0));
 IF (p_data->>'active')::boolean AND EXISTS(SELECT 1 FROM mentors WHERE is_active AND id IS DISTINCT FROM p_id) THEN RAISE EXCEPTION 'Desactiva la otra agenda antes de activar esta'; END IF;
 IF NULLIF(p_data->>'userId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id=(p_data->>'userId')::uuid AND role IN ('admin','mentor')) THEN RAISE EXCEPTION 'El responsable debe ser administrador o mentor'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO mentors(name,user_id,session_duration_minutes,session_price,timezone,is_active) VALUES(btrim(p_data->>'name'),NULLIF(p_data->>'userId','')::uuid,(p_data->>'duration')::integer,(p_data->>'price')::numeric,p_data->>'timezone',(p_data->>'active')::boolean) RETURNING id INTO saved_mentor_id;
 ELSE
  PERFORM 1 FROM mentors WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mentor unavailable'; END IF;
  saved_mentor_id:=p_id;
  UPDATE mentors SET name=btrim(p_data->>'name'),user_id=NULLIF(p_data->>'userId','')::uuid,session_duration_minutes=(p_data->>'duration')::integer,session_price=(p_data->>'price')::numeric,timezone=p_data->>'timezone',is_active=(p_data->>'active')::boolean WHERE id=saved_mentor_id;
 END IF;
 DELETE FROM mentor_availability WHERE mentor_availability.mentor_id=saved_mentor_id;
 FOR slot IN SELECT value FROM jsonb_array_elements(p_data->'availability') LOOP
  starts := (slot->>'start')::time; ends := (slot->>'end')::time;
  IF starts IS NULL OR ends IS NULL OR COALESCE((slot->>'day')::integer,-1) NOT BETWEEN 0 AND 6 OR starts>=ends OR extract(epoch FROM (ends-starts))/60 < (p_data->>'duration')::integer THEN RAISE EXCEPTION 'Franja demasiado corta'; END IF;
  IF EXISTS(SELECT 1 FROM mentor_availability a WHERE a.mentor_id=saved_mentor_id AND a.day_of_week=(slot->>'day')::integer AND a.start_time::time<ends AND a.end_time::time>starts) THEN RAISE EXCEPTION 'Las franjas no pueden solaparse'; END IF;
  INSERT INTO mentor_availability(mentor_id,day_of_week,start_time,end_time,is_active) VALUES(saved_mentor_id,(slot->>'day')::integer,starts,ends,true);
 END LOOP;
 DELETE FROM mentor_blocked_dates WHERE mentor_blocked_dates.mentor_id=saved_mentor_id;
 FOR blocked IN SELECT value FROM jsonb_array_elements(p_data->'blockedDates') LOOP
  INSERT INTO mentor_blocked_dates(mentor_id,blocked_date) VALUES(saved_mentor_id,(blocked#>>'{}')::date);
 END LOOP;
 RETURN saved_mentor_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_save_mentor(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_mentor(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_close_mentorship(p_id uuid,p_status text,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE booking public.mentorship_sessions%ROWTYPE;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF COALESCE(p_status,'') NOT IN ('cancelled','no_show') OR char_length(btrim(COALESCE(p_reason,''))) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Indica el motivo'; END IF;
 SELECT * INTO booking FROM mentorship_sessions WHERE id=p_id;
 PERFORM 1 FROM mentors WHERE id=booking.mentor_id FOR UPDATE;
 SELECT * INTO booking FROM mentorship_sessions WHERE id=p_id FOR UPDATE;
 IF booking.id IS NULL OR booking.status NOT IN ('pending','confirmed') OR (p_status='no_show' AND (booking.status<>'confirmed' OR booking.scheduled_at>now())) THEN RAISE EXCEPTION 'Transición de estado no válida'; END IF;
 UPDATE mentorship_sessions SET status=p_status,hold_expires_at=NULL WHERE id=p_id;
 INSERT INTO notifications(user_id,kind,title,body,link,created_by) VALUES(booking.user_id,'system',CASE WHEN p_status='cancelled' THEN 'Mentoría cancelada' ELSE 'Ausencia registrada en mentoría' END,btrim(p_reason),'/mentorship',auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.admin_close_mentorship(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_close_mentorship(uuid,text,text) TO authenticated;

-- Notify only when the visible meeting link changes (never send private notes).
CREATE OR REPLACE FUNCTION public.notify_mentorship_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='confirmed' AND NEW.meeting_link IS DISTINCT FROM OLD.meeting_link AND NULLIF(NEW.meeting_link,'') IS NOT NULL THEN
  INSERT INTO notifications(user_id,kind,title,body,link) VALUES(NEW.user_id,'system','Enlace de tu mentoría disponible','Consulta tu agenda para acceder al encuentro.','/mentorship');
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mentorship_link_notification ON mentorship_sessions;
CREATE TRIGGER mentorship_link_notification AFTER UPDATE ON mentorship_sessions FOR EACH ROW EXECUTE FUNCTION public.notify_mentorship_update();

CREATE OR REPLACE FUNCTION public.admin_issue_certificate(p_user_id uuid,p_formation_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE certificate uuid;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text||':formation:'||p_formation_id::text,0));
 IF NOT EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id=p_formation_id AND l.is_published AND m.is_published)
 OR EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id=p_formation_id AND l.is_published AND m.is_published AND NOT EXISTS(SELECT 1 FROM user_progress p WHERE p.user_id=p_user_id AND p.lesson_id=l.id AND p.is_completed)) THEN RAISE EXCEPTION 'El alumno debe completar todas las lecciones publicadas'; END IF;
 INSERT INTO certificates(user_id,formation_id) VALUES(p_user_id,p_formation_id) ON CONFLICT(user_id,formation_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING id INTO certificate;
 RETURN certificate;
END $$;
REVOKE ALL ON FUNCTION public.admin_issue_certificate(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_issue_certificate(uuid,uuid) TO authenticated;
COMMIT;
