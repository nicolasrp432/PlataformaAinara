-- MITRA: activación del admin y rueda de la vida.
-- Ejecutar TODO en SQL Editor del proyecto suseccacxdfozgsxkmxx.
-- Una sola transacción. Se puede repetir: conserva datos y ejemplos editados.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('mitra:admin-migrations',0));
DO $check$ BEGIN
 IF to_regprocedure('public.is_platform_admin()') IS NULL
 OR to_regprocedure('public.mentorship_workspace()') IS NULL
 OR to_regclass('public.notification_campaigns') IS NULL
 OR to_regprocedure('public.has_community_access()') IS NULL
 OR to_regprocedure('public.complete_lesson(uuid)') IS NULL THEN
 RAISE EXCEPTION 'Faltan requisitos de la plataforma (0023–0026 o 009_notifications). No se ha aplicado ningún cambio.';
 END IF;
END $check$;

-- Private, append-only snapshots: users can compare their own history.

CREATE TABLE IF NOT EXISTS public.life_wheel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores jsonb NOT NULL,
  focus text NOT NULL CHECK (focus IN ('health','relationships','family','work','money','growth','leisure','environment')),
  intention text NOT NULL CHECK (length(trim(intention)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT life_wheel_scores_valid CHECK (
    jsonb_typeof(scores) = 'object'
    AND scores ?& ARRAY['health','relationships','family','work','money','growth','leisure','environment']
    AND (scores - ARRAY['health','relationships','family','work','money','growth','leisure','environment']) = '{}'::jsonb
    AND (scores->>'health') ~ '^(10|[1-9])$'
    AND (scores->>'relationships') ~ '^(10|[1-9])$'
    AND (scores->>'family') ~ '^(10|[1-9])$'
    AND (scores->>'work') ~ '^(10|[1-9])$'
    AND (scores->>'money') ~ '^(10|[1-9])$'
    AND (scores->>'growth') ~ '^(10|[1-9])$'
    AND (scores->>'leisure') ~ '^(10|[1-9])$'
    AND (scores->>'environment') ~ '^(10|[1-9])$'
    AND jsonb_typeof(scores->'health') = 'number'
    AND jsonb_typeof(scores->'relationships') = 'number'
    AND jsonb_typeof(scores->'family') = 'number'
    AND jsonb_typeof(scores->'work') = 'number'
    AND jsonb_typeof(scores->'money') = 'number'
    AND jsonb_typeof(scores->'growth') = 'number'
    AND jsonb_typeof(scores->'leisure') = 'number'
    AND jsonb_typeof(scores->'environment') = 'number'
  )
);
CREATE INDEX IF NOT EXISTS life_wheel_user_created_idx ON public.life_wheel_entries(user_id, created_at DESC);
ALTER TABLE public.life_wheel_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.life_wheel_entries FROM anon;
GRANT SELECT, INSERT, DELETE ON public.life_wheel_entries TO authenticated;
DROP POLICY IF EXISTS life_wheel_select_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_select_own ON public.life_wheel_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS life_wheel_insert_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_insert_own ON public.life_wheel_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS life_wheel_delete_own ON public.life_wheel_entries;
CREATE POLICY life_wheel_delete_own ON public.life_wheel_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

DO $testimonials$
BEGIN
 IF to_regclass('public.community_testimonials') IS NULL THEN
  EXECUTE $migration$
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
$migration$;
 END IF;
END $testimonials$;

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

-- 0030_admin_content.sql
-- Save the whole syllabus atomically. Reject stale, duplicate or foreign IDs.
CREATE OR REPLACE FUNCTION public.admin_reorder_curriculum(p_formation_id uuid, p_modules jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item jsonb; lesson jsonb; module_ids uuid[]; lesson_ids uuid[]; actual_modules uuid[]; actual_lessons uuid[]; position integer := 0; lesson_position integer;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 PERFORM 1 FROM formations WHERE id = p_formation_id FOR UPDATE;
 IF NOT FOUND OR COALESCE(jsonb_typeof(p_modules),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid formation'; END IF;
 SELECT array_agg((v->>'id')::uuid ORDER BY (v->>'id')::uuid) INTO module_ids FROM jsonb_array_elements(p_modules) v;
 SELECT array_agg((v#>>'{}')::uuid ORDER BY (v#>>'{}')::uuid) INTO lesson_ids FROM jsonb_array_elements(p_modules) m CROSS JOIN LATERAL jsonb_array_elements(m->'lessons') v;
 SELECT array_agg(id ORDER BY id) INTO actual_modules FROM modules WHERE formation_id = p_formation_id;
 SELECT array_agg(l.id ORDER BY l.id) INTO actual_lessons FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id = p_formation_id;
 IF module_ids IS DISTINCT FROM actual_modules OR lesson_ids IS DISTINCT FROM actual_lessons THEN RAISE EXCEPTION 'El temario ha cambiado. Recarga antes de ordenar.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_modules) LOOP
  UPDATE modules SET sort_order = position WHERE id = (item->>'id')::uuid;
  position := position + 1; lesson_position := 0;
  FOR lesson IN SELECT value FROM jsonb_array_elements(item->'lessons') LOOP
   UPDATE lessons SET module_id = (item->>'id')::uuid, sort_order = lesson_position WHERE id = (lesson#>>'{}')::uuid;
   lesson_position := lesson_position + 1;
  END LOOP;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.admin_reorder_curriculum(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reorder_curriculum(uuid,jsonb) TO authenticated;

-- Quiz and options are one transaction. Existing attempt records remain attached.
CREATE OR REPLACE FUNCTION public.admin_save_quiz(p_id uuid, p_data jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE quiz_id uuid; question_id uuid; question jsonb; option jsonb; qi integer := 0; oi integer;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF COALESCE(jsonb_typeof(p_data),'null') <> 'object' OR COALESCE(jsonb_typeof(p_data->'questions'),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid quiz'; END IF;
 IF NOT EXISTS(SELECT 1 FROM lessons WHERE id=(p_data->>'lessonId')::uuid AND content_type='quiz')
 OR char_length(btrim(COALESCE(p_data->>'title',''))) NOT BETWEEN 1 AND 200
 OR COALESCE((p_data->>'passing_score')::integer,0) NOT BETWEEN 1 AND 100
 OR COALESCE((p_data->>'xp_reward')::integer,-1) NOT BETWEEN 0 AND 10000
 OR jsonb_array_length(p_data->'questions') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid quiz'; END IF;
 IF p_id IS NULL THEN
  INSERT INTO quizzes(lesson_id,title,description,passing_score,xp_reward) VALUES((p_data->>'lessonId')::uuid,p_data->>'title',p_data->>'description',(p_data->>'passing_score')::integer,(p_data->>'xp_reward')::integer) RETURNING id INTO quiz_id;
 ELSE
  UPDATE quizzes SET title=p_data->>'title',description=p_data->>'description',passing_score=(p_data->>'passing_score')::integer,xp_reward=(p_data->>'xp_reward')::integer,updated_at=now()
   WHERE id=p_id AND lesson_id=(p_data->>'lessonId')::uuid RETURNING id INTO quiz_id;
  IF quiz_id IS NULL THEN RAISE EXCEPTION 'Quiz unavailable'; END IF;
  DELETE FROM quiz_options WHERE quiz_options.question_id IN (SELECT id FROM quiz_questions WHERE quiz_questions.quiz_id=p_id);
  DELETE FROM quiz_questions WHERE quiz_questions.quiz_id=p_id;
 END IF;
 FOR question IN SELECT value FROM jsonb_array_elements(p_data->'questions') LOOP
  IF COALESCE(jsonb_typeof(question->'options'),'null') <> 'array' THEN RAISE EXCEPTION 'Invalid options'; END IF;
  IF char_length(btrim(COALESCE(question->>'question',''))) NOT BETWEEN 1 AND 2000 OR COALESCE(question->>'type','') NOT IN ('multiple_choice','true_false')
  OR jsonb_array_length(question->'options') NOT BETWEEN 2 AND 6
  OR (question->>'type'='true_false' AND jsonb_array_length(question->'options')<>2)
  OR (SELECT count(*) FROM jsonb_array_elements(question->'options') o WHERE (o->>'is_correct')::boolean) <> 1 THEN RAISE EXCEPTION 'Invalid question'; END IF;
  INSERT INTO quiz_questions(quiz_id,question,type,explanation,sort_order) VALUES(quiz_id,question->>'question',question->>'type',question->>'explanation',qi) RETURNING id INTO question_id;
  qi := qi+1; oi := 0;
  FOR option IN SELECT value FROM jsonb_array_elements(question->'options') LOOP
   IF char_length(btrim(COALESCE(option->>'option_text',''))) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Invalid option'; END IF;
   INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order) VALUES(question_id,option->>'option_text',(option->>'is_correct')::boolean,oi);
   oi := oi+1;
  END LOOP;
 END LOOP;
 RETURN quiz_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_save_quiz(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_save_quiz(uuid,jsonb) TO authenticated;

-- 0031_emulsion_learning_examples.sql
-- Four editable learning steps inserted in the middle of an existing module.
-- Preserve all existing lesson IDs/content and their relative order. Never create
-- an unrelated formation, republish a draft module or overwrite edited examples.
DO $$
DECLARE course uuid; target_module uuid; existing_ids uuid[]; new_ids uuid[] := ARRAY[]::uuid[]; ordered_ids uuid[]:=ARRAY[]::uuid[]; lesson_id uuid; quiz_id uuid; question_id uuid; item jsonb; question jsonb; option jsonb; idx integer; qi integer; oi integer; anchor integer; total integer;
BEGIN
 SELECT id INTO course FROM formations
 WHERE translate(lower(slug),'áéíóúü','aeiouu') LIKE 'emulsi%energ%'
 OR translate(lower(title),'áéíóúü','aeiouu') LIKE 'emulsi%energ%'
 ORDER BY is_published DESC,id LIMIT 1;
 IF course IS NULL THEN RAISE NOTICE 'Emulsión Energética no existe: no se insertan ejemplos.'; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.formation_id=course AND l.slug LIKE 'emulsion-ejemplo-%') THEN RETURN; END IF;
 SELECT m.id INTO target_module FROM modules m WHERE m.formation_id=course AND EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id)
 ORDER BY m.is_published DESC,m.sort_order,m.id
 OFFSET (SELECT count(*)/2 FROM modules m WHERE m.formation_id=course AND m.is_published AND EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id)) LIMIT 1;
 IF target_module IS NULL THEN RAISE NOTICE 'La formación no tiene lecciones: añade un módulo antes de cargar los ejemplos.'; RETURN; END IF;
 PERFORM 1 FROM formations WHERE id=course FOR UPDATE;
 SELECT array_agg(id ORDER BY sort_order,id) INTO existing_ids FROM lessons WHERE module_id=target_module;
 total:=cardinality(existing_ids); anchor:=GREATEST(1,total/2);
 FOR item IN SELECT value FROM jsonb_array_elements($json$[
 {"slug":"emulsion-ejemplo-pausa","title":"Pausa de integración: reconocer tu punto de partida","type":"text","body":"## Una pausa para observar\n\nAntes de avanzar, dedica unos minutos a reconocer cómo llegas a esta parte de la formación. No necesitas sentirte de una manera concreta: empieza por lo que puedes observar.\n\n### Tres preguntas para tu cuaderno\n\n- ¿Qué sensaciones noto ahora mismo?\n- ¿Qué situaciones han ocupado mi atención hoy?\n- ¿Qué necesito para seguir aprendiendo con calma?\n\n### Separa observación e interpretación\n\n**Observación:** hoy he cambiado de tarea varias veces.\n\n**Interpretación:** no soy capaz de concentrarme.\n\nLa primera describe algo concreto; la segunda añade un juicio. Prueba a reformular una frase de tu cuaderno como una observación.\n\n### Integra lo aprendido\n\nElige una acción pequeña: cerrar una pestaña, beber agua o hacer una pausa breve. Anota qué eliges y continúa a tu ritmo.\n\n*Lectura de ejemplo para explorar el recorrido de Emulsión Energética.*"},
 {"slug":"emulsion-ejemplo-observar","title":"Comprueba lo aprendido: observar sin juzgar","type":"quiz","questions":[{"text":"¿Cuál de estas frases describe una observación concreta?","explanation":"Una observación describe un hecho específico, sin convertirlo en un juicio sobre tu identidad.","options":["Hoy he cambiado de tarea tres veces.","Nunca soy capaz de concentrarme.","Todo me sale mal."]},{"text":"¿Qué propone la pausa de integración?","explanation":"La propuesta es reconocer el punto de partida y elegir una acción pequeña que puedas realizar.","options":["Reconocer cómo llego y elegir una acción pequeña.","Forzarme a sentir una emoción concreta.","Resolver todos mis problemas antes de continuar."]}]},
 {"slug":"emulsion-ejemplo-practica","title":"Del aprendizaje a una práctica cotidiana","type":"text","body":"## Un paso que cabe en tu día\n\nAprender también consiste en probar una idea en una situación real. Elige algo de las lecciones anteriores que quieras explorar esta semana.\n\n### Diseña tu práctica\n\n- **Situación:** ¿en qué momento concreto lo vas a intentar?\n- **Acción:** ¿qué harás durante dos o tres minutos?\n- **Recordatorio:** ¿qué te ayudará a acordarte?\n\nPor ejemplo: al terminar mi jornada, escribiré una observación y una necesidad en el cuaderno que dejo sobre la mesa.\n\n### Revisa sin castigarte\n\nDespués de tres días, revisa qué ocurrió. Si la práctica no encaja, reduce su duración o cambia el momento. No se trata de cumplir una rutina perfecta, sino de descubrir qué puedes sostener.\n\n### Tu siguiente paso\n\nEscribe una frase: **Cuando termine…, dedicaré dos minutos a…**. Puedes guardar tu reflexión en tu diario personal y volver a ella cuando lo necesites.\n\n*Lectura de ejemplo para explorar el recorrido de Emulsión Energética.*"},
 {"slug":"emulsion-ejemplo-integrar","title":"Comprueba lo aprendido: integrar y ajustar","type":"quiz","questions":[{"text":"¿Qué hace que una práctica sea concreta?","explanation":"Relacionar una situación, una acción breve y un recordatorio permite llevar la intención al día a día.","options":["Definir un momento, una acción y un recordatorio.","Proponerse cambiar todo de inmediato.","Esperar a tener motivación perfecta."]},{"text":"Si la práctica no encaja en tu día, ¿qué puedes hacer?","explanation":"Ajustar el momento o la duración ayuda a encontrar una práctica sostenible.","options":["Revisar lo ocurrido y ajustar el momento o la duración.","Considerarlo un fracaso definitivo.","Aumentar siempre su dificultad."]}]}
]$json$::jsonb) LOOP
  INSERT INTO lessons(module_id,title,slug,description,transcript,content_type,duration_seconds,sort_order,is_published,is_free,xp_reward)
  VALUES(target_module,item->>'title',item->>'slug','Contenido de integración de ejemplo, editable desde administración.',item->>'body',item->>'type',180,0,true,false,25) RETURNING id INTO lesson_id;
  new_ids:=array_append(new_ids,lesson_id);
  IF item->>'type'='quiz' THEN
   INSERT INTO quizzes(lesson_id,title,description,passing_score,xp_reward) VALUES(lesson_id,item->>'title','Responde a dos preguntas para integrar la lectura. Puedes volver a intentarlo.',100,50) RETURNING id INTO quiz_id;
   qi:=0;
   FOR question IN SELECT value FROM jsonb_array_elements(item->'questions') LOOP
    INSERT INTO quiz_questions(quiz_id,question,type,explanation,sort_order) VALUES(quiz_id,question->>'text','multiple_choice',question->>'explanation',qi) RETURNING id INTO question_id;
    qi:=qi+1; oi:=0;
    FOR option IN SELECT value FROM jsonb_array_elements(question->'options') LOOP
     INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order) VALUES(question_id,option#>>'{}',oi=0,oi);
     oi:=oi+1;
    END LOOP;
   END LOOP;
  END IF;
 END LOOP;
 FOR idx IN 1..total LOOP
  ordered_ids:=array_append(ordered_ids,existing_ids[idx]);
  IF idx=anchor THEN ordered_ids:=ordered_ids||new_ids[1:2]; END IF;
  IF idx=LEAST(total,anchor+1) THEN ordered_ids:=ordered_ids||new_ids[3:4]; END IF;
 END LOOP;
 FOR idx IN 1..cardinality(ordered_ids) LOOP UPDATE lessons SET sort_order=idx-1 WHERE id=ordered_ids[idx]; END LOOP;
END $$;

-- 0032_admin_operations.sql
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

-- 0033_testimonial_audience.sql
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

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'Activación completada' AS resultado,
 (SELECT count(*) FROM public.lessons WHERE slug LIKE 'emulsion-ejemplo-%') AS lecciones_de_ejemplo,
 to_regclass('public.life_wheel_entries') IS NOT NULL AS rueda_disponible,
 to_regclass('public.community_testimonials') IS NOT NULL AS testimonios_disponibles;
