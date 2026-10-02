-- Apply after 0022. Replaces permissive legacy policies; no records are deleted.
BEGIN;
CREATE INDEX IF NOT EXISTS mitra_messages_page ON public.messages(conversation_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS mitra_ai_history ON public.ai_messages(conversation_id,created_at DESC,id DESC);

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Sensitive account columns remain available only to their owner and admins.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN
      ('profiles','conversations','conversation_participants','messages','notifications','ai_conversations','ai_messages','profile_comments','natal_charts')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename); END LOOP;
END $$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_account ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY profiles_update_account ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin()) WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY profiles_admin_delete ON public.profiles FOR DELETE TO authenticated
  USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE field text;
BEGIN
  IF current_user IN ('anon','authenticated') AND NOT public.is_platform_admin() THEN
    FOREACH field IN ARRAY ARRAY['role','has_lifetime_access','xp','level','streak_days','last_activity_date','email','stripe_customer_id'] LOOP
      IF (to_jsonb(NEW)->field) IS DISTINCT FROM (to_jsonb(OLD)->field) THEN
        RAISE EXCEPTION 'Account authority is managed by the server' USING ERRCODE = '42501';
      END IF;
    END LOOP;
    IF NEW.access_status IS DISTINCT FROM OLD.access_status AND NEW.access_status <> 'suspended' THEN
      RAISE EXCEPTION 'Access is managed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_profile_authority ON public.profiles;
CREATE TRIGGER protect_profile_authority BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_authority();

-- Deliberate public projection: no email, birth data, billing data or access flags.
CREATE OR REPLACE VIEW public.member_profiles WITH (security_barrier = true) AS
 SELECT id, full_name, avatar_url, role, level, xp, bio, profile_visibility, allow_direct_messages
 FROM public.profiles
 WHERE id = auth.uid() OR public.is_platform_admin()
    OR profile_visibility = 'public'
    OR (profile_visibility = 'community' AND auth.uid() IS NOT NULL);
GRANT SELECT ON public.member_profiles TO anon, authenticated;

-- Older installations used different argument names. Keep that helper disabled
-- rather than replacing its signature or cascading away dependent objects.
DO $$ BEGIN
 IF to_regprocedure('public.is_conversation_participant(uuid,uuid)') IS NOT NULL THEN
   REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid,uuid) FROM PUBLIC,anon,authenticated;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.mitra_is_conversation_participant(p_conv_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT p_user_id = auth.uid() AND EXISTS (
   SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = p_conv_id AND cp.user_id = p_user_id
 );
$$;
CREATE OR REPLACE FUNCTION public.can_send_direct_message(p_conv_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.mitra_is_conversation_participant(p_conv_id, auth.uid())
 AND NOT EXISTS (SELECT 1 FROM public.conversation_participants cp JOIN public.profiles p ON p.id = cp.user_id
   WHERE cp.conversation_id = p_conv_id AND cp.user_id <> auth.uid() AND p.allow_direct_messages = false);
$$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_read_participant ON public.conversations FOR SELECT TO authenticated
 USING (public.mitra_is_conversation_participant(id, auth.uid()));
CREATE POLICY participants_read_conversation ON public.conversation_participants FOR SELECT TO authenticated
 USING (public.mitra_is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY participants_read_receipt ON public.conversation_participants FOR UPDATE TO authenticated
 USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- UPDATE of participation identifiers is not granted; only the read timestamp.
REVOKE INSERT, DELETE, UPDATE ON public.conversation_participants FROM anon, authenticated;
GRANT UPDATE (last_read_at) ON public.conversation_participants TO authenticated;
REVOKE INSERT, DELETE, UPDATE ON public.conversations FROM anon, authenticated;
CREATE POLICY messages_read_participant ON public.messages FOR SELECT TO authenticated
 USING (public.mitra_is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY messages_send_participant ON public.messages FOR INSERT TO authenticated
 WITH CHECK (sender_id = auth.uid() AND public.can_send_direct_message(conversation_id) AND char_length(btrim(body)) BETWEEN 1 AND 2000);

-- Creation is atomic, serialized per user pair, and cannot join an arbitrary room.
CREATE OR REPLACE FUNCTION public.start_direct_conversation(p_other_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); result uuid;
BEGIN
 IF me IS NULL OR me = p_other_user_id THEN RAISE EXCEPTION 'Invalid recipient' USING ERRCODE = '42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = me AND
    (role IN ('admin','mentor') OR has_lifetime_access OR access_status <> 'suspended')) THEN
   RAISE EXCEPTION 'Account unavailable' USING ERRCODE = '42501';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_other_user_id AND allow_direct_messages
    AND profile_visibility <> 'private') THEN RAISE EXCEPTION 'Recipient unavailable' USING ERRCODE = '42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(LEAST(me::text,p_other_user_id::text)||':'||GREATEST(me::text,p_other_user_id::text),0));
 SELECT a.conversation_id INTO result FROM public.conversation_participants a
 JOIN public.conversation_participants b USING(conversation_id)
 WHERE a.user_id = me AND b.user_id = p_other_user_id
 AND (SELECT count(*) FROM public.conversation_participants c WHERE c.conversation_id = a.conversation_id) = 2 LIMIT 1;
 IF result IS NULL THEN
   INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO result;
   INSERT INTO public.conversation_participants(conversation_id,user_id) VALUES(result,me),(result,p_other_user_id);
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.start_direct_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_direct_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_message_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS touch_message_conversation ON public.messages;
CREATE TRIGGER touch_message_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_message_conversation();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read_owner ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_update_owner ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
REVOKE INSERT ON public.notifications FROM anon, authenticated;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_conversations_owner ON public.ai_conversations FOR ALL TO authenticated
 USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ai_messages_owner ON public.ai_messages FOR ALL TO authenticated
 USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
 WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY wall_read_visible_profile ON public.profile_comments FOR SELECT TO authenticated
 USING (EXISTS (SELECT 1 FROM public.member_profiles p WHERE p.id = profile_id));
CREATE POLICY wall_write_visible_profile ON public.profile_comments FOR INSERT TO authenticated
 WITH CHECK (author_id = auth.uid() AND char_length(btrim(content)) BETWEEN 1 AND 1000
 AND EXISTS (SELECT 1 FROM public.member_profiles p WHERE p.id = profile_id));
CREATE POLICY wall_delete_author ON public.profile_comments FOR DELETE TO authenticated
 USING (author_id = auth.uid() OR public.is_platform_admin());

ALTER TABLE public.natal_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY natal_chart_owner ON public.natal_charts FOR ALL TO authenticated
 USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- The inbox transfers one summary per room, never a user's entire message history.
CREATE OR REPLACE FUNCTION public.direct_conversation_summaries()
RETURNS TABLE(conversation_id uuid, body text, created_at timestamptz, sender_id uuid, unread_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT cp.conversation_id, last.body, last.created_at, last.sender_id,
   (SELECT count(*) FROM public.messages m WHERE m.conversation_id = cp.conversation_id
     AND m.sender_id <> auth.uid() AND m.created_at > COALESCE(cp.last_read_at,'epoch'::timestamptz))
 FROM public.conversation_participants cp
 LEFT JOIN LATERAL (SELECT m.body,m.created_at,m.sender_id FROM public.messages m
   WHERE m.conversation_id = cp.conversation_id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) last ON true
 WHERE cp.user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.direct_conversation_summaries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direct_conversation_summaries() TO authenticated;

-- Private Realtime topics: message bodies use Postgres Changes with table RLS.
-- Only typing/presence travels via the private chat channel.
CREATE OR REPLACE FUNCTION public.can_access_chat_topic(topic text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT CASE WHEN topic ~ '^chat:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   THEN public.mitra_is_conversation_participant(substring(topic FROM 6)::uuid,auth.uid()) ELSE false END;
$$;
DO $$ BEGIN
 IF to_regclass('realtime.messages') IS NOT NULL THEN
   EXECUTE 'DROP POLICY IF EXISTS mitra_private_chat_read ON realtime.messages';
   EXECUTE 'DROP POLICY IF EXISTS mitra_private_chat_write ON realtime.messages';
   EXECUTE 'DROP POLICY IF EXISTS mitra_private_chat_read_guard ON realtime.messages';
   EXECUTE 'DROP POLICY IF EXISTS mitra_private_chat_write_guard ON realtime.messages';
   EXECUTE 'CREATE POLICY mitra_private_chat_read ON realtime.messages FOR SELECT TO authenticated USING (public.can_access_chat_topic(realtime.topic()))';
   EXECUTE 'CREATE POLICY mitra_private_chat_write ON realtime.messages FOR INSERT TO authenticated WITH CHECK (public.can_access_chat_topic(realtime.topic()))';
   -- Restrictive guards also block legacy permissive policies on chat topics.
   EXECUTE $policy$CREATE POLICY mitra_private_chat_read_guard ON realtime.messages AS RESTRICTIVE FOR SELECT TO authenticated USING (realtime.topic() NOT LIKE 'chat:%' OR public.can_access_chat_topic(realtime.topic()))$policy$;
   EXECUTE $policy$CREATE POLICY mitra_private_chat_write_guard ON realtime.messages AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (realtime.topic() NOT LIKE 'chat:%' OR public.can_access_chat_topic(realtime.topic()))$policy$;
 END IF;
END $$;
GRANT SELECT ON public.conversations,public.conversation_participants,public.messages TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
COMMIT;
